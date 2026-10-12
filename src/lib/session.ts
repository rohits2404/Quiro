import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { isAdminRole } from "@/lib/admin";
import { auth, bootstrapAdminIds } from "@/lib/auth";
import { APP_ROOT, ONBOARDING_ROUTE } from "@/lib/dashboard-nav";

export const getServerSession = cache(async () => {
    return auth.api.getSession({ headers: await headers() });
});

export async function requireSession() {
    const session = await getServerSession();

    if (!session) {
        redirect("/");
    }

    return session;
}

export function isAdminUser(user: { id: string; role?: string | null }) {
    return isAdminRole(user.role) || bootstrapAdminIds.includes(user.id);
}

export const isCurrentUserAdmin = cache(async () => {
    const session = await getServerSession();

    return session ? isAdminUser(session.user) : false;
});

export async function requireAdmin() {
    const session = await requireSession();

    if (!isAdminUser(session.user)) {
        redirect(APP_ROOT);
    }

    return session;
}

export const getOrganizations = cache(async () => {
    return auth.api.listOrganizations({ headers: await headers() });
});

export async function requireOrganization() {
    const session = await requireSession();
    const organizations = await getOrganizations();

    if (organizations.length === 0) {
        redirect(ONBOARDING_ROUTE);
    }

    const activeId = session.session.activeOrganizationId;

    return (
        organizations.find((organization) => organization.id === activeId) ??
        organizations[0]
    );
}

export async function redirectIfOnboarded() {
    await requireSession();
    const organizations = await getOrganizations();

    if (organizations.length > 0) {
        redirect(APP_ROOT);
    }
}

export async function redirectIfSignedIn() {
    const session = await getServerSession();

    if (session) {
        redirect(APP_ROOT);
    }
}
