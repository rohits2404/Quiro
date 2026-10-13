import { NextResponse } from "next/server";

import {
    describeRetentionChange,
    describeSettingChange,
    LOG_ACTIONS,
} from "@/lib/admin-log";
import { actorNameFor, recordAdminLog } from "@/lib/admin-log-store";
import { requireApiAdmin } from "@/lib/api-session";
import { retentionFromValue, type AppSettings } from "@/lib/app-settings";
import { purgeExpiredChats, updateAppSettings } from "@/lib/app-settings-store";

export async function PATCH(request: Request) {
    const guard = await requireApiAdmin();
    if (!guard.ok) return guard.response;

    const body = (await request.json().catch(() => null)) as {
        allowSignUps?: unknown;
        enforceTwoFactor?: unknown;
        maintenanceMode?: unknown;
        chatRetention?: unknown;
    } | null;

    if (!body) {
        return NextResponse.json(
            { error: "Nothing to save." },
            { status: 400 },
        );
    }

    const patch: Partial<AppSettings> = {};

    if (typeof body.allowSignUps === "boolean") {
        patch.allowSignUps = body.allowSignUps;
    }
    if (typeof body.maintenanceMode === "boolean") {
        patch.maintenanceMode = body.maintenanceMode;
    }
    if (typeof body.enforceTwoFactor === "boolean") {
        patch.enforceTwoFactor = body.enforceTwoFactor;
    }
    if (typeof body.chatRetention === "string") {
        patch.chatRetentionMonths = retentionFromValue(body.chatRetention);
    }

    if (Object.keys(patch).length === 0) {
        return NextResponse.json(
            { error: "No recognised settings in that request." },
            { status: 400 },
        );
    }

    const settings = await updateAppSettings(patch, guard.userId);

    const actorName = await actorNameFor(guard.userId);

    for (const key of [
        "maintenanceMode",
        "allowSignUps",
        "enforceTwoFactor",
    ] as const) {
        const value = patch[key];

        if (typeof value !== "boolean") continue;

        await recordAdminLog({
            action: LOG_ACTIONS.settingChanged,
            description: describeSettingChange(key, value),
            actorId: guard.userId,
            actorName,
        });
    }

    if (patch.chatRetentionMonths !== undefined) {
        await recordAdminLog({
            action: LOG_ACTIONS.settingChanged,
            description: describeRetentionChange(patch.chatRetentionMonths),
            actorId: guard.userId,
            actorName,
        });
    }

    let deleted: number | undefined;

    if (patch.chatRetentionMonths !== undefined) {
        try {
            ({ deleted } = await purgeExpiredChats());
        } catch (error) {
            console.error("[settings] retention purge failed", error);
        }
    }

    return NextResponse.json({ settings, deleted });
}
