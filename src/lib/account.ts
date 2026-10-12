import { prisma } from "@/lib/db";

async function soleOrganizationIds(userId: string) {
    const memberships = await prisma.member.findMany({
        where: { userId },
        select: { organizationId: true },
    });

    const organizationIds = memberships.map((member) => member.organizationId);

    if (organizationIds.length === 0) return [];

    const shared = await prisma.member.findMany({
        where: {
            organizationId: { in: organizationIds },
            userId: { not: userId },
        },
        select: { organizationId: true },
        distinct: ["organizationId"],
    });

    const sharedIds = new Set(shared.map((member) => member.organizationId));

    return organizationIds.filter((id) => !sharedIds.has(id));
}

export async function purgeUserData(userId: string) {
    const organizationIds = await soleOrganizationIds(userId);

    await prisma.$transaction([
        prisma.avatar.deleteMany({ where: { userId } }),
        prisma.chat.deleteMany({
            where: { organizationId: { in: organizationIds } },
        }),
        prisma.document.deleteMany({
            where: { organizationId: { in: organizationIds } },
        }),
        prisma.questionEvent.deleteMany({
            where: { organizationId: { in: organizationIds } },
        }),
        prisma.organization.deleteMany({
            where: { id: { in: organizationIds } },
        }),
    ]);
}
