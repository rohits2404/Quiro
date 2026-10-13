"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { SearchIcon } from "lucide-react";

import {
    libraryHref,
    LIBRARY_QUERY_MAX,
    type LibraryStatusFilter,
} from "@/lib/library";
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";

const DEBOUNCE_MS = 300;

function LibraryFilter({
    status,
    query,
}: {
    status: LibraryStatusFilter;
    query: string;
}) {
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
                router.replace(libraryHref({ status, query: next }), {
                    scroll: false,
                });
            });
        }, DEBOUNCE_MS);

        return () => clearTimeout(timer);
    }, [value, sent, status, router]);

    return (
        <InputGroup className="h-10 w-full rounded-lg sm:w-72">
            <InputGroupAddon>
                <SearchIcon />
            </InputGroupAddon>

            <InputGroupInput
                type="search"
                value={value}
                maxLength={LIBRARY_QUERY_MAX}
                placeholder="Filter By Name…"
                aria-label="Filter documents by name"
                onChange={(event) => setValue(event.target.value)}
            />

            {isPending && (
                <InputGroupAddon align="inline-end">
                    <Spinner className="size-4" />
                </InputGroupAddon>
            )}
        </InputGroup>
    );
}

export { LibraryFilter };
