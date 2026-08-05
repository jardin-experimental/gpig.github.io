'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { VideoInteraction } from '@/lib/video-interactions/use-video-interactions'

type VideoInteractionInput = {
    leconId: string
    timestampSeconds: number
    type: VideoInteraction['type']
    titre?: string
    contenu?: string
    imageUrl?: string
    quizId?: string
    pauseVideo?: boolean
}

// Lecture : pas de mutation, on laisse throw + error boundary du Server
// Component, comme loadQuiz plus haut dans lecon-page.tsx.
export async function listVideoInteractions(
    leconId: string
): Promise<VideoInteraction[]> {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('admin_list_video_interactions', {
        p_lecon_id: leconId,
    })

    if (error) throw new Error(error.message)

    return (data ?? []).flatMap((row): VideoInteraction[] => {
        if (row.type !== 'quiz' && row.type !== 'texte' && row.type !== 'image') {
            console.warn(`video_interactions: type inattendu "${row.type}" (id=${row.id})`)
            return []
        }
        return [{ ...row, type: row.type }]
    })
}

// Mutations déclenchées par un clic : { error, result } plutôt que throw,
// même pattern que completeLesson — le composant client gère l'affichage
// de l'erreur lui-même sans passer par un error boundary.
export async function createVideoInteraction(
    input: VideoInteractionInput,
    formationSlug: string
): Promise<{ error: string | null; result: { id: string } | null }> {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('admin_create_video_interaction', {
        p_lecon_id: input.leconId,
        p_timestamp_seconds: input.timestampSeconds,
        p_type: input.type,
        p_titre: input.titre,
        p_contenu: input.contenu,
        p_image_url: input.imageUrl,
        p_quiz_id: input.quizId,
        p_pause_video: input.pauseVideo ?? true,
    })

    if (error) return { error: error.message, result: null }

    revalidatePath(`/formations/${formationSlug}/${input.leconId}`)
    return { error: null, result: { id: data as string } }
}

export async function updateVideoInteraction(
    id: string,
    input: VideoInteractionInput,
    formationSlug: string
): Promise<{ error: string | null; result: true | null }> {
    const supabase = await createClient()

    const { error } = await supabase.rpc('admin_update_video_interaction', {
        p_id: id,
        p_timestamp_seconds: input.timestampSeconds,
        p_type: input.type,
        p_titre: input.titre,
        p_contenu: input.contenu,
        p_image_url: input.imageUrl,
        p_quiz_id: input.quizId,
        p_pause_video: input.pauseVideo ?? true,
    })

    if (error) return { error: error.message, result: null }

    revalidatePath(`/formations/${formationSlug}/${input.leconId}`)
    return { error: null, result: true }
}

export async function deleteVideoInteraction(
    id: string,
    leconId: string,
    formationSlug: string
): Promise<{ error: string | null; result: true | null }> {
    const supabase = await createClient()

    const { error } = await supabase.rpc('admin_delete_video_interaction', {
        p_id: id,
    })

    if (error) return { error: error.message, result: null }

    revalidatePath(`/formations/${formationSlug}/${leconId}`)
    return { error: null, result: true }
}