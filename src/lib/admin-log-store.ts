import {
    ADMIN_LOG_PAGE_SIZE,
    SYSTEM_ACTOR,
    type AdminLogEntry,
    type LogAction,
} from "@/lib/admin-log";
import { prisma } from "@/lib/db";

export async function recordAdminLog({
    action,
    description,
    actorId,
    actorName,
    targetId,
}: {
    action: LogAction;
    description: string;
    actorId?: string | null;
    actorName?: string | null;
    targetId?: string | null;
}) {
    try {
        await prisma.adminLog.create({
            data: {
                action,
                description,
                actorId: actorId ?? null,
                actorName: actorName ?? null,
                targetId: targetId ?? null,
            },
        });
    } catch (error) {
        console.error("[admin-log] could not record", action, error);
    }
}

/** The actor's name for the log, resolved once at write time. */
export async function actorNameFor(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
    });

    return user?.name || user?.email || null;
}

function toEntry(row: {
    id: string;
    actorName: string | null;
    action: string;
    description: string;
    createdAt: Date;
}): AdminLogEntry {
    return {
        id: row.id,
        // A null actor is the app itself — the log says so rather than leaving a
        // sentence with nobody at the front of it.
        actor: row.actorName ?? SYSTEM_ACTOR,
        action: row.action,
        description: row.description,
        createdAt: row.createdAt.toISOString(),
    };
}

/** The newest entries, most recent first. */
export async function listAdminLog(
    limit = ADMIN_LOG_PAGE_SIZE,
): Promise<AdminLogEntry[]> {
    const rows = await prisma.adminLog.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
    });

    return rows.map(toEntry);
}

/** Every entry, for the export. */
export async function listAdminLogForExport(): Promise<AdminLogEntry[]> {
    const rows = await prisma.adminLog.findMany({
        orderBy: { createdAt: "desc" },
    });

    return rows.map(toEntry);
}

/** RFC 4180: quote every field, and double the quotes inside one. */
function csvCell(value: string) {
    return `"${value.replace(/"/g, '""')}"`;
}

/**
 * The log as a CSV.
 *
 * Actor and description are separate columns rather than the one sentence the
 * page renders — a spreadsheet wants to sort by who did it, and gluing the two
 * together would make that a text-parsing exercise.
 */
export function adminLogToCsv(entries: AdminLogEntry[]) {
    const header = ["Timestamp", "Actor", "Action", "Description"];

    const rows = entries.map((entry) =>
        [entry.createdAt, entry.actor, entry.action, entry.description]
            .map(csvCell)
            .join(","),
    );

    return [header.map(csvCell).join(","), ...rows].join("\r\n");
}
