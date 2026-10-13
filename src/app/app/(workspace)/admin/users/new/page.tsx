import { AdminCreateUserForm } from "@/components/admin/users/admin-create-user-form";
import { requireAdmin } from "@/lib/session";
import React from "react";

const AdminAddUserPage = async () => {
    await requireAdmin();

    return (
        <div className="max-w-160 rounded-xl border bg-card p-6">
            <AdminCreateUserForm />
        </div>
    );
};

export default AdminAddUserPage;
