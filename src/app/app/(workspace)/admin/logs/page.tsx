import { AdminActivityLog } from "@/components/admin/logs/admin-activity-log";
import { listAdminLog } from "@/lib/admin-log-store";
import { requireAdmin } from "@/lib/session";
import React from "react";

const AdminLogsPage = async () => {
    await requireAdmin();

    const entries = await listAdminLog();

    return <AdminActivityLog entries={entries} />;
};

export default AdminLogsPage;
