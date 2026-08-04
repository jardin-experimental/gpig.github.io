import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { createZoomMeeting } from '@/lib/zoom/server'

// Le webhook doit recevoir le corps brut pour vérifier la signature Stripe
export const runtime = 'nodejs'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = (await headers()).get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Signature manquante' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Signature webhook invalide', err)
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 })
  }

  const supabase = createServiceRoleClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.user_id
      const type = (session.metadata?.type ?? 'formation') as
        | 'formation'
        | 'pack'
        | 'abonnement'
        | 'consultation_heure'
        | 'consultation_pack10h'
        | 'pack_atomes'
        | 'boutique'

      if (!userId) break

      // --------------------------------------------------------------
      // Boutique (panier physique) : la commande a déjà été créée en
      // 'en_attente' par preparer_commande_panier_physique() avant la
      // redirection Stripe (même logique que le hold des créneaux de
      // consultation). On ne crée pas une nouvelle ligne, on met à jour
      // celle qui existe déjà via son id transmis en metadata.
      // --------------------------------------------------------------
      if (type === 'boutique') {
        const orderId = session.metadata?.order_id
        if (!orderId) break

        const { data: existing } = await supabase
          .from('orders')
          .select('id, statut')
          .eq('id', orderId)
          .maybeSingle()

        // Idempotence : commande introuvable ou déjà finalisée
        if (!existing || existing.statut === 'paye') break

        await supabase
          .from('orders')
          .update({
            stripe_session_id: session.id,
            stripe_payment_intent_id:
              typeof session.payment_intent === 'string' ? session.payment_intent : null,
            montant_centimes: session.amount_total ?? 0,
            tva_centimes: session.total_details?.amount_tax ?? 0,
            devise: session.currency ?? 'eur',
            statut: 'paye',
            adresse_livraison:
              session.collected_information?.shipping_details?.address ??
              session.customer_details?.address ??
              null,
          })
          .eq('id', orderId)

        // TODO : une fois un prestataire print-on-demand choisi
        // (Printful/Gelato/...), appeler son API ici avec l'adresse de
        // livraison (session.customer_details / collected_information)
        // et les lignes de boutique_commande_items liées à orderId, pour
        // déclencher l'impression + l'expédition automatiquement.

        // Ne retire du panier que les articles physiques de cette commande,
        // pour ne pas toucher d'éventuels articles numériques encore en attente.
        const { data: items } = await supabase
          .from('boutique_commande_items')
          .select('produit_id')
          .eq('order_id', orderId)

        if (items && items.length > 0) {
          await supabase
            .from('panier_items')
            .delete()
            .eq('user_id', userId)
            .in(
              'produit_id',
              items.map((i) => i.produit_id)
            )
        }

        break
      }

      // --------------------------------------------------------------
      // Tous les autres types : comportement inchangé, une nouvelle
      // ligne `orders` est créée pour cette session.
      // --------------------------------------------------------------
      const formationId = session.metadata?.formation_id
      const slotId = session.metadata?.slot_id

      // Idempotence : ne traite jamais deux fois la même session
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('id')
        .eq('stripe_session_id', session.id)
        .maybeSingle()

      if (existingOrder) break

      await supabase.from('orders').insert({
        user_id: userId,
        formation_id: formationId ?? null,
        type,
        stripe_session_id: session.id,
        stripe_payment_intent_id:
          typeof session.payment_intent === 'string' ? session.payment_intent : null,
        montant_centimes: session.amount_total ?? 0,
        tva_centimes: session.total_details?.amount_tax ?? 0,
        devise: session.currency ?? 'eur',
        code_promo: session.metadata?.code_promo ?? null,
        statut: 'paye',
      })

      if (formationId && session.mode === 'payment') {
        await supabase
          .from('enrollments')
          .upsert(
            { user_id: userId, formation_id: formationId, source: 'achat' },
            { onConflict: 'user_id,formation_id' }
          )
      }

      if (type === 'consultation_heure' && slotId) {
        const { data: slot } = await supabase
          .from('consultation_slots')
          .select('id, start_at')
          .eq('id', slotId)
          .single()

        if (slot) {
          try {
            const meeting = await createZoomMeeting({
              topic: 'Consultation avec le scientifique — GPIG',
              startAtIso: slot.start_at,
              durationMinutes: 60,
            })

            await supabase
              .from('consultation_slots')
              .update({
                statut: 'reservee',
                stripe_session_id: session.id,
                hold_expires_at: null,
                zoom_meeting_id: String(meeting.id),
                zoom_join_url: meeting.join_url,
                zoom_start_url: meeting.start_url,
              })
              .eq('id', slotId)
          } catch (zoomError) {
            // Le paiement est passé mais la réunion Zoom n'a pas pu être créée :
            // on garde le créneau réservé (le client a payé) et on logue pour
            // une création manuelle côté administrateur, plutôt que de perdre
            // la réservation ou de rembourser automatiquement.
            console.error('Création réunion Zoom impossible (webhook)', zoomError)
            await supabase
              .from('consultation_slots')
              .update({
                statut: 'reservee',
                stripe_session_id: session.id,
                hold_expires_at: null,
              })
              .eq('id', slotId)
          }
        }
      }

      if (type === 'consultation_pack10h' && userId) {
        await supabase.from('consultation_credits_ledger').insert({
          user_id: userId,
          heures: 10,
          raison: 'achat_pack10h',
          stripe_session_id: session.id,
        })
      }

      // Crédite le solde d'Atomes de l'utilisateur ; le nombre d'Atomes
      // du pack acheté est transmis en metadata par buyAtomesPack (voir
      // app/boutique/packs-atomes/actions.ts).
      if (type === 'pack_atomes' && userId) {
        const atomes = Number(session.metadata?.atomes ?? 0)
        if (atomes > 0) {
          await supabase.from('atomes_ledger').insert({
            user_id: userId,
            montant: atomes,
            raison: 'achat_pack',
            stripe_session_id: session.id,
          })
        }
      }

      break
    }

    case 'checkout.session.expired': {
      const session = event.data.object as Stripe.Checkout.Session
      const slotId = session.metadata?.slot_id
      const orderId = session.metadata?.order_id
      const type = session.metadata?.type

      // Libère le créneau tenu en attente si le paiement n'a pas abouti,
      // sans attendre l'expiration naturelle du hold (30 min).
      if (type === 'consultation_heure' && slotId) {
        await supabase
          .from('consultation_slots')
          .update({ statut: 'libre', user_id: null, source: null, hold_expires_at: null })
          .eq('id', slotId)
          .eq('statut', 'en_attente_paiement')
      }

      // Marque la commande boutique physique comme échouée plutôt que de
      // la laisser 'en_attente' indéfiniment ; les articles restent dans
      // le panier pour que le client puisse réessayer.
      if (type === 'boutique' && orderId) {
        await supabase
          .from('orders')
          .update({ statut: 'echoue' })
          .eq('id', orderId)
          .eq('statut', 'en_attente')
      }
      break
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.user_id
      if (!userId) break

      await supabase.from('subscriptions').upsert(
        {
          user_id: userId,
          stripe_subscription_id: sub.id,
          stripe_customer_id: sub.customer as string,
          plan: sub.items.data[0]?.price.nickname ?? 'standard',
          statut: sub.status === 'active' ? 'active' : 'impayee',
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        },
        { onConflict: 'stripe_subscription_id' }
      )
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await supabase
        .from('subscriptions')
        .update({ statut: 'annulee' })
        .eq('stripe_subscription_id', sub.id)
      break
    }

    default:
      break
  }

  return NextResponse.json({ received: true })
}
