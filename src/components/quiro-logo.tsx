import { cn } from "@/lib/utils";

const MARK_SIZES = {
    default: "size-8",
    sm: "size-7",
};

const WORDMARK_SIZES = {
    default: "text-lg",
    sm: "text-base",
};

function QuiroMark({ className, ...props }: React.ComponentProps<"svg">) {
    return (
        <svg
            viewBox="0 0 40 40"
            fill="none"
            aria-hidden="true"
            className={cn("size-8 shrink-0", className)}
            {...props}
        >
            <defs>
                <linearGradient
                    id="quiro-mark-accent"
                    x1="10"
                    y1="10"
                    x2="32"
                    y2="32"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#A78BFA" />
                    <stop offset="1" stopColor="#38BDF8" />
                </linearGradient>
            </defs>

            {/* Rounded app tile */}
            <rect width="40" height="40" rx="11" className="fill-foreground" />

            {/* Document silhouette */}
            <path
                d="M10.5 8.5H22L29 15.5V29
           C29 30.1 28.1 31 27 31H12.5
           C11.4 31 10.5 30.1 10.5 29V8.5Z"
                className="fill-background"
            />

            {/* Folded page corner */}
            <path
                d="M22 8.5V14C22 14.8 22.7 15.5 23.5 15.5H29"
                stroke="currentColor"
                strokeOpacity=".35"
                strokeWidth="1.5"
                strokeLinejoin="round"
            />

            {/* Document text */}
            <path
                d="M14.5 18.5H21"
                stroke="currentColor"
                strokeOpacity=".45"
                strokeWidth="1.7"
                strokeLinecap="round"
            />
            <path
                d="M14.5 22.5H19"
                stroke="currentColor"
                strokeOpacity=".45"
                strokeWidth="1.7"
                strokeLinecap="round"
            />

            {/* AI answer lens */}
            <circle
                cx="26"
                cy="25"
                r="7.2"
                className="fill-background"
                stroke="url(#quiro-mark-accent)"
                strokeWidth="2"
            />

            {/* Answer signal */}
            <path
                d="M23.1 25.1L25.1 27.1L29.1 22.9"
                stroke="url(#quiro-mark-accent)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function QuiroLogo({
    size = "default",
    className,
    ...props
}: React.ComponentProps<"span"> & {
    size?: keyof typeof MARK_SIZES;
}) {
    return (
        <span
            className={cn("inline-flex items-center gap-2.5", className)}
            {...props}
        >
            <QuiroMark className={MARK_SIZES[size]} />

            <span
                className={cn(
                    "font-heading font-bold tracking-tight",
                    WORDMARK_SIZES[size],
                )}
            >
                Quiro
            </span>
        </span>
    );
}

export { QuiroLogo, QuiroMark };
