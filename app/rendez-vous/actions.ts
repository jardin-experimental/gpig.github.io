'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/server'
import { createZoomMeeting, deleteZoomMeeting } from '@/lib/zoom/server'

const PRIX_HEURE_CENTIMES = 8500
const PRIX_PACK10H_CENTIMES = 80000

// Achat du forfait 10h — crédite les heures via le webhook Stripe une fois payé.
export async function buyConsultationPack10h() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/rendez-vous')

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: user.email,
    line_items: [
      {
        price_data: {
          currency: 'eur',
          unit_amount: PRIX_PACK10H_CENTIMES,
          product_data: {
            name: 'Forfait 10 appels vidéo (10h) avec le scientifique',
          },
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

  if (!session.url) throw new Error('Session Stripe invalide')
  redirect(session.url)
}

// Réservation d'un créneau payé à l'unité (85€) : on pose d'abord un hold de
// 30 min sur le créneau (pour ne pas le vendre deux fois) puis on redirige
// vers Stripe. Le webhook finalise la réservation et crée la réunion Zoom.
export async function bookConsultationSlotWithPayment(slotId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/rendez-vous')

  const { data: slot, error: holdError } = await supabase
    .rpc('hold_consultation_slot', { p_slot_id: slotId })

  if (holdError || !slot) {
    throw new Error(holdError?.message ?? 'Ce créneau n’est plus disponible.')
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: user.email,
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // aligné sur le hold de 30 min
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

  if (!session.url) throw new Error('Session Stripe invalide')
  redirect(session.url)
}

// Réservation d'un créneau via le forfait 10h : pas de paiement, débit direct
// du crédit d'heures puis création de la réunion Zoom.
// Signature pensée pour useActionState via bookConsultationSlotWithCredit.bind(null, slotId)
export async function bookConsultationSlotWithCredit(
  slotId: string,
  _prevState: { error: string | null },
  _formData: FormData
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/rendez-vous')

  const { data: slot, error } = await supabase
    .rpc('book_consultation_slot_with_credit', { p_slot_id: slotId })

  if (error || !slot) {
    return { error: error?.message ?? 'Ce créneau n’est plus disponible.' }
  }

  try {
    const meeting = await createZoomMeeting({
      topic: 'Consultation avec le scientifique — GPIG',
      startAtIso: slot.start_at,
      durationMinutes: 60,
    })

    await supabase.rpc('set_consultation_slot_zoom', {
      p_slot_id: slot.id,
      p_zoom_meeting_id: String(meeting.id),
      p_zoom_join_url: meeting.join_url,
      p_zoom_start_url: meeting.start_url,
    })
  } catch (zoomError) {
    // La création Zoom a échoué : on annule la réservation et on rembourse
    // le crédit d'heure pour ne pas pénaliser l'utilisateur.
    await supabase.rpc('cancel_consultation_slot', { p_slot_id: slot.id })
    console.error('Création réunion Zoom impossible', zoomError)
    return {
      error:
        'La réunion Zoom n’a pas pu être créée, ta réservation a été annulée et ton heure de forfait remboursée. Merci de réessayer.',
    }
  }

  revalidatePath('/rendez-vous')
  return { error: null }
}

// Signature pensée pour useActionState via cancelConsultationSlot.bind(null, slotId)
export async function cancelConsultationSlot(
  slotId: string,
  _prevState: { error: string | null },
  _formData: FormData
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/rendez-vous')

  const { data: slotAvant } = await supabase
    .from('consultation_slots')
    .select('zoom_meeting_id')
    .eq('id', slotId)
    .single()

  const { error } = await supabase.rpc('cancel_consultation_slot', { p_slot_id: slotId })

  if (error) {
    return { error: error.message }
  }

  if (slotAvant?.zoom_meeting_id) {
    try {
      await deleteZoomMeeting(slotAvant.zoom_meeting_id)
    } catch (zoomError) {
      // La réservation est déjà libérée côté GPIG ; la réunion Zoom orpheline
      // n'est pas bloquante, on log seulement.
      console.error('Suppression réunion Zoom impossible', zoomError)
    }
  }

  revalidatePath('/rendez-vous')
  return { error: null }
}
