"use client";

import { XIcon } from "lucide-react";
import { Button } from "../ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "../ui/dialog";
import { QuiroMark } from "../quiro-logo";

function AuthDialogShell({
    open,
    onOpenChange,
    title,
    description,
    footer,
    children,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    footer: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton={false}
                className="max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto p-0 sm:max-w-100"
            >
                <DialogClose
                    render={
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            className="absolute top-2 right-2 text-muted-foreground"
                        />
                    }
                >
                    <XIcon />
                    <span className="sr-only">Close</span>
                </DialogClose>

                <div className="flex flex-col gap-4 px-6 pt-5 pb-4">
                    <div className="flex flex-col items-center gap-2.5 text-center">
                        <QuiroMark className="size-9" />

                        <div className="flex flex-col gap-1">
                            <DialogTitle className="font-heading text-xl leading-tight font-bold">
                                {title}
                            </DialogTitle>

                            <DialogDescription className="text-sm">
                                {description}
                            </DialogDescription>
                        </div>
                    </div>

                    {children}
                </div>

                <div className="border-t bg-muted/50 px-5 py-3 text-center text-sm text-muted-foreground">
                    {footer}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function AuthSwitchButton({
    onClick,
    children,
}: {
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="font-semibold text-brand underline-offset-4 hover:underline"
        >
            {children}
        </button>
    );
}

export { AuthDialogShell, AuthSwitchButton };
