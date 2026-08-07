import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMobileUser } from "@/lib/supabase/mobile";

export async function GET(
    request: Request,
    { params }: {
        params: Promise<{
            vdoCipher_id: string
        }>
    }
) {

    const { vdoCipher_id } = await params;

    // Web (cookies) et mobile (Bearer token) sont tous les deux acceptés ici :
    // on essaie d'abord le Bearer token (présent uniquement pour l'app mobile),
    // sinon on retombe sur le client cookies habituel du site.
    const authHeader = request.headers.get("authorization");
    let user;

    if (authHeader) {
        const mobileAuth = await getMobileUser(request);
        user = mobileAuth.user;
    } else {
        const supabase = await createClient();
        const { data } = await supabase.auth.getUser();
        user = data.user;
    }

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
                annotate: JSON.stringify([
                    {
                        type: 'rtext',
                        text: user.email ?? "GPIG",
                        x: 10,
                        y: 10,
                        alpha: '0.10',
                        color: '0x000000',
                        size: '15',
                        interval: '5000',
                    },
                ]),
            }),
        }
    );

    const otp = await response.json();
    console.log(otp);
    return NextResponse.json(otp);
}
