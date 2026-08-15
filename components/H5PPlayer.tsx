"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type H5PPlayerProps = {
    /** Identifiant du contenu H5P, correspond au dossier dans le bucket Supabase (ex: "densite-catalyseur") */
    contentId: string;
    /** ID de la leçon/quiz GPIG associé, transmis à l'API pour créditer les atomes */
    lessonId: string;
    /** URL publique de base du bucket Supabase Storage contenant les contenus H5P décompressés */
    storageBaseUrl: string; // ex: process.env.NEXT_PUBLIC_SUPABASE_URL + "/storage/v1/object/public/h5p-content"
    className?: string;
};

export default function H5PPlayer({
    contentId,
    lessonId,
    storageBaseUrl,
    className,
}: H5PPlayerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
    const scoreSentRef = useRef(false); // évite de créditer les atomes plusieurs fois par session

    useEffect(() => {
        let mounted = true;
        scoreSentRef.current = false;

        async function init() {
            try {
                const { H5P } = await import("h5p-standalone");
                if (!mounted || !containerRef.current) return;

                // Le dossier attendu dans le bucket : {contentId}/h5p.json, content/, etc.
                const h5pJsonPath = `${storageBaseUrl}/${contentId}`;

                new H5P(containerRef.current, {
                    h5pJsonPath,
                    frameJs: "/h5p/frame.bundle.js", // à copier depuis node_modules/h5p-standalone/dist vers /public/h5p
                    frameCss: "/h5p/h5p.css",
                });

                setStatus("ready");
                attachXapiListener();
            } catch (err) {
                console.error("Erreur de chargement H5P:", err);
                if (mounted) setStatus("error");
            }
        }

        function attachXapiListener() {
            const w = window as any;
            if (!w.H5P?.externalDispatcher) return;

            w.H5P.externalDispatcher.on("xAPI", async (event: any) => {
                const statement = event?.data?.statement;
                const verb = statement?.verb?.id ?? "";
                const isCompletion =
                    verb.includes("completed") || verb.includes("answered") || verb.includes("passed");

                if (!isCompletion || scoreSentRef.current) return;

                const rawScore = statement?.result?.score;
                if (!rawScore) return;

                scoreSentRef.current = true;

                try {
                    const supabase = createClient();
                    const {
                        data: { session },
                    } = await supabase.auth.getSession();

                    if (!session) {
                        console.warn("Pas de session active, score H5P non envoyé.");
                        scoreSentRef.current = false;
                        return;
                    }

                    await fetch("/api/h5p/xapi", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${session.access_token}`,
                        },
                        body: JSON.stringify({
                            contentId,
                            lessonId,
                            score: rawScore.scaled ?? (rawScore.raw / (rawScore.max || 1)),
                            raw: rawScore.raw,
                            max: rawScore.max,
                            verb,
                        }),
                    });
                } catch (err) {
                    console.error("Erreur d'envoi du score H5P:", err);
                    scoreSentRef.current = false; // permet de retenter
                }
            });
        }

        init();
        return () => {
            mounted = false;
        };
    }, [contentId, lessonId, storageBaseUrl]);

    return (
        <div className={className}>
            {status === "loading" && <p>Chargement du contenu interactif…</p>}
            {status === "error" && (
                <p>Impossible de charger ce contenu H5P. Réessaie plus tard.</p>
            )}
            <div ref={containerRef} />
        </div>
    );
}