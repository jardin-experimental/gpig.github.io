import { NextResponse } from 'next/server'
import { getMobileUser } from '@/lib/supabase/mobile'
import { stripe } from '@/lib/stripe/server'
import { PACKS_ATOMES, type PackAtomesId } from '@/app/boutique/packs-atomes/packs-atomes'

// Équivalent mobile de app/boutique/packs-atomes/actions.ts::buyAtomesPack.
// Même logique, même contrat de metadata (le webhook Stripe existant crédite
// les Atomes sans aucune modification nécessaire côté webhook).
export async function POST(request: Request) {
  const { user } = await getMobileUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const packId = body?.packId as PackAtomesId | undefined
  const pack = PACKS_ATOMES.find((p) => p.id === packId)

  if (!pack) {
    return NextResponse.json({ error: "Pack d'Atomes inconnu." }, { status: 400 })
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: user.email,
    line_items: [
      {
        price_data: {
          currency: 'eur',
          unit_amount: pack.prixCentimes,
          product_data: { name: `${pack.nom} — ${pack.atomes} Atomes` },
          tax_behavior: 'exclusive',
        },
        quantity: 1,
      },
    ],
    automatic_tax: { enabled: true },
    allow_promotion_codes: true,
    metadata: { user_id: user.id, type: 'pack_atomes', atomes: String(pack.atomes) },
    // Deep link vers l'app mobile (scheme "atomesapp", voir app.json) plutôt
    // qu'une URL du site web — à adapter si tu préfères rouvrir un navigateur.
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/boutique/packs-atomes?paiement=succes`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/boutique/packs-atomes?paiement=annule`,
  })

  if (!session.url) {
    return NextResponse.json({ error: 'Session Stripe invalide' }, { status: 500 })
  }

  return NextResponse.json({ checkoutUrl: session.url })
}
