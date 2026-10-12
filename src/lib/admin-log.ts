import type { PlanId } from "@/lib/billing";
import { planName } from "@/lib/billing";

export const ADMIN_LOG_PAGE_SIZE = 50;

export const SYSTEM_ACTOR = "System";

export const LOG_ACTIONS = {
    userCreated: "user.created",
    userDeactivated: "user.deactivated",
    userReactivated: "user.reactivated",
    passwordResetSent: "user.password_reset_sent",
    planGranted: "plan.granted",
    settingChanged: "settings.changed",
    chatsPurged: "retention.chats_purged",
} as const;

export type LogAction = (typeof LOG_ACTIONS)[keyof typeof LOG_ACTIONS];

export type AdminLogEntry = {
    id: string;
    actor: string;
    action: string;
    description: string;
    createdAt: string;
};

export function describeUserCreated(email: string, planId: PlanId) {
    return `Created User ${email} (${planName(planId)})`;
}

export function describePlanGranted(subject: string, planId: PlanId) {
    return `Upgraded ${subject} To ${planName(planId)}`;
}

export function describeDeactivated(subject: string) {
    return `Deactivated ${subject}`;
}

export function describeReactivated(subject: string) {
    return `Reactivated ${subject}`;
}

export function describePasswordReset(email: string) {
    return `Sent A Password Reset To ${email}`;
}

export function describeSettingChange(
    key: "maintenanceMode" | "allowSignUps" | "enforceTwoFactor",
    value: boolean,
) {
    switch (key) {
        case "maintenanceMode":
            return `${value ? "Enabled" : "Disabled"} Maintenance Mode`;
        case "allowSignUps":
            return `Turned ${value ? "On" : "Off"} New Sign-Ups`;
        case "enforceTwoFactor":
            return `${value ? "Enabled" : "Disabled"} Enforced Two-Factor Authentication`;
    }
}

export function describeRetentionChange(months: number | null) {
    return months === null
        ? "Turned Off Automatic Chat Deletion"
        : `Set Data Retention To ${months} Months`;
}

export function describeChatsPurged(count: number, months: number) {
    return `Deleted ${count} Chat${count === 1 ? "" : "s"} Older Than ${months} Months`;
}

export function logAge(iso: string, now: Date = new Date()) {
    const seconds = Math.max(
        0,
        (now.getTime() - new Date(iso).getTime()) / 1000,
    );
    const minutes = seconds / 60;
    const hours = minutes / 60;
    const days = hours / 24;

    if (seconds < 60) return "Just Now";
    if (minutes < 60) return `${Math.floor(minutes)}M Ago`;
    if (hours < 24) return `${Math.floor(hours)}H Ago`;
    if (days < 7) return `${Math.floor(days)}D Ago`;
    if (days < 30) return `${Math.floor(days / 7)}W Ago`;
    if (days < 365) return `${Math.floor(days / 30)}Mo Ago`;

    return `${Math.floor(days / 365)}Y Ago`;
}
