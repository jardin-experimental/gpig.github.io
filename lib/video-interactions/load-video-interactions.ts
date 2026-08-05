// lib/video-interactions/load-video-interactions.ts
import type { createClient } from '@/lib/supabase/server'
import type { VideoInteraction } from './use-video-interactions'

export async function loadVideoInteractions(
    supabase: Awaited<ReturnType<typeof createClient>>,
    leconId: string
): Promise<VideoInteraction[]> {
    const { data } = await supabase
        .from('video_interactions')
        .select('id, timestamp_seconds, type, quiz_id, titre, contenu, image_url, pause_video')
        .eq('lecon_id', leconId)
        .order('timestamp_seconds')

    if (!data) return []

    return data.flatMap((row): VideoInteraction[] => {
        if (row.type !== 'quiz' && row.type !== 'texte' && row.type !== 'image') {
            console.warn(`video_interactions: type inattendu "${row.type}" (id=${row.id})`)
            return []
        }
        return [{ ...row, type: row.type }]
    })
}