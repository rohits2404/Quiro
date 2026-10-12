"use client";

import { signIn } from "@/lib/auth-client";
import { SocialProviderId } from "@/lib/auth-providers";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { authErrorMessage } from "./auth-errors";
import { AuthDialogShell, AuthSwitchButton } from "./auth-dialog-shell";
import { SocialAuthButtons } from "./social-auth-buttons";
import {
    AuthDivider,
    AuthField,
    AuthFormError,
    AuthSubmitButton,
} from "./auth-form-parts";

type View = "credentials";

const COPY: Record<View, { title: string; description: string }> = {
    credentials: {
        title: "Sign In To Quiro",
        description: "Welcome Back — Continue To Your Workspace",
    },
};

function SignInDialog({
    open,
    onOpenChange,
    onSwitchToSignUp,
    socialProviders = [],
    callbackURL = "/",
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSwitchToSignUp: () => void;
    socialProviders?: SocialProviderId[];
    callbackURL?: string;
}) {
    const router = useRouter();

    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function handleOpenChange(next: boolean) {
        if (!next) {
            setError(null);
        }

        onOpenChange(next);
    }

    async function handleSignIn(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const form = new FormData(event.currentTarget);

        setPending(true);
        setError(null);

        try {
            const { error: signInError } = await signIn.email({
                email: String(form.get("email")),
                password: String(form.get("password")),
            });

            if (signInError) {
                setError(
                    authErrorMessage(signInError, "Could Not Sign You In."),
                );
                return;
            }

            handleOpenChange(false);
            router.push(callbackURL);
        } catch {
            setError("Something Went Wrong. Please Try Again.");
        } finally {
            setPending(false);
        }
    }

    const { title, description } = COPY.credentials;

    return (
        <AuthDialogShell
            open={open}
            onOpenChange={handleOpenChange}
            title={title}
            description={description}
            footer={
                <>
                    Don&apos;t Have An Account?{" "}
                    <AuthSwitchButton onClick={onSwitchToSignUp}>
                        Sign Up
                    </AuthSwitchButton>
                </>
            }
        >
            <div className="flex flex-col gap-5">
                <SocialAuthButtons
                    providers={socialProviders}
                    callbackURL={callbackURL}
                    disabled={pending}
                    onError={(message) => setError(message || null)}
                />

                {socialProviders.length > 0 && <AuthDivider />}

                <form onSubmit={handleSignIn} className="flex flex-col gap-4">
                    <AuthFormError>{error}</AuthFormError>

                    <AuthField
                        id="sign-in-email"
                        name="email"
                        type="email"
                        label="Email address"
                        placeholder="you@company.com"
                        autoComplete="email"
                        required
                        disabled={pending}
                    />

                    <AuthField
                        id="sign-in-password"
                        name="password"
                        type="password"
                        label="Password"
                        placeholder="Your Password"
                        autoComplete="current-password"
                        required
                        disabled={pending}
                    />

                    <div className="mt-1">
                        <AuthSubmitButton pending={pending}>
                            Continue
                        </AuthSubmitButton>
                    </div>
                </form>
            </div>
        </AuthDialogShell>
    );
}

export { SignInDialog };
