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
        fetch(`/api/vdocipher/${vdoCipher_id}`)
            .then(r => r.json())
            .then(setData)
    }, [vdoCipher_id])

    if (!data) return null

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