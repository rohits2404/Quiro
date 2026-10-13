"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
    ArrowUpIcon,
    CircleAlertIcon,
    MoreVerticalIcon,
    RotateCcwIcon,
} from "lucide-react";

import type { AdminUserRow } from "@/lib/admin";
import { nextPlanUp, planName } from "@/lib/billing";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";

function AdminUserRowActions({ user }: { user: AdminUserRow }) {
    const router = useRouter();

    const [isConfirming, setIsConfirming] = React.useState(false);
    const [isSaving, setIsSaving] = React.useState(false);

    const isDeactivated = user.status === "deactivated";
    const upgrade = nextPlanUp(user.planId);

    async function toggleDeactivated() {
        setIsSaving(true);

        try {
            const { error } = isDeactivated
                ? await import("@/lib/auth-client").then(({ authClient }) =>
                      authClient.admin.unbanUser({ userId: user.id }),
                  )
                : await import("@/lib/auth-client").then(({ authClient }) =>
                      authClient.admin.banUser({
                          userId: user.id,
                          banReason: "Deactivated From The Admin Console",
                      }),
                  );

            if (error) {
                toast.add({
                    type: "error",
                    title: isDeactivated
                        ? "Couldn't Reactivate That Account."
                        : "Couldn't Deactivate That Account.",
                    description: error.message ?? "Try Again In A Moment.",
                });
                return;
            }

            toast.add({
                type: "success",
                title: isDeactivated
                    ? `${user.name || user.email} Can Sign In Again.`
                    : `${user.name || user.email} Has Been Deactivated.`,
                description: isDeactivated
                    ? "Their Account Is Active From Now On."
                    : "They're Signed Out Everywhere And Can't Sign Back In.",
            });

            setIsConfirming(false);
            router.refresh();
        } catch {
            toast.add({
                type: "error",
                title: "Couldn't Change That Account.",
                description: "Check Your Connection And Try Again.",
            });
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger
                    render={
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            className="cursor-pointer text-muted-foreground"
                            aria-label={`Actions for ${user.name || user.email}`}
                        >
                            <MoreVerticalIcon />
                        </Button>
                    }
                />

                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem disabled className="opacity-100">
                        <ArrowUpIcon />
                        {upgrade
                            ? `On ${planName(user.planId)} Plan`
                            : "On Highest Plan"}
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                        variant={isDeactivated ? "default" : "destructive"}
                        className="cursor-pointer"
                        disabled={user.isAdmin}
                        onClick={() => setIsConfirming(true)}
                    >
                        {isDeactivated ? (
                            <RotateCcwIcon />
                        ) : (
                            <CircleAlertIcon />
                        )}
                        {isDeactivated ? "Reactivate User" : "Deactivate User"}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog
                open={isConfirming}
                onOpenChange={(open) => {
                    if (!open && !isSaving) setIsConfirming(false);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {isDeactivated
                                ? "Reactivate This Account?"
                                : "Deactivate This Account?"}
                        </AlertDialogTitle>

                        <AlertDialogDescription>
                            {isDeactivated
                                ? `${user.name || user.email} Will Be Able To Sign In Again. Their Documents And Chats Were Never Touched.`
                                : `${user.name || user.email} Will Be Signed Out Everywhere And Refused At Sign-In. Nothing Is Deleted — Their Documents, Chats And Workspace Stay Exactly As They Are, And You Can Reactivate Them Here.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSaving}>
                            Cancel
                        </AlertDialogCancel>

                        <AlertDialogAction
                            disabled={isSaving}
                            onClick={toggleDeactivated}
                            className={
                                isDeactivated
                                    ? undefined
                                    : "bg-destructive text-white hover:bg-destructive/90"
                            }
                        >
                            {isSaving && <Spinner data-icon="inline-start" />}
                            {isDeactivated
                                ? "Reactivate User"
                                : "Deactivate User"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

export { AdminUserRowActions };
