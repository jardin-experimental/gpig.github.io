'use client'

import { useEffect, useRef } from "react";

declare global {
    interface Window {
        VdoPlayer: any;
    }
}

export default function SecureVideo({
    vdoCipher_id,
}: {
    vdoCipher_id: string | null;
}) {

    const container = useRef<HTMLDivElement>(null);

    useEffect(() => {

        async function load() {

            const res = await fetch(
                `/api/vdocipher/${vdoCipher_id}`
            );

            const data = await res.json();

            if (!window.VdoPlayer) {

                const script = document.createElement("script");

                script.src =
                    "https://player.vdocipher.com/v2/api.js";

                script.onload = () => {

                    new window.VdoPlayer({
                        otp: data.otp,
                        playbackInfo: data.playbackInfo,
                        container: container.current,
                    });

                };

                document.body.appendChild(script);

            } else {

                new window.VdoPlayer({
                    otp: data.otp,
                    playbackInfo: data.playbackInfo,
                    container: container.current,
                });

            }

        }

        load();

    }, [vdoCipher_id]);

    return (
        <div
            ref={container}
            className="aspect-video w-full rounded-lg overflow-hidden"
        />
    );

}