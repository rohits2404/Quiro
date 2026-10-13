"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import {
    retentionToValue,
    RETENTION_OPTIONS,
    TOGGLE_SETTINGS,
    type AppSettings,
    type ToggleSettingKey,
} from "@/lib/app-settings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Field,
    FieldContent,
    FieldDescription,
    FieldGroup,
    FieldTitle,
} from "@/components/ui/field";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";

type SettingsPatch = {
    allowSignUps?: boolean;
    enforceTwoFactor?: boolean;
    maintenanceMode?: boolean;
    chatRetention?: string;
};

function AdminSecuritySettings({ settings }: { settings: AppSettings }) {
    const router = useRouter();
    const [current, setCurrent] = React.useState(settings);
    const [saving, setSaving] = React.useState<string | null>(null);

    const [seen, setSeen] = React.useState(settings);
    if (settings !== seen) {
        setSeen(settings);
        setCurrent(settings);
    }

    async function save(
        patch: SettingsPatch,
        field: string,
        revert: () => void,
    ) {
        setSaving(field);

        try {
            const response = await fetch("/api/admin/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(patch),
            });

            const payload = await response.json().catch(() => null);

            if (!response.ok) {
                revert();
                toast.add({
                    type: "error",
                    title: "Couldn't Save That.",
                    description: payload?.error ?? "Try Again In a Moment.",
                });
                return;
            }

            if (typeof payload?.deleted === "number" && payload.deleted > 0) {
                toast.add({
                    type: "success",
                    title: `Deleted ${payload.deleted} Chat${payload.deleted === 1 ? "" : "s"}.`,
                    description:
                        "They Were Older Than The New Retention Window.",
                });
            }

            router.refresh();
        } catch {
            revert();
            toast.add({
                type: "error",
                title: "Couldn't save That.",
                description: "Check Your Connection And Try Again.",
            });
        } finally {
            setSaving(null);
        }
    }

    function toggle(key: ToggleSettingKey, next: boolean) {
        const previous = current[key];

        setCurrent((held) => ({ ...held, [key]: next }));
        save({ [key]: next }, key, () =>
            setCurrent((held) => ({ ...held, [key]: previous })),
        );
    }

    function setRetention(value: string | null) {
        if (value === null) return;

        const previous = current.chatRetentionMonths;

        setCurrent((held) => ({
            ...held,
            chatRetentionMonths:
                value === "never" ? null : Number.parseInt(value, 10),
        }));
        save({ chatRetention: value }, "chatRetention", () =>
            setCurrent((held) => ({ ...held, chatRetentionMonths: previous })),
        );
    }

    return (
        <div className="flex max-w-160 flex-col gap-6">
            <Card className="gap-0 py-0">
                <CardHeader className="px-6 py-5">
                    <CardTitle className="text-base font-semibold">
                        Access &amp; Authentication
                    </CardTitle>
                </CardHeader>

                <Separator />

                <CardContent className="flex flex-col p-0">
                    {TOGGLE_SETTINGS.map((setting, index) => (
                        <React.Fragment key={setting.key}>
                            {index > 0 && <Separator />}

                            <Field
                                orientation="horizontal"
                                className="gap-6 px-6 py-4"
                                data-disabled={
                                    setting.unavailable ? true : undefined
                                }
                            >
                                <FieldContent>
                                    <FieldTitle>{setting.title}</FieldTitle>
                                    <FieldDescription>
                                        {setting.unavailable ??
                                            setting.description}
                                    </FieldDescription>
                                </FieldContent>

                                <Switch
                                    checked={current[setting.key]}
                                    onCheckedChange={(next) =>
                                        toggle(setting.key, next)
                                    }
                                    disabled={
                                        Boolean(setting.unavailable) ||
                                        saving === setting.key
                                    }
                                    aria-label={setting.title}
                                />
                            </Field>
                        </React.Fragment>
                    ))}
                </CardContent>
            </Card>

            <Card className="py-0">
                <CardContent className="p-6">
                    <FieldGroup>
                        <Field orientation="responsive" className="gap-6">
                            <FieldContent>
                                <FieldTitle>Data Retention</FieldTitle>
                                <FieldDescription>
                                    Auto-Delete Chats Older Than The Selected
                                    Window.
                                </FieldDescription>
                            </FieldContent>

                            <Select
                                items={RETENTION_OPTIONS}
                                value={retentionToValue(
                                    current.chatRetentionMonths,
                                )}
                                onValueChange={setRetention}
                                disabled={saving === "chatRetention"}
                            >
                                <SelectTrigger
                                    className="w-40"
                                    aria-label="Data retention"
                                >
                                    <SelectValue />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectGroup>
                                        {RETENTION_OPTIONS.map((option) => (
                                            <SelectItem
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </Field>
                    </FieldGroup>
                </CardContent>
            </Card>
        </div>
    );
}

export { AdminSecuritySettings };
