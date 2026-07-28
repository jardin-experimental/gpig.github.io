'use client'

/**
 * Lecteur vidéo avec dissuasion de téléchargement :
 * - controlsList="nodownload" retire le bouton de téléchargement natif
 *   (Chrome/Edge — Firefox et Safari n'ont pas ce bouton de base)
 * - disablePictureInPicture retire le PiP (qui a son propre bouton de
 *   téléchargement dans certains navigateurs)
 * - le clic droit est bloqué pour retirer "Enregistrer la vidéo sous..."
 * - un filigrane avec l'email de l'utilisateur rend tout partage traçable
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
    return (
        <div
            className="relative mb-6 aspect-video w-full overflow-hidden rounded-lg bg-black"
            onContextMenu={(e) => e.preventDefault()}
        >
            <video
                src={src}
                controls
                controlsList="nodownload noremoteplayback"
                disablePictureInPicture
                className="h-full w-full"
            />

            {watermarkLabel && (
                <div
                    aria-hidden
                    className="pointer-events-none absolute right-3 top-3 z-20 select-none rounded bg-black/70 px-3 py-1.5 font-mono text-sm text-white"
                >
                    {watermarkLabel}
                </div>
            )}
        </div>
    )
}