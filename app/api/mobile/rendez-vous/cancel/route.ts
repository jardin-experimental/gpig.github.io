import { NextResponse } from 'next/server'
import { getMobileUser } from '@/lib/supabase/mobile'
import { deleteZoomMeeting } from '@/lib/zoom/server'

// Équivalent mobile de app/rendez-vous/actions.ts::cancelConsultationSlot.
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

  const { data: slotAvant } = await supabase
    .from('consultation_slots')
    .select('zoom_meeting_id')
    .eq('id', slotId)
    .single()

  const { error } = await supabase.rpc('cancel_consultation_slot', { p_slot_id: slotId })
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  if (slotAvant?.zoom_meeting_id) {
    try {
      await deleteZoomMeeting(slotAvant.zoom_meeting_id)
    } catch (zoomError) {
      console.error('Suppression réunion Zoom impossible (mobile)', zoomError)
    }
  }

  return NextResponse.json({ ok: true })
}
