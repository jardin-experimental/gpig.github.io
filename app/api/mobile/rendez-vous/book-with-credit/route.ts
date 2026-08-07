import { NextResponse } from 'next/server'
import { getMobileUser } from '@/lib/supabase/mobile'
import { createZoomMeeting } from '@/lib/zoom/server'

// Équivalent mobile de app/rendez-vous/actions.ts::bookConsultationSlotWithCredit.
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

  const { data: slot, error } = await supabase.rpc('book_consultation_slot_with_credit', {
    p_slot_id: slotId,
  })

  if (error || !slot) {
    return NextResponse.json(
      { error: error?.message ?? "Ce créneau n'est plus disponible." },
      { status: 409 }
    )
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

    return NextResponse.json({ ok: true, joinUrl: meeting.join_url })
  } catch (zoomError) {
    // Même filet de sécurité que côté web : on annule et rembourse le crédit
    // si la création Zoom échoue, pour ne pas pénaliser l'utilisateur.
    await supabase.rpc('cancel_consultation_slot', { p_slot_id: slot.id })
    console.error('Création réunion Zoom impossible (mobile)', zoomError)
    return NextResponse.json(
      {
        error:
          "La réunion Zoom n'a pas pu être créée, ta réservation a été annulée et ton heure de forfait remboursée.",
      },
      { status: 502 }
    )
  }
}
