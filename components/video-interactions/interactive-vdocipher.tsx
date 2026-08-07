'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import Script from 'next/script'
import { useVideoInteractions } from '@/lib/video-interactions/use-video-interactions'
import type { VideoInteraction } from '@/lib/video-interactions/types'
import { VideoInteractionOverlay } from './overlay'

declare global {
    interface Window {
        VdoPlayer?: { getInstance: (iframe: HTMLIFrameElement) => { video: unknown } }
    }
}

/**
 * Enveloppe ton composant vidéo VdoCipher existant SANS le modifier.
 *
 * SecureVideo rend un <iframe src="https://player.vdocipher.com/v2/...">
 * (embed v2 classique) — son contenu est cross-origin, donc invisible et
 * inatteignable via querySelector depuis notre page. Le seul moyen d'y
 * accéder est l'API officielle VdoPlayer (communication par postMessage
 * en interne), fournie par le script ci-dessous. On le charge nous-mêmes
 * via next/script plutôt que de supposer qu'il est déjà présent ailleurs
 * — next/script déduplique automatiquement par src, donc pas de risque
 * de double chargement si SecureVideo l'inclut déjà de son côté.
 */
export function InteractiveVdoCipherVideo({
    interactions,
    completedInteractionIds = [],
    children,
}: {
    interactions: VideoInteraction[]
    completedInteractionIds?: string[]
    children: ReactNode
}) {
    const wrapperRef = useRef<HTMLDivElement>(null)
    const [sdkReady, setSdkReady] = useState(false)
    const [video, setVideo] = useState<any>(null)

    useEffect(() => {
        if (!sdkReady) return

        let cancelled = false
        let attempts = 0

        const tryAttach = () => {
            if (cancelled) return
            const iframe = wrapperRef.current?.querySelector('iframe')
            if (!iframe) {
                if (attempts++ < 40) setTimeout(tryAttach, 250)
                else console.warn('[video-interactions] aucun <iframe> trouvé après 10s')
                return
            }
            const player = window.VdoPlayer?.getInstance(iframe)
            if (player?.video) {
                setVideo(player.video)
            } else if (attempts++ < 40) {
                setTimeout(tryAttach, 250)
            } else {
                console.warn('[video-interactions] player.video introuvable après 10s')
            }
        }

        tryAttach()

        return () => {
            cancelled = true
        }
    }, [sdkReady, children])

    const { active, dismiss, replay } = useVideoInteractions(
        video,
        interactions,
        completedInteractionIds
    )

    if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.log(
            '[video-interactions] sdk prêt:', sdkReady,
            '| interactions reçues:', interactions.length,
            '| player attaché:', Boolean(video)
        )
    }

    return (
        <>
            <Script
                src="https://player.vdocipher.com/v2/api.js"
                strategy="afterInteractive"
                onReady={() => setSdkReady(true)}
            />
            <div ref={wrapperRef} className="relative">
                {children}
                {active && (
                    <VideoInteractionOverlay
                        interaction={active}
                        onComplete={dismiss}
                        onReplay={replay}
                    />
                )}
            </div>
        </>
    )
}