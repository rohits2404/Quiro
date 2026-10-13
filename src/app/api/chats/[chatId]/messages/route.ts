import { NextResponse } from "next/server";
import { isGroqConfigured } from "@/lib/groq";
import { requireApiContext } from "@/lib/api-session";
import { streamAnswer } from "@/lib/answer";
import { AllowanceSpentMessage, type ChatSource } from "@/lib/chat";
import {
    addMessage,
    getChat,
    getChatDocuments,
    getChatHistory,
    getQuestionAllowance,
    recordQuestion,
} from "@/lib/chat-store";

export const maxDuration = 300;

export async function POST(
    request: Request,
    { params }: { params: Promise<{ chatId: string }> },
) {
    const guard = await requireApiContext();

    if (!guard.ok) return guard.response;

    if (!isGroqConfigured()) {
        return NextResponse.json(
            {
                error: "GROQ_API_KEY isn't set, so Quiro can't answer yet.",
            },
            { status: 503 },
        );
    }

    const { chatId } = await params;

    const chat = await getChat(chatId, guard.context.organizationId);

    if (!chat) {
        return NextResponse.json({ error: "Chat not found." }, { status: 404 });
    }

    let body: {
        question?: unknown;
        documentIds?: unknown;
    } = {};

    try {
        body = await request.json();
    } catch {}

    const question =
        typeof body.question === "string" ? body.question.trim() : undefined;

    if (question) {
        const allowance = await getQuestionAllowance(
            guard.context.organizationId,
        );

        if (allowance.spent) {
            return NextResponse.json(
                { error: AllowanceSpentMessage(allowance.limit) },
                { status: 402 },
            );
        }

        await addMessage({
            chatId,
            role: "USER",
            content: question,
        });
    } else if (!chat.pendingAnswer) {
        return NextResponse.json(
            {
                error: "That chat has nothing waiting on an answer.",
            },
            { status: 409 },
        );
    }

    const [attached, history] = await Promise.all([
        getChatDocuments(chatId),
        getChatHistory(chatId),
    ]);

    if (attached.length === 0) {
        return NextResponse.json(
            { error: "That chat has no documents to read." },
            { status: 409 },
        );
    }

    const scope = Array.isArray(body.documentIds)
        ? body.documentIds.filter((id): id is string => typeof id === "string")
        : null;

    const documents =
        scope === null
            ? attached
            : attached.filter((document) => scope.includes(document.id));

    if (documents.length === 0) {
        return NextResponse.json(
            {
                error: "None of those documents belong to this chat.",
            },
            { status: 400 },
        );
    }

    if (question) {
        await recordQuestion({
            organizationId: guard.context.organizationId,
            userId: guard.context.userId,
            chatId,
        });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
            const send = (event: unknown) => {
                controller.enqueue(
                    encoder.encode(`${JSON.stringify(event)}\n`),
                );
            };

            let answer = "";

            try {
                for await (const event of streamAnswer(documents, history)) {
                    if (event.type === "text") {
                        answer += event.value;
                        send(event);
                        continue;
                    }

                    if (event.type === "error") {
                        send(event);
                        return;
                    }

                    if (!answer.trim()) {
                        send({
                            type: "error",
                            value: "Groq returned an empty answer.",
                        });
                        return;
                    }

                    const saved = await addMessage({
                        chatId,
                        role: "ASSISTANT",
                        content: answer,
                        sources: event.sources as ChatSource[],
                    });

                    send({
                        type: "done",
                        sources: event.sources,
                        messageId: saved.id,
                    });
                }
            } catch (error) {
                console.error("[chat] Groq streaming failed", error);

                send({
                    type: "error",
                    value: "The answer stopped unexpectedly.",
                });
            } finally {
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "application/x-ndjson; charset=utf-8",
            "Cache-Control": "no-store",
        },
    });
}
