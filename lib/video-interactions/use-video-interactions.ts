'use client'

import { useEffect, useRef, useState } from 'react'
import type { VideoInteraction } from './types'
import { markVideoInteractionSeen } from './mark-seen-action'

export type { VideoInteraction } // ré-export pour ne pas casser les imports existants

/**
 * player.video côté VdoCipher (SDK v2) implémente quasi toute l'API
 * HTMLVideoElement standard — currentTime, play(), pause(),
 * addEventListener('timeupdate' | 'seeking' | ...).
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
 * lecture, persiste quelles interactions ont été complétées (elles ne
 * réapparaissent plus après un refresh), et empêche d'avancer la barre
 * de lecture au-delà de la prochaine interaction non répondue.
 */
export function useVideoInteractions(
    video: VdoVideoLike | null,
    interactions: VideoInteraction[],
    initialSeenIds: string[] = []
) {
    const [active, setActive] = useState<VideoInteraction | null>(null)
    const seen = useRef<Set<string>>(new Set(initialSeenIds))
    const activeRef = useRef<VideoInteraction | null>(null)
    activeRef.current = active

    const sortedInteractions = () =>
        [...interactions].sort((a, b) => a.timestamp_seconds - b.timestamp_seconds)

    // Déclenchement au bon timestamp.
    useEffect(() => {
        if (!video) return
        const sorted = sortedInteractions()

        const onTimeUpdate = () => {
            if (activeRef.current) return // une interaction est déjà affichée
            const t = video.currentTime
            const hit = sorted.find(
                (i) =>
                    !seen.current.has(i.id) &&
                    Math.abs(t - i.timestamp_seconds) < TOLERANCE_SECONDS
            )
            if (hit) {
                if (hit.pause_video) video.pause()
                setActive(hit)
            }
        }

        video.addEventListener('timeupdate', onTimeUpdate)
        return () => video.removeEventListener('timeupdate', onTimeUpdate)
    }, [video, interactions])

    // Verrou : impossible d'avancer au-delà de la prochaine interaction
    // non répondue, même en tirant la barre de progression.
    useEffect(() => {
        if (!video) return
        const sorted = sortedInteractions()

        const onSeeking = () => {
            const nextPending = sorted.find((i) => !seen.current.has(i.id))
            if (
                nextPending &&
                video.currentTime > nextPending.timestamp_seconds + TOLERANCE_SECONDS
            ) {
                video.currentTime = nextPending.timestamp_seconds
            }
        }

        video.addEventListener('seeking', onSeeking)
        return () => video.removeEventListener('seeking', onSeeking)
    }, [video, interactions])

    const dismiss = () => {
        const current = activeRef.current
        setActive(null)
        video?.play()

        if (current && !seen.current.has(current.id)) {
            seen.current.add(current.id)
            // Best-effort : si ça échoue (ex. hors-ligne), l'interaction
            // réapparaîtra simplement à la prochaine session — pas bloquant
            // pour la lecture en cours.
            markVideoInteractionSeen(current.id).catch(() => { })
        }
    }

    /**
     * Recule jusqu'au timestamp de l'interaction précédente (ou 0 s'il n'y
     * en a pas), relance la lecture, et "oublie" l'interaction courante
     * pour qu'elle se redéclenche normalement en repassant dessus. Ne
     * touche pas à la persistance : revoir une séquence n'annule pas une
     * complétion déjà enregistrée pour une AUTRE interaction plus tôt.
     */
    const replay = () => {
        const current = activeRef.current
        if (!video || !current) return

        const sorted = sortedInteractions()
        const idx = sorted.findIndex((i) => i.id === current.id)
        const target = idx > 0 ? sorted[idx - 1].timestamp_seconds : 0

        setActive(null)
        video.currentTime = target
        video.play()
    }

    return { active, dismiss, replay }
}