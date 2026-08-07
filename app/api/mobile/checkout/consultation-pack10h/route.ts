import { NextResponse } from 'next/server'
import { getMobileUser } from '@/lib/supabase/mobile'
import { stripe } from '@/lib/stripe/server'

const PRIX_PACK10H_CENTIMES = 80000

// Équivalent mobile de app/rendez-vous/actions.ts::buyConsultationPack10h.
export async function POST(request: Request) {
  const { user } = await getMobileUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: user.email,
    line_items: [
      {
        price_data: {
          currency: 'eur',
          unit_amount: PRIX_PACK10H_CENTIMES,
          product_data: { name: 'Forfait 10 appels vidéo (10h) avec le scientifique' },
          tax_behavior: 'exclusive',
        },
        quantity: 1,
      },
    ],
    automatic_tax: { enabled: true },
    allow_promotion_codes: true,
    metadata: { user_id: user.id, type: 'consultation_pack10h' },
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/rendez-vous?paiement=succes`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/rendez-vous?paiement=annule`,
  })

  if (!session.url) {
    return NextResponse.json({ error: 'Session Stripe invalide' }, { status: 500 })
  }

  return NextResponse.json({ checkoutUrl: session.url })
}
