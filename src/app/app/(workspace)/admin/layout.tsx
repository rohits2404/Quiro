import { AdminTabs } from "@/components/admin/admin-tabs";
import { requireAdmin } from "@/lib/session";
import React from "react";

const AdminLayout = async ({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) => {
    await requireAdmin();

    return (
        <div className="mx-auto w-full max-w-240 px-6 py-10">
            <h2 className="font-heading text-3xl font-bold tracking-tight">
                Admin Console
            </h2>
            <p className="mt-2 text-muted-foreground">
                Control The App And Every User Account.
            </p>

            <div className="mt-8">
                <AdminTabs />
            </div>

            <div className="mt-6">{children}</div>
        </div>
    );
};

export default AdminLayout;
