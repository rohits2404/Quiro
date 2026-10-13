import { requireApiAdmin } from "@/lib/api-session";
import { adminLogToCsv, listAdminLogForExport } from "@/lib/admin-log-store";

export async function GET() {
    const guard = await requireApiAdmin();
    if (!guard.ok) return guard.response;

    const entries = await listAdminLogForExport();
    const csv = adminLogToCsv(entries);
    const date = new Date().toISOString().slice(0, 10);

    return new Response(csv, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="docsy-activity-log-${date}.csv"`,
            "Cache-Control": "no-store, private",
        },
    });
}
