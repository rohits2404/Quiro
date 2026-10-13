import { DangerZoneSettings } from "@/components/dashboard/settings/danger-zone-settings";
import { auth } from "@/lib/auth";
import { getNavCounts } from "@/lib/chat-store";
import { requireOrganization } from "@/lib/session";
import { headers } from "next/headers";
import React from "react";

const SeetingsDangerZonePage = async () => {
    const organization = await requireOrganization();

    const [counts, accounts] = await Promise.all([
        getNavCounts(organization.id),
        auth.api.listUserAccounts({ headers: await headers() }),
    ]);

    return (
        <DangerZoneSettings
            counts={counts}
            hasPassword={accounts.some(
                (account) => account.providerId === "credential",
            )}
        />
    );
};

export default SeetingsDangerZonePage;
