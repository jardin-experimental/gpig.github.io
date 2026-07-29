'use client'

import { useEffect, useState } from 'react'

export default function SecureVideo({
    vdoCipher_id,
}: {
    vdoCipher_id: string | null
}) {
    const [data, setData] = useState<{
        otp: string
        playbackInfo: string
    } | null>(null)

    useEffect(() => {
        if (!vdoCipher_id) return

        fetch(`/api/vdocipher/${vdoCipher_id}`)
            .then(async (r) => {
                const json = await r.json()

                console.log("Réponse VdoCipher API :", json)

                if (!r.ok) {
                    throw new Error(JSON.stringify(json))
                }

                return json
            })
            .then(setData)
            .catch((err) => {
                console.error("Erreur SecureVideo :", err)
            })

    }, [vdoCipher_id])


    if (!data?.otp || !data?.playbackInfo) {
        return null
    }

    const src =
        `https://player.vdocipher.com/v2/?otp=${encodeURIComponent(data.otp)}` +
        `&playbackInfo=${encodeURIComponent(data.playbackInfo)}`

    return (
        <iframe
            src={src}
            allow="encrypted-media"
            allowFullScreen
            className="w-full aspect-video rounded-lg border-0"
        />
    )
}