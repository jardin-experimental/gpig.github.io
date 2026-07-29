import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { json } from "stream/consumers";

export async function GET(
    request: Request,
    { params }: {
        params: Promise<{
            vdoCipher_id: string
        }>
    }
) {

    const { vdoCipher_id } = await params;

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

    // const { data: lesson } = await supabase
    //     .from("lecon_contents")
    //     .select("vdoCipher_id")
    //     .eq("lecon_id", (await params).vdoCipher_id)
    //     .single();

    // console.log({ lesson });

    // if (!lesson) {
    //     return NextResponse.json(
    //         { error: "Lesson not found" },
    //         { status: 404 }
    //     );
    // }

    //------------------------------------
    // appel VdoCipher
    //------------------------------------

    const key = process.env.VDOCIPHER_API_SECRET;

    console.log({
        exists: !!key,
        length: key?.length,
        start: key?.slice(0, 5),
    });

    const response = await fetch(
        "https://www.vdocipher.com/api/videos/" +
        vdoCipher_id +
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
                json: true,

                annotate: JSON.stringify({
                    email: user.email,
                    id: user.id,
                }),
            }),
        }
    );

    const otp = await response.json();
    console.log(otp);
    return NextResponse.json(otp);
}