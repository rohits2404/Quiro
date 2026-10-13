import { ClockIcon, DownloadIcon } from "lucide-react";

import { logAge, type AdminLogEntry } from "@/lib/admin-log";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";

function AdminActivityLog({ entries }: { entries: AdminLogEntry[] }) {
    return (
        <Card className="gap-0 py-0">
            <CardHeader className="flex flex-row items-center justify-between gap-4 px-6 py-4">
                <CardTitle className="text-base font-semibold">
                    Activity Log
                </CardTitle>

                <Button
                    variant="outline"
                    size="lg"
                    nativeButton={false}
                    className="cursor-pointer px-4"
                    render={<a href="/api/admin/logs/export" download />}
                >
                    <DownloadIcon data-icon="inline-start" />
                    Export CSV
                </Button>
            </CardHeader>

            <Separator />

            <CardContent className="flex flex-col p-0">
                {entries.length === 0 ? (
                    <Empty className="py-12">
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                <ClockIcon />
                            </EmptyMedia>
                            <EmptyTitle>Nothing Has Happened Yet</EmptyTitle>
                            <EmptyDescription>
                                Creating a User, Deactivating An Account Or
                                Changing a Security Setting All Show Up Here.
                            </EmptyDescription>
                        </EmptyHeader>
                    </Empty>
                ) : (
                    entries.map((entry, index) => (
                        <div key={entry.id}>
                            {index > 0 && <Separator />}

                            <div className="flex items-center gap-4 px-6 py-4">
                                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                    <ClockIcon className="size-4" />
                                </span>

                                <p className="min-w-0 flex-1 text-sm wrap-anywhere">
                                    <span className="font-semibold">
                                        {entry.actor}
                                    </span>{" "}
                                    {entry.description}
                                </p>

                                <time
                                    dateTime={entry.createdAt}
                                    title={new Date(
                                        entry.createdAt,
                                    ).toLocaleString()}
                                    className="shrink-0 font-mono text-sm text-muted-foreground"
                                >
                                    {logAge(entry.createdAt)}
                                </time>
                            </div>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    );
}

export { AdminActivityLog };
