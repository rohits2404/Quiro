"use client";

import { authErrorMessage } from "@/components/auth/auth-errors";
import { UserAvatar } from "@/components/auth/user-avatar";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import {
    authClient,
    SessionUser,
    organization as organizationClient,
} from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AvatarUploadDialog } from "./avatar-upload-dialog";
import { Button } from "@/components/ui/button";
import { SpinnerRing } from "@/components/common/spinner-ring";
import { Separator } from "@/components/ui/separator";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type Workspace = {
    id: string;
    name: string;
};

function AccountSettings({
    user,
    workspace,
}: {
    user: SessionUser;
    workspace: Workspace;
}) {
    const router = useRouter();

    const [name, setName] = useState(user.name ?? "");
    const [organizationName, setOrganizationName] = useState(workspace.name);

    const [saving, setSaving] = useState(false);
    const [removingAvatar, setRemovingAvatar] = useState(false);

    const trimmed = {
        name: name.trim(),
        organizationName: organizationName.trim(),
    };

    const changed = {
        name: trimmed.name !== (user.name ?? "").trim(),
        organizationName: trimmed.organizationName !== workspace.name.trim(),
    };

    const isDirty = Object.values(changed).some(Boolean);

    const isEmpty = !trimmed.name || !trimmed.organizationName;

    function reset() {
        setName(user.name ?? "");
        setOrganizationName(workspace.name);
    }

    async function refreshServerState() {
        await authClient.getSession({
            query: { disableCookieCache: true },
        });
        router.refresh();
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!isDirty || isEmpty) return;

        setSaving(true);

        if (changed.name) {
            const { error } = await authClient.updateUser({
                name: trimmed.name,
            });

            if (error) {
                setSaving(false);
                toast.add({
                    type: "error",
                    title: "Couldn't Save Your Name",
                    description: authErrorMessage(error, "Please Try Again."),
                });
                return;
            }
        }

        if (changed.organizationName) {
            const { error } = await organizationClient.update({
                organizationId: workspace.id,
                data: { name: trimmed.organizationName },
            });

            if (error) {
                setSaving(false);
                toast.add({
                    type: "error",
                    title: "Couldn't Rename The Workspace",
                    description: authErrorMessage(error, "Please Try Again."),
                });
                return;
            }
        }

        await refreshServerState();
        setSaving(false);

        toast.add({
            type: "success",
            title: "Settings Saved",
        });
    }

    async function handleAvatarUploaded() {
        await refreshServerState();

        toast.add({
            type: "success",
            title: "Profile Picture Updated",
        });
    }

    async function handleRemoveAvatar() {
        setRemovingAvatar(true);

        try {
            const response = await fetch("/api/avatar", {
                method: "DELETE",
            });

            if (!response.ok) {
                toast.add({
                    type: "error",
                    title: "Couldn't Remove Your Picture",
                    description: "Please Try Again.",
                });
                return;
            }

            await refreshServerState();

            toast.add({
                type: "success",
                title: "Profile Picture Removed",
            });
        } catch {
            toast.add({
                type: "error",
                title: "Couldn't Remove Your Picture",
                description: "Please Try Again.",
            });
        } finally {
            setRemovingAvatar(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <Card className="[--card-spacing:--spacing(6)]">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">
                        Profile
                    </CardTitle>

                    <CardDescription>
                        This Information Appears On Your Account And Exports.
                    </CardDescription>
                </CardHeader>

                <CardContent className="flex flex-col gap-6">
                    <div className="flex items-center gap-4">
                        <UserAvatar user={user} className="size-12 text-base" />

                        <AvatarUploadDialog onUploaded={handleAvatarUploaded}>
                            <Button
                                type="button"
                                variant="outline"
                                size="lg"
                                className="cursor-pointer"
                            >
                                Upload New
                            </Button>
                        </AvatarUploadDialog>

                        <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            className="cursor-pointer text-muted-foreground"
                            disabled={!user.image || removingAvatar}
                            onClick={handleRemoveAvatar}
                        >
                            {removingAvatar && <SpinnerRing />}
                            Remove
                        </Button>
                    </div>

                    <Separator />

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field>
                            <FieldLabel htmlFor="full-name">
                                Full Name
                            </FieldLabel>

                            <Input
                                id="full-name"
                                name="name"
                                value={name}
                                onChange={(event) =>
                                    setName(event.target.value)
                                }
                                autoComplete="name"
                                required
                                maxLength={64}
                                disabled={saving}
                                className="h-9"
                            />
                        </Field>

                        <Field>
                            <FieldLabel htmlFor="organization">
                                Organization
                            </FieldLabel>

                            <Input
                                id="organization"
                                name="organization"
                                value={organizationName}
                                onChange={(event) =>
                                    setOrganizationName(event.target.value)
                                }
                                autoComplete="organization"
                                required
                                maxLength={64}
                                disabled={saving}
                                className="h-9"
                            />
                        </Field>

                        <Field className="sm:col-span-2">
                            <FieldLabel htmlFor="email">
                                Email Address
                            </FieldLabel>

                            <Input
                                id="email"
                                name="email"
                                type="email"
                                value={user.email}
                                autoComplete="email"
                                readOnly
                                className="h-9 cursor-not-allowed bg-muted/60 text-muted-foreground"
                            />
                        </Field>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
                <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="cursor-pointer px-4"
                    disabled={!isDirty || saving}
                    onClick={reset}
                >
                    Cancel
                </Button>

                <Button
                    type="submit"
                    size="lg"
                    className="cursor-pointer gap-2 px-4"
                    disabled={!isDirty || isEmpty || saving}
                >
                    {saving && <SpinnerRing />}
                    Save Changes
                </Button>
            </div>
        </form>
    );
}

export { AccountSettings };
