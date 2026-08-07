import type { createClient } from '@/lib/supabase/server'

export async function loadCompletedInteractionIds(
    supabase: Awaited<ReturnType<typeof createClient>>,
    leconId: string
): Promise<string[]> {
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) return []

    const { data } = await supabase
        .from('video_interaction_completions')
        .select('interaction_id, video_interactions!inner(lecon_id)')
        .eq('user_id', user.id)
        .eq('video_interactions.lecon_id', leconId)

    return (data ?? []).map((row) => row.interaction_id)
}