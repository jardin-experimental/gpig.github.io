import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
    request: Request,
    { params }: {
        params: Promise<{
            lessonId: string
        }>
    }
) {

    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    //------------------------------------
    // récupérer la leçon
    //------------------------------------

    const { data: lesson } = await supabase
        .from("lecon_contents")
        .select("vdoCipher_id")
        .eq("lecon_id", (await params).lessonId)
        .single();

    if (!lesson) {
        return NextResponse.json(
            { error: "Lesson not found" },
            { status: 404 }
        );
    }

    //------------------------------------
    // appel VdoCipher
    //------------------------------------

    const response = await fetch(
        "https://dev.vdocipher.com/api/videos/" +
        lesson.vdoCipher_id +
        "/otp",
        {
            method: "POST",
            headers: {
                Authorization:
                    "Apisecret " +
                    process.env.VDOCIPHER_API_SECRET!,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                ttl: 300,

                annotate: JSON.stringify({
                    email: user.email,
                    id: user.id,
                }),
            }),
        }
    );

    const otp = await response.json();

    return NextResponse.json(otp);
}