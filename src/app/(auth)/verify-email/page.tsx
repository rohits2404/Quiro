import Link from "next/link";
import { ArrowLeft, MailCheck } from "lucide-react";

type VerifyEmailPageProps = {
    searchParams: Promise<{
        email?: string | string[];
    }>;
};

export default async function VerifyEmailPage({
    searchParams,
}: VerifyEmailPageProps) {
    const params = await searchParams;

    const email = Array.isArray(params.email) ? params.email[0] : params.email;

    return (
        <main className="flex min-h-svh items-center justify-center bg-background px-5 py-12">
            <div className="w-full max-w-sm">
                <div className="flex flex-col items-center text-center">
                    <div className="mb-7 flex size-16 items-center justify-center rounded-2xl border bg-card shadow-sm">
                        <MailCheck
                            className="size-7 text-primary"
                            strokeWidth={1.6}
                        />
                    </div>

                    <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                        Check Your Inbox
                    </h1>

                    <p className="mt-3 max-w-xs text-sm leading-6 text-muted-foreground">
                        We'Ve Sent You A Verification Link To Confirm Your Email
                        Address And Finish Setting Up Your Account.
                    </p>

                    {email && (
                        <div className="mt-6 max-w-full rounded-full border bg-muted/40 px-4 py-2">
                            <p
                                className="truncate text-sm font-medium"
                                title={email}
                            >
                                {email}
                            </p>
                        </div>
                    )}

                    <p className="mt-6 text-sm leading-6 text-muted-foreground">
                        Didn't Receive The Email? Check Your Spam Folder Or Give
                        It A Moment To Arrive.
                    </p>

                    <Link
                        href="/"
                        className="mt-8 inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors hover:bg-accent"
                    >
                        <ArrowLeft className="size-4" />
                        Back To Home
                    </Link>
                </div>

                <div className="mt-12 flex items-center justify-center gap-2">
                    <span className="size-1.5 rounded-full bg-primary" />
                    <p className="text-xs text-muted-foreground">
                        Secure Your Account With Quiro
                    </p>
                </div>
            </div>
        </main>
    );
}
