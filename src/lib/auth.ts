import { after } from "next/server";
import { betterAuth } from "better-auth";
import {
    APIError,
    createAuthMiddleware,
    getSessionFromCtx,
} from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin, organization } from "better-auth/plugins";

import { purgeUserData } from "@/lib/account";
import {
    describeDeactivated,
    describeReactivated,
    LOG_ACTIONS,
} from "@/lib/admin-log";
import { actorNameFor, recordAdminLog } from "@/lib/admin-log-store";
import { isAdminRole } from "@/lib/admin";
import { getAppSettings } from "@/lib/app-settings-store";
import { configuredSocialProviders } from "@/lib/auth-providers";
import { prisma } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";

const isProduction = process.env.NODE_ENV === "production";

const trustedOrigins =
    process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",")
        .map((origin) => origin.trim())
        .filter(Boolean) ?? [];

export const bootstrapAdminIds =
    process.env.ADMIN_USER_IDS?.split(",")
        .map((id) => id.trim())
        .filter(Boolean) ?? [];

export const auth = betterAuth({
    appName: "Quiro",

    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),

    trustedOrigins,

    emailAndPassword: {
        enabled: true,
        minPasswordLength: 8,
        maxPasswordLength: 128,
        requireEmailVerification: true,
    },

    emailVerification: {
        sendOnSignUp: true,
        autoSignInAfterVerification: true,
        expiresIn: 60 * 60,

        sendVerificationEmail: async ({ user, url }) => {
            await sendVerificationEmail({
                to: user.email,
                url,
            });
        },
    },

    hooks: {
        after: createAuthMiddleware(async (ctx) => {
            const logged = new Set(["/admin/ban-user", "/admin/unban-user"]);

            if (!logged.has(ctx.path)) return;

            const session =
                ctx.context.session ?? (await getSessionFromCtx(ctx));

            const actor = session?.user;

            if (!actor || !isAdminRole((actor as { role?: string }).role)) {
                return;
            }

            const actorName = actor.name || actor.email || null;

            const body = (ctx.body ?? {}) as {
                userId?: string;
            };

            if (!body.userId) return;

            const banned = ctx.path === "/admin/ban-user";

            const subject = (await actorNameFor(body.userId)) ?? "an account";

            await recordAdminLog({
                action: banned
                    ? LOG_ACTIONS.userDeactivated
                    : LOG_ACTIONS.userReactivated,

                description: banned
                    ? describeDeactivated(subject)
                    : describeReactivated(subject),

                actorId: actor.id,
                actorName,
                targetId: body.userId,
            });
        }),
    },

    databaseHooks: {
        user: {
            create: {
                before: async (_user, context) => {
                    const { allowSignUps } = await getAppSettings();

                    if (
                        allowSignUps ||
                        context?.path === "/admin/create-user"
                    ) {
                        return;
                    }

                    throw new APIError("FORBIDDEN", {
                        message: "New sign-ups are closed right now.",
                    });
                },
            },
        },
    },

    user: {
        deleteUser: {
            enabled: true,

            beforeDelete: async (user) => {
                await purgeUserData(user.id);
            },
        },

        changeEmail: {
            enabled: true,
        },
    },

    socialProviders: configuredSocialProviders(),

    account: {
        encryptOAuthTokens: true,

        accountLinking: {
            enabled: true,
            trustedProviders: ["google", "github"],
            updateUserInfoOnLink: true,
        },
    },

    session: {
        expiresIn: 60 * 60 * 24 * 7,
        updateAge: 60 * 60 * 24,
        freshAge: 60 * 60,

        cookieCache: {
            enabled: true,
            maxAge: 60 * 5,
        },
    },

    rateLimit: {
        enabled: true,
        storage: "database",
        window: 10,
        max: 100,

        customRules: {
            "/sign-in/email": {
                window: 60,
                max: 5,
            },

            "/sign-up/email": {
                window: 60,
                max: 3,
            },
        },
    },

    advanced: {
        useSecureCookies: isProduction,

        ipAddress: {
            ipAddressHeaders: ["x-forwarded-for", "x-real-ip"],
        },

        backgroundTasks: {
            handler: (promise) => after(promise),
        },
    },

    plugins: [
        organization({
            organizationLimit: 5,
            membershipLimit: 100,
        }),

        admin({
            defaultRole: "user",
            adminRoles: ["admin"],
            adminUserIds: bootstrapAdminIds,
        }),

        nextCookies(),
    ],
});

export type Session = typeof auth.$Infer.Session;
export type SessionUser = Session["user"];
