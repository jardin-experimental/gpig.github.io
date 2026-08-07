'use server'

import { createClient } from '@/lib/supabase/server'

export async function markVideoInteractionSeen(
  interactionId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { error } = await supabase
    .from('video_interaction_completions')
    .upsert(
      { user_id: user.id, interaction_id: interactionId },
      { onConflict: 'user_id,interaction_id', ignoreDuplicates: true }
    )

  if (error) return { error: error.message }
  return { error: null }
}