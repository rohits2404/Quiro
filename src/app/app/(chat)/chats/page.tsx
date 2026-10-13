import { ChatHeader } from "@/components/chat/chat-header";
import { NewChatPanel } from "@/components/chat/new-chat-panel";
import { listLibraryDocuments } from "@/lib/chat-store";
import { requireOrganization, requireSession } from "@/lib/session";
import React from "react";

const NewChatsPage = async () => {
    const session = await requireSession();
    const organization = await requireOrganization();
    const documents = await listLibraryDocuments(organization.id);

    return (
        <>
            <ChatHeader user={session.user} title="New Chat" />
            <NewChatPanel documents={documents} />
        </>
    );
};

export default NewChatsPage;
