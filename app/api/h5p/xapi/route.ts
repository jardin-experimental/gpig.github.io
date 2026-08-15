// Fichier à placer dans : app/api/h5p/xapi/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Client Supabase côté serveur avec la clé service_role (jamais exposée au client)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Barème de conversion score H5P -> atomes. Ajuste selon ta grille XP existante.
const ATOMES_PAR_REUSSITE_COMPLETE = 10;
const ATOMES_MIN = 2;

export async function POST(req: NextRequest) {
    try {
        // Auth : on récupère l'utilisateur depuis le token Supabase (cookie ou Bearer)
        const authHeader = req.headers.get("authorization");
        const token = authHeader?.replace("Bearer ", "");

        if (!token) {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        }

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: "Utilisateur invalide" }, { status: 401 });
        }

        const body = await req.json();
        const { contentId, lessonId, score, raw, max, verb } = body;

        if (typeof score !== "number" || !contentId || !lessonId) {
            return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
        }

        // Anti-triche basique : on vérifie qu'on n'a pas déjà crédité ce contenu pour cet user aujourd'hui
        const { data: existing } = await supabase
            .from("atomes_ledger")
            .select("id")
            .eq("user_id", user.id)
            .eq("raison", `h5p:${contentId}`)
            .maybeSingle();

        if (existing) {
            return NextResponse.json({ ok: true, alreadyCredited: true });
        }

        const montantAtomes = Math.max(
            ATOMES_MIN,
            Math.round(score * ATOMES_PAR_REUSSITE_COMPLETE)
        );

        const { error: insertError } = await supabase.from("atomes_ledger").insert({
            user_id: user.id,
            amount: montantAtomes,
            source: `h5p:${contentId}`,
            metadata: { lessonId, raw, max, verb },
            created_at: new Date().toISOString(),
        });

        if (insertError) {
            console.error("Erreur insertion atomes_ledger:", insertError);
            return NextResponse.json({ error: "Erreur base de données" }, { status: 500 });
        }

        return NextResponse.json({ ok: true, atomesCredited: montantAtomes });
    } catch (err) {
        console.error("Erreur route /api/h5p/xapi:", err);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}