'use client'

import { useEffect, useRef } from 'react'

/**
 * Lecteur vidéo avec dissuasion de téléchargement :
 * - controlsList="nodownload" retire le bouton de téléchargement natif
 *   (Chrome/Edge — Firefox et Safari n'ont pas ce bouton de base)
 * - disablePictureInPicture retire le PiP (qui a son propre bouton de
 *   téléchargement dans certains navigateurs)
 * - le clic droit est bloqué pour retirer "Enregistrer la vidéo sous..."
 * - un filigrane avec l'email de l'utilisateur rend tout partage traçable
 *
 * Plein écran : le bouton natif met la balise <video> elle-même en plein
 * écran, pas son conteneur — le filigrane (positionné dans le conteneur)
 * disparaîtrait donc. On intercepte l'événement fullscreenchange pour
 * rebasculer le plein écran sur le conteneur entier.
 * LIMITE : sur iOS Safari (iPhone), le plein écran vidéo utilise un lecteur
 * système (AVPlayer) qui ne peut pas être remplacé par le plein écran d'un
 * simple <div> — le filigrane disparaîtra donc en plein écran sur iPhone
 * spécifiquement (limite de la plateforme, pas de contournement possible).
 *
 * LIMITES IMPORTANTES (à garder en tête, pas une garantie de sécurité) :
 * - Rien n'empêche l'inspection réseau, une extension navigateur, ou une
 *   simple capture d'écran/vidéo de l'écran.
 * - Une vraie protection anti-capture (bloquer l'enregistrement d'écran)
 *   nécessite du DRM (Widevine/PlayReady) via un fournisseur dédié
 *   (VdoCipher, Mux + DRM, Cloudflare Stream) — aucune API web standard ne
 *   permet à une page de détecter un enregistreur d'écran actif.
 */
export function ProtectedVideo({
    src,
    watermarkLabel,
}: {
    src: string
    watermarkLabel?: string
}) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const wrapperRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleFullscreenChange() {
            if (document.fullscreenElement === videoRef.current && wrapperRef.current) {
                // La vidéo vient de passer en plein écran seule : on rebascule
                // vers le conteneur entier pour garder le filigrane visible.
                document
                    .exitFullscreen()
                    .then(() => wrapperRef.current?.requestFullscreen())
                    .catch(() => {
                        // Certains navigateurs refusent le enchaînement immédiat —
                        // dans ce cas on laisse la vidéo seule en plein écran plutôt
                        // que de casser la lecture.
                    })
            }
        }

        document.addEventListener('fullscreenchange', handleFullscreenChange)
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }, [])

    return (
        <div
            ref={wrapperRef}
            className="relative mb-6 aspect-video w-full overflow-hidden rounded-lg bg-black [&:fullscreen]:aspect-auto"
            onContextMenu={(e) => e.preventDefault()}
        >
            <video
                playsInline
                ref={videoRef}
                src={src}
                controls
                controlsList="nodownload noremoteplayback"
                disablePictureInPicture
                className="h-full w-full"
            />

            {watermarkLabel && (
                <div
                    aria-hidden
                    className="absolute left-0 top-0 z-[9999] h-40 w-40 bg-red-500">
                    {watermarkLabel}
                </div>
            )}
        </div>
    )
}