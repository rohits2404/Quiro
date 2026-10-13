"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, CopyIcon, TriangleAlertIcon } from "lucide-react";

import {
    ACCOUNT_TYPES,
    adminUsersHref,
    MIN_CREATED_PASSWORD_LENGTH,
} from "@/lib/admin";
import type { PlanId } from "@/lib/billing";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";

type CreatedUser = {
    email: string;
    password: string | null;
    warning?: string;
};

function CreatedPanel({
    created,
    onCreateAnother,
}: {
    created: CreatedUser;
    onCreateAnother: () => void;
}) {
    const [copied, setCopied] = React.useState(false);

    async function copy() {
        if (!created.password) return;

        try {
            await navigator.clipboard.writeText(created.password);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.add({
                type: "error",
                title: "Couldn't Copy That.",
                description: "Select The Password And Copy It By Hand.",
            });
        }
    }

    return (
        <div className="flex flex-col gap-5">
            <div>
                <h3 className="font-heading text-lg font-semibold">
                    Account created
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    {created.email} Can Sign In Now.
                </p>
            </div>

            {created.warning && (
                <p className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm">
                    <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
                    <span>{created.warning}</span>
                </p>
            )}

            {created.password && (
                <div className="rounded-lg border bg-muted/40 p-4">
                    <p className="text-sm font-medium">Temporary password</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Shown Once, And Never Stored In A Form Anyone Can Read
                        Back. Copy It Before You Leave This Page.
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        <code className="flex-1 rounded-md border bg-background px-3 py-2 font-mono text-sm break-all">
                            {created.password}
                        </code>

                        <Button
                            variant="outline"
                            size="lg"
                            className="cursor-pointer px-4"
                            onClick={copy}
                        >
                            {copied ? <CheckIcon /> : <CopyIcon />}
                            {copied ? "Copied" : "Copy"}
                        </Button>
                    </div>
                </div>
            )}

            <div className="flex flex-wrap justify-end gap-3">
                <Button
                    variant="outline"
                    size="lg"
                    className="cursor-pointer px-4"
                    onClick={onCreateAnother}
                >
                    Create Another
                </Button>

                <Button
                    size="lg"
                    nativeButton={false}
                    className="cursor-pointer px-4"
                    render={<a href={adminUsersHref()} />}
                >
                    Back To Users
                </Button>
            </div>
        </div>
    );
}

function AdminCreateUserForm() {
    const router = useRouter();
    const [isSaving, setIsSaving] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [created, setCreated] = React.useState<CreatedUser | null>(null);

    const [name, setName] = React.useState("");
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [planId, setPlanId] = React.useState<PlanId>("free");

    function reset() {
        setCreated(null);
        setError(null);
        setName("");
        setEmail("");
        setPassword("");
        setPlanId("free");
    }

    async function submit(event: React.FormEvent) {
        event.preventDefault();
        setIsSaving(true);
        setError(null);

        try {
            const response = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password, planId }),
            });

            const payload = await response.json().catch(() => null);

            if (!response.ok && response.status !== 207) {
                setError(payload?.error ?? "Try Again In A Moment.");
                return;
            }

            setCreated({
                email: payload.email,
                password: payload.password ?? null,
                warning: payload.warning,
            });

            router.refresh();
        } catch {
            setError("Check Your Connection And Try Again.");
        } finally {
            setIsSaving(false);
        }
    }

    if (created) {
        return <CreatedPanel created={created} onCreateAnother={reset} />;
    }

    return (
        <form onSubmit={submit} className="flex flex-col gap-5">
            <div>
                <h3 className="font-heading text-lg font-semibold">
                    Create a user
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    Add A User Directly. They Can Sign In Immediately With These
                    Credentials.
                </p>
            </div>

            <Field>
                <FieldLabel htmlFor="admin-new-name">User Name</FieldLabel>
                <Input
                    id="admin-new-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="ada.lovelace"
                    autoComplete="off"
                    required
                    disabled={isSaving}
                />
            </Field>

            <Field>
                <FieldLabel htmlFor="admin-new-email">Email Address</FieldLabel>
                <Input
                    id="admin-new-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="ada@company.com"
                    autoComplete="off"
                    required
                    disabled={isSaving}
                />
            </Field>

            <Field>
                <FieldLabel htmlFor="admin-new-password">
                    Temporary Password
                </FieldLabel>
                <Input
                    id="admin-new-password"
                    type="text"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Auto-Generated If Left Blank"
                    autoComplete="off"
                    minLength={MIN_CREATED_PASSWORD_LENGTH}
                    disabled={isSaving}
                />
            </Field>

            <fieldset disabled={isSaving}>
                <legend className="text-sm font-medium">Account Type</legend>

                <div className="mt-2 grid gap-3 sm:grid-cols-3">
                    {ACCOUNT_TYPES.map((option) => {
                        const isSelected = option.planId === planId;

                        return (
                            <label
                                key={option.planId}
                                className={cn(
                                    "cursor-pointer rounded-xl border p-4 transition-colors",
                                    isSelected
                                        ? "border-brand bg-brand/10"
                                        : "hover:border-foreground/20",
                                )}
                            >
                                <input
                                    type="radio"
                                    name="account-type"
                                    value={option.planId}
                                    checked={isSelected}
                                    onChange={() => setPlanId(option.planId)}
                                    className="sr-only"
                                />
                                <span className="block text-sm font-semibold">
                                    {option.name}
                                </span>
                                <span className="mt-0.5 block text-sm text-muted-foreground">
                                    {option.detail}
                                </span>
                            </label>
                        );
                    })}
                </div>
            </fieldset>

            {planId !== "free" && (
                <p className="text-sm text-muted-foreground">
                    This Grants The Plan Without A Payment. It's Recorded As
                    Granted By You, And Their Billing Tab Will Say So Rather
                    Than Showing A Price.
                </p>
            )}

            {error && (
                <p role="alert" className="text-sm text-destructive">
                    {error}
                </p>
            )}

            <div className="flex flex-wrap justify-end gap-3">
                <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    nativeButton={false}
                    className="cursor-pointer px-4"
                    render={<a href={adminUsersHref()} />}
                >
                    Cancel
                </Button>

                <Button
                    type="submit"
                    size="lg"
                    className="cursor-pointer px-4"
                    disabled={isSaving}
                >
                    {isSaving && <Spinner data-icon="inline-start" />}
                    Create User
                </Button>
            </div>
        </form>
    );
}

export { AdminCreateUserForm };
