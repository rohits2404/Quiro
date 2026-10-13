import { formatCount, type AdminActiveUser } from "@/lib/admin";
import { Progress } from "@/components/ui/progress";
import { UserAvatar } from "@/components/auth/user-avatar";

function AdminActiveUsers({ users }: { users: AdminActiveUser[] }) {
    const busiest = users[0]?.questions ?? 0;

    return (
        <div className="rounded-xl border bg-card p-6">
            <h3 className="font-heading text-lg font-semibold">
                Most Active Users
            </h3>

            {users.length === 0 ? (
                <p className="mt-6 text-sm text-muted-foreground">
                    Nobody Has Asked a Question Yet This Month.
                </p>
            ) : (
                <ul className="mt-5 flex flex-col gap-4">
                    {users.map((user) => (
                        <li key={user.id} className="flex items-center gap-3">
                            <UserAvatar user={user} className="size-9" />

                            <span className="min-w-0 flex-1 truncate text-sm font-medium">
                                {user.name || user.email}
                            </span>

                            <Progress
                                value={
                                    busiest > 0
                                        ? (user.questions / busiest) * 100
                                        : 0
                                }
                                aria-label={`${user.name || user.email}: ${formatCount(user.questions)} Questions This Month`}
                                className="hidden w-40 **:data-[slot=progress-indicator]:rounded-full **:data-[slot=progress-indicator]:bg-brand **:data-[slot=progress-track]:h-1.5 **:data-[slot=progress-track]:bg-muted sm:block lg:w-72"
                            />

                            <span className="w-20 text-right font-mono text-sm text-muted-foreground tabular-nums">
                                {formatCount(user.questions)} Questions
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export { AdminActiveUsers };
