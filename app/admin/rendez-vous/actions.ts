'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type ActionState = { error: string | null; success: string | null }

// Protégé par la policy RLS "Admin gère le planning" : un insert par un
// utilisateur non-administrateur échoue silencieusement côté base.
export async function ouvrirCreneau(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const startAtLocal = formData.get('start_at') as string

  if (!startAtLocal) {
    return { error: 'Merci de choisir une date et une heure.', success: null }
  }

  const startAt = new Date(startAtLocal)
  const endAt = new Date(startAt.getTime() + 60 * 60 * 1000)

  const supabase = await createClient()
  const { error } = await supabase.from('consultation_slots').insert({
    start_at: startAt.toISOString(),
    end_at: endAt.toISOString(),
  })

  if (error) {
    return {
      error: error.code === '23505' ? 'Un créneau existe déjà à cet horaire.' : error.message,
      success: null,
    }
  }

  revalidatePath('/admin/rendez-vous')
  return { error: null, success: 'Créneau ouvert.' }
}

export async function fermerCreneau(slotId: string) {
  const supabase = await createClient()
  await supabase.rpc('cancel_consultation_slot', { p_slot_id: slotId })
  await supabase.from('consultation_slots').update({ statut: 'annulee' }).eq('id', slotId)
  revalidatePath('/admin/rendez-vous')
}
