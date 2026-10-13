import {
    ADMIN_ACTIVE_WINDOW_DAYS,
    ADMIN_TOP_USERS,
    ADMIN_USERS_PAGE_SIZE,
    isAdminRole,
    type AdminActiveUser,
    type AdminOverview,
    type AdminUserRow,
    type AdminUsersView,
    type AdminUserStatus,
} from "@/lib/admin";
import { ENTITLED_STATUSES, type PlanId } from "@/lib/billing";
import { prisma } from "@/lib/db";
import { clampPage } from "@/lib/pagination";

function monthStart(now: Date) {
    return new Date(now.getFullYear(), now.getMonth(), 1);
}

function activitySince(now: Date) {
    return new Date(now.getTime() - ADMIN_ACTIVE_WINDOW_DAYS * 86_400_000);
}

async function countPaidSubscribers() {
    const paidWorkspaces = await prisma.subscription.findMany({
        where: { status: { in: [...ENTITLED_STATUSES] } },
        select: { organizationId: true },
    });

    if (paidWorkspaces.length === 0) return 0;

    const members = await prisma.member.findMany({
        where: {
            organizationId: {
                in: paidWorkspaces.map((row) => row.organizationId),
            },
        },
        distinct: ["userId"],
        select: { userId: true },
    });

    return members.length;
}

async function countActiveUsers(since: Date) {
    const [signedIn, asked] = await Promise.all([
        prisma.session.findMany({
            where: { updatedAt: { gte: since } },
            distinct: ["userId"],
            select: { userId: true },
        }),
        prisma.questionEvent.findMany({
            where: { createdAt: { gte: since } },
            distinct: ["userId"],
            select: { userId: true },
        }),
    ]);

    const ids = new Set(signedIn.map((row) => row.userId));
    for (const row of asked) ids.add(row.userId);

    return ids.size;
}

async function listMostActiveUsers(since: Date): Promise<AdminActiveUser[]> {
    const byUser = await prisma.questionEvent.groupBy({
        by: ["userId"],
        where: { createdAt: { gte: since } },
        _count: { _all: true },
        orderBy: { _count: { userId: "desc" } },
        take: ADMIN_TOP_USERS,
    });

    if (byUser.length === 0) return [];

    const users = await prisma.user.findMany({
        where: { id: { in: byUser.map((row) => row.userId) } },
        select: { id: true, name: true, email: true, image: true },
    });

    const byId = new Map(users.map((user) => [user.id, user]));

    return byUser
        .filter((row) => byId.has(row.userId))
        .map((row) => {
            const user = byId.get(row.userId)!;

            return {
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image,
                questions: row._count._all,
            };
        });
}

export async function getAdminOverview(
    now: Date = new Date(),
): Promise<AdminOverview> {
    const since = monthStart(now);
    const activeSince = activitySince(now);

    const [
        documentsIndexed,
        questionsThisMonth,
        totalUsers,
        activeUsers,
        paidSubscribers,
        mostActive,
    ] = await Promise.all([
        prisma.document.count({ where: { status: "READY" } }),
        prisma.questionEvent.count({ where: { createdAt: { gte: since } } }),
        prisma.user.count(),
        countActiveUsers(activeSince),
        countPaidSubscribers(),
        listMostActiveUsers(since),
    ]);

    return {
        documentsIndexed,
        questionsThisMonth,
        activeUsers,
        paidSubscribers,
        totalUsers,
        mostActive,
    };
}

const PLAN_RANK: Record<PlanId, number> = { free: 0, pro: 1, business: 2 };

async function plansByUser(userIds: string[]) {
    const plans = new Map<string, PlanId>();

    if (userIds.length === 0) return plans;

    const memberships = await prisma.member.findMany({
        where: { userId: { in: userIds } },
        select: { userId: true, organizationId: true },
    });

    if (memberships.length === 0) return plans;

    const paid = await prisma.subscription.findMany({
        where: {
            organizationId: {
                in: memberships.map((membership) => membership.organizationId),
            },
            status: { in: [...ENTITLED_STATUSES] },
        },
        select: { organizationId: true, planId: true },
    });

    const planByOrganization = new Map(
        paid.map((row) => [row.organizationId, row.planId as PlanId]),
    );

    for (const membership of memberships) {
        const plan = planByOrganization.get(membership.organizationId);

        if (!plan) continue;

        const held = plans.get(membership.userId) ?? "free";

        if (PLAN_RANK[plan] > PLAN_RANK[held])
            plans.set(membership.userId, plan);
    }

    return plans;
}

async function lastActiveByUser(userIds: string[]) {
    const seen = new Map<string, Date>();

    if (userIds.length === 0) return seen;

    const [sessions, questions] = await Promise.all([
        prisma.session.groupBy({
            by: ["userId"],
            where: { userId: { in: userIds } },
            _max: { updatedAt: true },
        }),
        prisma.questionEvent.groupBy({
            by: ["userId"],
            where: { userId: { in: userIds } },
            _max: { createdAt: true },
        }),
    ]);

    const record = (userId: string, at: Date | null) => {
        if (!at) return;

        const held = seen.get(userId);
        if (!held || at > held) seen.set(userId, at);
    };

    for (const row of sessions) record(row.userId, row._max.updatedAt);
    for (const row of questions) record(row.userId, row._max.createdAt);

    return seen;
}

function userStatus(
    banned: boolean,
    lastActive: Date | undefined,
    activeSince: Date,
): AdminUserStatus {
    if (banned) return "deactivated";

    return lastActive && lastActive >= activeSince ? "active" : "inactive";
}

export async function getAdminUsers({
    query = "",
    page = 1,
    now = new Date(),
}: {
    query?: string;
    page?: number;
    now?: Date;
} = {}): Promise<AdminUsersView> {
    const search = query.trim();
    const where = search
        ? {
              OR: [
                  { name: { contains: search, mode: "insensitive" as const } },
                  { email: { contains: search, mode: "insensitive" as const } },
              ],
          }
        : {};

    const total = await prisma.user.count({ where });
    const { page: current, pageCount } = clampPage(
        page,
        total,
        ADMIN_USERS_PAGE_SIZE,
    );

    const users = await prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (current - 1) * ADMIN_USERS_PAGE_SIZE,
        take: ADMIN_USERS_PAGE_SIZE,
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            banned: true,
        },
    });

    const ids = users.map((user) => user.id);
    const activeSince = activitySince(now);

    const [plans, lastActive] = await Promise.all([
        plansByUser(ids),
        lastActiveByUser(ids),
    ]);

    const rows: AdminUserRow[] = users.map((user) => {
        const seen = lastActive.get(user.id);

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            planId: plans.get(user.id) ?? "free",
            status: userStatus(user.banned ?? false, seen, activeSince),
            lastActive: seen?.toISOString() ?? null,
            isAdmin: isAdminRole(user.role),
        };
    });

    return { users: rows, total, page: current, pageCount };
}
