'use client'

import { useEffect, useRef, useState } from 'react'

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

/**
 * player.video côté VdoCipher (SDK v2) implémente quasi toute l'API
 * HTMLVideoElement standard — currentTime, play(), pause(),
 * addEventListener('timeupdate' | 'seeked' | ...). On type le minimum
 * nécessaire ici pour ne pas dépendre du SDK dans ce fichier.
 */
type VdoVideoLike = {
    currentTime: number
    play: () => void
    pause: () => void
    addEventListener: (type: string, cb: () => void) => void
    removeEventListener: (type: string, cb: () => void) => void
}

const TOLERANCE_SECONDS = 0.35

/**
 * Déclenche les interactions d'une leçon au bon timestamp pendant la
 * lecture. Chaque interaction n'est montrée qu'une fois par session
 * (comportement H5P classique) — si l'utilisateur revient en arrière puis
 * relit le passage, elle ne réapparaît pas.
 */
export function useVideoInteractions(
    video: VdoVideoLike | null,
    interactions: VideoInteraction[]
) {
    const [active, setActive] = useState<VideoInteraction | null>(null)
    const seen = useRef<Set<string>>(new Set())
    const activeRef = useRef<VideoInteraction | null>(null)
    activeRef.current = active

    useEffect(() => {
        if (!video) return

        const sorted = [...interactions].sort(
            (a, b) => a.timestamp_seconds - b.timestamp_seconds
        )

        const onTimeUpdate = () => {
            if (activeRef.current) return // une interaction est déjà affichée
            const t = video.currentTime
            const hit = sorted.find(
                (i) =>
                    !seen.current.has(i.id) &&
                    Math.abs(t - i.timestamp_seconds) < TOLERANCE_SECONDS
            )
            if (hit) {
                seen.current.add(hit.id)
                if (hit.pause_video) video.pause()
                setActive(hit)
            }
        }

        video.addEventListener('timeupdate', onTimeUpdate)
        return () => video.removeEventListener('timeupdate', onTimeUpdate)
    }, [video, interactions])

    const dismiss = () => {
        setActive(null)
        video?.play()
    }

    return { active, dismiss }
}