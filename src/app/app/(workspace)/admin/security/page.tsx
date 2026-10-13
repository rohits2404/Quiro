import { AdminSecuritySettings } from "@/components/admin/security/admin-security-settings";
import { getAppSettings } from "@/lib/app-settings-store";
import { requireAdmin } from "@/lib/session";
import React from "react";

const AdminSecurityPage = async () => {
    await requireAdmin();

    const settings = await getAppSettings();

    return <AdminSecuritySettings settings={settings} />;
};

export default AdminSecurityPage;
