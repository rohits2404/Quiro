import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { generatedPassword, MIN_CREATED_PASSWORD_LENGTH } from "@/lib/admin";
import {
    describePlanGranted,
    describeUserCreated,
    LOG_ACTIONS,
} from "@/lib/admin-log";
import { actorNameFor, recordAdminLog } from "@/lib/admin-log-store";
import { requireApiAdmin } from "@/lib/api-session";
import { auth } from "@/lib/auth";
import { isPaidPlanId, type PlanId } from "@/lib/billing";
import { grantPlan } from "@/lib/billing-store";
import { prisma } from "@/lib/db";
import { organizationSlug, uniqueSlugSuffix } from "@/lib/organization";

const SLUG_ATTEMPTS = 3;

function workspaceNameFor(name: string) {
    return `${name}${name.endsWith("s") ? "'" : "'s"} workspace`;
}

async function createWorkspaceFor(userId: string, name: string) {
    const base = organizationSlug(name);

    for (let attempt = 0; attempt < SLUG_ATTEMPTS; attempt += 1) {
        const slug = attempt === 0 ? base : `${base}-${uniqueSlugSuffix()}`;

        try {
            return await auth.api.createOrganization({
                body: {
                    name: workspaceNameFor(name),
                    slug,
                    userId,
                },
            });
        } catch (error) {
            const taken = String(error).toLowerCase().includes("slug");

            if (!taken || attempt === SLUG_ATTEMPTS - 1) throw error;
        }
    }

    return null;
}

export async function POST(request: Request) {
    const guard = await requireApiAdmin();
    if (!guard.ok) return guard.response;

    const body = (await request.json().catch(() => null)) as {
        name?: string;
        email?: string;
        password?: string;
        planId?: string;
    } | null;

    const name = body?.name?.trim() ?? "";
    const email = body?.email?.trim().toLowerCase() ?? "";
    const requestedPassword = body?.password ?? "";
    const planId = (body?.planId ?? "free") as PlanId;

    if (!name) {
        return NextResponse.json(
            { error: "Enter a username." },
            { status: 400 },
        );
    }

    if (!/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(email)) {
        return NextResponse.json(
            { error: "Enter a valid email address." },
            { status: 400 },
        );
    }

    if (planId !== "free" && !isPaidPlanId(planId)) {
        return NextResponse.json({ error: "Unknown plan." }, { status: 400 });
    }

    if (
        requestedPassword &&
        requestedPassword.length < MIN_CREATED_PASSWORD_LENGTH
    ) {
        return NextResponse.json(
            {
                error: `A password needs at least ${MIN_CREATED_PASSWORD_LENGTH} characters.`,
            },
            { status: 400 },
        );
    }

    const existing = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
    });

    if (existing) {
        return NextResponse.json(
            { error: "Somebody already has that email address." },
            { status: 409 },
        );
    }

    const password = requestedPassword || generatedPassword();
    const wasGenerated = !requestedPassword;

    let created;
    try {
        created = await auth.api.createUser({
            body: {
                name,
                email,
                password,
                role: "user",
            },
            headers: await headers(),
        });
    } catch (error) {
        console.error("[admin] createUser failed", error);

        return NextResponse.json(
            { error: "Couldn't create that account." },
            { status: 502 },
        );
    }

    const userId = created.user.id;
    const actorName = await actorNameFor(guard.userId);

    await recordAdminLog({
        action: LOG_ACTIONS.userCreated,
        description: describeUserCreated(email, planId),
        actorId: guard.userId,
        actorName,
        targetId: userId,
    });

    try {
        const organization = await createWorkspaceFor(userId, name);

        if (organization && planId !== "free") {
            await grantPlan({
                organizationId: organization.id,
                planId,
                granteprismayUserId: guard.userId,
            });

            await recordAdminLog({
                action: LOG_ACTIONS.planGranted,
                description: describePlanGranted(name, planId),
                actorId: guard.userId,
                actorName,
                targetId: userId,
            });
        }
    } catch (error) {
        console.error("[admin] workspace setup failed", error);

        return NextResponse.json(
            {
                userId,
                email,
                password: wasGenerated ? password : null,
                warning:
                    "The account was created, but its workspace wasn't. They'll be asked to name one when they first sign in.",
            },
            { status: 207 },
        );
    }

    return NextResponse.json({
        userId,
        email,
        password: wasGenerated ? password : null,
        planId,
    });
}
