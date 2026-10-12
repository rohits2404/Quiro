import { HomeQuickActions } from "@/components/dashboard/home/home-quick-actions";
import { HomeRecentChats } from "@/components/dashboard/home/home-recent-chats";
import { HomeRecentDocuments } from "@/components/dashboard/home/home-recent-documents";
import { HomeStats } from "@/components/dashboard/home/home-stats";
import { requireSession } from "@/lib/session";
import React from "react";

function greeting(date = new Date()) {
    const hour = date.getHours();

    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
}

const WorkspacePage = async () => {
    const session = await requireSession();
    const firstName = session.user.name?.trim().split(/\s+/)[0];

    return (
        <div className="mx-auto w-full max-w-272 px-6 py-10">
            <h2 className="font-heading text-3xl font-bold tracking-tight">
                {greeting()}
                {firstName ? `, ${firstName}` : ""}
            </h2>
            <p className="mt-2 text-muted-foreground">
                Ask a Question, Or Pick Up Where You Left Off.
            </p>

            <div className="mt-8">
                <HomeQuickActions />
            </div>

            <div className="mt-6">
                <HomeStats />
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-2">
                <HomeRecentChats />
                <HomeRecentDocuments />
            </div>
        </div>
    );
};

export default WorkspacePage;
