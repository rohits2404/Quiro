import { NextResponse } from "next/server";

import { purgeExpiredChats } from "@/lib/app-settings-store";

export async function POST(request: Request) {
    const secret = process.env.CRON_SECRET;

    if (!secret) {
        return NextResponse.json(
            { error: "CRON_SECRET is not configured." },
            { status: 503 },
        );
    }

    const authorization = request.headers.get("authorization");

    if (authorization !== `Bearer ${secret}`) {
        return NextResponse.json({ error: "Not Authorized." }, { status: 401 });
    }

    try {
        const result = await purgeExpiredChats();

        return NextResponse.json({ ok: true, ...result });
    } catch (error) {
        console.error("[cron] retention purge failed", error);

        return NextResponse.json({ error: "Purge failed." }, { status: 500 });
    }
}
