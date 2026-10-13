import { AdminUsersFilter } from "@/components/admin/users/admin-users-filter";
import { AdminUsersTable } from "@/components/admin/users/admin-users-table";
import { ADMIN_ACTIVE_WINDOW_DAYS, ADMIN_QUERY_MAX } from "@/lib/admin";
import { requireAdmin } from "@/lib/session";
import { InfoIcon } from "lucide-react";
import React from "react";

const AdminUsersPage = async ({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; page?: string }>;
}) => {
    await requireAdmin();

    const { q, page } = await searchParams;
    const query = (q ?? "").slice(0, ADMIN_QUERY_MAX);
    const current = Number.parseInt(page ?? "1", 10);

    return (
        <div className="flex flex-col gap-6">
            <div>
                <AdminUsersFilter query={query} />

                <AdminUsersTable
                    key={`${query}:${current}`}
                    query={query}
                    page={Number.isNaN(current) ? 1 : current}
                />
            </div>

            <p className="flex items-start gap-2 rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
                <InfoIcon className="mt-0.5 size-4 shrink-0" />
                <span>
                    <span className="font-semibold text-foreground">
                        Inactive
                    </span>{" "}
                    Means No Sign-In And No Questions Asked In The Last{" "}
                    {ADMIN_ACTIVE_WINDOW_DAYS} Days.{" "}
                    <span className="font-semibold text-foreground">
                        Deactivated
                    </span>{" "}
                    Means The Account Is Blocked From Signing In.
                </span>
            </p>
        </div>
    );
};

export default AdminUsersPage;
