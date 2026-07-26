'use server'

import { redirect } from 'next/navigation'
import { stripe } from '@/lib/stripe/server'
import { createClient } from '@/lib/supabase/server'

export async function createFormationCheckout(formationSlug: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect(`/login?next=/formations/${formationSlug}`)

  const { data: formation } = await supabase
    .from('formations')
    .select('id, titre, prix_centimes, stripe_price_id, tva_taux')
    .eq('slug', formationSlug)
    .single()

  if (!formation) throw new Error('Formation introuvable')

  const { data: profile } = await supabase
    .from('profiles')
    .select('credit_centimes')
    .eq('id', user.id)
    .single()

  const credit = profile?.credit_centimes ?? 0
  const montantApresCredit = Math.max(0, (formation.prix_centimes ?? 0) - credit)

  // Si le crédit couvre entièrement le prix, on donne l'accès directement
  // sans passer par Stripe (pas de session de paiement à 0€ nécessaire)
  if (montantApresCredit === 0 && credit > 0) {
    await supabase.from('enrollments').upsert(
      { user_id: user.id, formation_id: formation.id, source: 'offert' },
      { onConflict: 'user_id,formation_id' }
    )
    // Le débit du crédit se fait via une fonction dédiée pour rester cohérent
    // avec la règle "jamais d'update direct sur profiles depuis le client"
    await supabase.rpc('debiter_credit', {
      p_montant_centimes: formation.prix_centimes ?? 0,
    })
    redirect(`/formations/${formationSlug}`)
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: user.email,
    line_items: [
      {
        price: formation.stripe_price_id ?? undefined,
        // Fallback si aucun Price Stripe n'est encore configuré pour cette formation
        price_data: formation.stripe_price_id
          ? undefined
          : {
              currency: 'eur',
              unit_amount: montantApresCredit,
              product_data: { name: formation.titre },
              tax_behavior: 'exclusive',
            },
        quantity: 1,
      },
    ],
    automatic_tax: { enabled: true },
    allow_promotion_codes: true,
    metadata: {
      user_id: user.id,
      formation_id: formation.id,
      type: 'formation',
    },
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/formations/${formationSlug}?paiement=succes`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/formations/${formationSlug}?paiement=annule`,
  })

  if (!session.url) throw new Error('Session Stripe invalide')
  redirect(session.url)
}

export async function createAbonnementCheckout(stripePriceId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: user.email,
    line_items: [{ price: stripePriceId, quantity: 1 }],
    automatic_tax: { enabled: true },
    allow_promotion_codes: true,
    metadata: { user_id: user.id, type: 'abonnement' },
    subscription_data: { metadata: { user_id: user.id } },
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?abonnement=succes`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?abonnement=annule`,
  })

  if (!session.url) throw new Error('Session Stripe invalide')
  redirect(session.url)
}
