import { NextResponse } from 'next/server'
import { getMobileUser } from '@/lib/supabase/mobile'
import { stripe } from '@/lib/stripe/server'

const PRIX_HEURE_CENTIMES = 8500

// Équivalent mobile de app/rendez-vous/actions.ts::bookConsultationSlotWithPayment.
export async function POST(request: Request) {
  const { user, supabase } = await getMobileUser(request)
  if (!user || !supabase) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const slotId = body?.slotId as string | undefined
  if (!slotId) {
    return NextResponse.json({ error: 'slotId manquant' }, { status: 400 })
  }

  const { data: slot, error: holdError } = await supabase.rpc('hold_consultation_slot', {
    p_slot_id: slotId,
  })

  if (holdError || !slot) {
    return NextResponse.json(
      { error: holdError?.message ?? "Ce créneau n'est plus disponible." },
      { status: 409 }
    )
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: user.email,
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    line_items: [
      {
        price_data: {
          currency: 'eur',
          unit_amount: PRIX_HEURE_CENTIMES,
          product_data: {
            name: `Appel vidéo (1h) avec le scientifique — ${new Date(
              slot.start_at
            ).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}`,
          },
          tax_behavior: 'exclusive',
        },
        quantity: 1,
      },
    ],
    automatic_tax: { enabled: true },
    metadata: { user_id: user.id, slot_id: slotId, type: 'consultation_heure' },
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/rendez-vous?paiement=succes`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/rendez-vous?paiement=annule`,
  })

  if (!session.url) {
    return NextResponse.json({ error: 'Session Stripe invalide' }, { status: 500 })
  }

  return NextResponse.json({ checkoutUrl: session.url })
}
