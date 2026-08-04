'use server'

import { PACKS_ATOMES, type PackAtomesId } from './packs-atomes'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/server'


// Achat d'un pack d'Atomes — crédité via le webhook Stripe une fois payé
// (voir app/api/webhooks/stripe/route.ts, type 'pack_atomes').
export async function buyAtomesPack(packId: PackAtomesId) {
  const pack = PACKS_ATOMES.find((p) => p.id === packId)
  if (!pack) {
    throw new Error('Pack d\'Atomes inconnu.')
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/boutique/packs-atomes')

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: user.email,
    line_items: [
      {
        price_data: {
          currency: 'eur',
          unit_amount: pack.prixCentimes,
          product_data: {
            name: `${pack.nom} — ${pack.atomes} Atomes`,
          },
          tax_behavior: 'exclusive',
        },
        quantity: 1,
      },
    ],
    automatic_tax: { enabled: true },
    allow_promotion_codes: true,
    metadata: {
      user_id: user.id,
      type: 'pack_atomes',
      atomes: String(pack.atomes),
    },
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/boutique/packs-atomes?paiement=succes`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/boutique/packs-atomes?paiement=annule`,
  })

  if (!session.url) throw new Error('Session Stripe invalide')
  redirect(session.url)
}
