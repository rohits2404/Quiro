import { formatCount, type AdminOverview } from "@/lib/admin";

function StatTile({
    label,
    value,
    suffix,
}: {
    label: string;
    value: string;
    suffix?: string;
}) {
    return (
        <div className="rounded-xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight">
                {value}
                {suffix && (
                    <span className="ml-1.5 text-base font-normal text-muted-foreground">
                        {suffix}
                    </span>
                )}
            </p>
        </div>
    );
}

function AdminStats({ overview }: { overview: AdminOverview }) {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile
                label="Documents Indexed"
                value={formatCount(overview.documentsIndexed)}
            />
            <StatTile
                label="Questions This Month"
                value={formatCount(overview.questionsThisMonth)}
            />
            <StatTile
                label="Active Users · 30d"
                value={formatCount(overview.activeUsers)}
            />
            <StatTile
                label="Paid Subscribers"
                value={formatCount(overview.paidSubscribers)}
                suffix={`/ ${formatCount(overview.totalUsers)}`}
            />
        </div>
    );
}

export { AdminStats };
