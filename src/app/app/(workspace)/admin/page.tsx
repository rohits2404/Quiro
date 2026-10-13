import { AdminActiveUsers } from "@/components/admin/overview/admin-active-users";
import { AdminStats } from "@/components/admin/overview/admin-stats";
import { ADMIN_TABS } from "@/lib/admin";
import { getAdminOverview } from "@/lib/admin-store";
import { requireAdmin } from "@/lib/session";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import React from "react";

const usersTab = ADMIN_TABS.find((tab) => tab.label === "Users")!;

const AdminPage = async () => {
    await requireAdmin();

    const overview = await getAdminOverview();

    return (
        <div className="flex flex-col gap-6">
            <AdminStats overview={overview} />

            <AdminActiveUsers users={overview.mostActive} />

            {usersTab.ready ? (
                <Link
                    href={usersTab.href}
                    className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-brand transition-colors hover:text-brand/80"
                >
                    Manage Users
                    <ArrowRightIcon className="size-4" />
                </Link>
            ) : (
                <span className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-muted-foreground">
                    Manage Users
                    <ArrowRightIcon className="size-4" />
                </span>
            )}
        </div>
    );
};

export default AdminPage;
