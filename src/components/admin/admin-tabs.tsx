"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ADMIN_TABS } from "@/lib/admin";
import { cn } from "@/lib/utils";

function AdminTabs() {
    const pathname = usePathname();
    const activeRef = React.useRef<HTMLAnchorElement>(null);

    React.useEffect(() => {
        activeRef.current?.scrollIntoView({
            block: "nearest",
            inline: "nearest",
        });
    }, [pathname]);

    return (
        <nav
            aria-label="Admin sections"
            className="flex scrollbar-none items-center gap-1 overflow-x-auto border-b"
        >
            {ADMIN_TABS.map((tab) => {
                const isActive = pathname === tab.href;
                const className = cn(
                    "-mb-px inline-flex items-center border-b-2 border-transparent px-3 pb-3 text-sm whitespace-nowrap transition-colors",
                    isActive
                        ? "border-foreground font-semibold text-foreground"
                        : "text-muted-foreground",
                );

                if (!tab.ready) {
                    return (
                        <span
                            key={tab.href}
                            aria-disabled
                            className={cn(className, "cursor-default")}
                        >
                            {tab.label}
                        </span>
                    );
                }

                return (
                    <Link
                        key={tab.href}
                        ref={isActive ? activeRef : undefined}
                        href={tab.href}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(className, "hover:text-foreground")}
                    >
                        {tab.label}
                    </Link>
                );
            })}
        </nav>
    );
}

export { AdminTabs };
