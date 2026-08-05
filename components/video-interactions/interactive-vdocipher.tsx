'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
    useVideoInteractions,
    type VideoInteraction,
} from '@/lib/video-interactions/use-video-interactions'
import { VideoInteractionOverlay } from './video-interaction-overlay'

/**
 * Enveloppe ton composant vidéo VdoCipher existant SANS le modifier :
 * il continue de rendre son <iframe> comme aujourd'hui, on va juste
 * chercher l'instance du player après montage.
 *
 *   <InteractiveVdoCipherVideo interactions={interactions}>
 *     <TonComposantVdoCipherExistant otpData={...} />
 *   </InteractiveVdoCipherVideo>
 *
 * Nécessite le SDK officiel côté client :
 *   npm install @vdocipher/embed-api
 * et l'import global (ou window.VdoPlayer si déjà chargé via <script>).
 */
export function InteractiveVdoCipherVideo({
    interactions,
    children,
}: {
    interactions: VideoInteraction[]
    children: ReactNode
}) {
    const wrapperRef = useRef<HTMLDivElement>(null)
    const [video, setVideo] = useState<InstanceType<typeof Object> | null>(null)

    useEffect(() => {
        const iframe = wrapperRef.current?.querySelector('iframe')
        if (!iframe) return

        // Le SDK peut ne pas être prêt immédiatement après le montage de
        // l'iframe VdoCipher (chargement async) — quelques tentatives suffisent.
        let cancelled = false
        let attempts = 0
        const tryAttach = () => {
            if (cancelled) return
            // @ts-expect-error -- typé par @vdocipher/embed-api, non importé ici
            // pour ne pas forcer la dépendance dans ce fichier
            const player = window.VdoPlayer?.getInstance(iframe)
            if (player?.video) {
                setVideo(player.video)
                return
            }
            if (attempts++ < 20) setTimeout(tryAttach, 250)
        }
        tryAttach()

        return () => {
            cancelled = true
        }
    }, [children])

    const { active, dismiss } = useVideoInteractions(
        video as never,
        interactions
    )

    return (
        <div ref={wrapperRef} className="relative">
            {children}
            {active && (
                <VideoInteractionOverlay interaction={active} onComplete={dismiss} />
            )}
        </div>
    )
}