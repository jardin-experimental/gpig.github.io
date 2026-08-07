export type VideoInteraction = {
    id: string
    timestamp_seconds: number
    type: 'quiz' | 'texte' | 'image'
    titre?: string | null
    contenu?: string | null
    image_url?: string | null
    quiz_id?: string | null
    pause_video: boolean
}