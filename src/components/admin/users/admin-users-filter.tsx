"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlusIcon, SearchIcon } from "lucide-react";

import { adminUsersHref, ADMIN_QUERY_MAX, ADMIN_TABS } from "@/lib/admin";
import { Button } from "@/components/ui/button";
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";

const DEBOUNCE_MS = 300;

const addUserTab = ADMIN_TABS.find((tab) => tab.label === "Add User")!;

function AdminUsersFilter({ query }: { query: string }) {
    const router = useRouter();
    const [isPending, startTransition] = React.useTransition();

    const [value, setValue] = React.useState(query);
    const [seen, setSeen] = React.useState(query);
    const [sent, setSent] = React.useState(query);

    if (query !== seen) {
        setSeen(query);

        if (query !== sent) {
            setSent(query);
            setValue(query);
        }
    }

    React.useEffect(() => {
        const next = value.trim();

        if (next === sent) return;

        const timer = setTimeout(() => {
            setSent(next);

            startTransition(() => {
                router.replace(adminUsersHref({ query: next }), {
                    scroll: false,
                });
            });
        }, DEBOUNCE_MS);

        return () => clearTimeout(timer);
    }, [value, sent, router]);

    return (
        <div className="flex flex-wrap items-center justify-between gap-3">
            <InputGroup className="h-10 w-full rounded-lg sm:w-100">
                <InputGroupAddon>
                    <SearchIcon />
                </InputGroupAddon>

                <InputGroupInput
                    type="search"
                    placeholder="Search Users…"
                    aria-label="Search users by name or email"
                    maxLength={ADMIN_QUERY_MAX}
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                />

                {isPending && (
                    <InputGroupAddon align="inline-end">
                        <Spinner className="size-4" />
                    </InputGroupAddon>
                )}
            </InputGroup>

            <Button
                size="lg"
                nativeButton={false}
                className="cursor-pointer px-4"
                render={<Link href={addUserTab.href} />}
            >
                <PlusIcon data-icon="inline-start" />
                Create User
            </Button>
        </div>
    );
}

export { AdminUsersFilter };
