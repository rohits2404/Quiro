import { createGroq } from "@ai-sdk/groq";
import type { LanguageModel } from "ai";

export const GROQ_MODEL_ID = "openai/gpt-oss-120b";

export const GROQ_UTILITY_MODEL_ID = "openai/gpt-oss-120b";

export const GROQ_MAX_TOKENS = 8192;

const groq = createGroq({
    apiKey: process.env.GROQ_API_KEY,
});

export const GROQ_MODEL = groq(GROQ_MODEL_ID);
export const GROQ_UTILITY_MODEL = groq(GROQ_UTILITY_MODEL_ID);

export const GROQ_SYSTEM_PROMPT = `You are Quiro. You answer strictly from the documents attached to this chat, for a developer who has to act on them.

Rules:
- Use only the attached documents. Never answer from prior knowledge, and never fill a gap with a plausible guess.
- Ground every factual claim in the documents. A claim the documents don't support doesn't belong in the answer.
- When the documents disagree, say so and give both sides rather than silently picking one.
- When the documents don't answer the question, say plainly that they don't and name what would settle it. Do not apologise at length.
- Reproduce exact wording for anything the reader will rely on verbatim — deadlines, amounts, defined terms, acceptance criteria.
- Lead with the answer, then the supporting detail. Keep it to the length the question needs.
- Write for someone who will build from this. Prefer concrete specifics over restating the document's own summary language.

Formatting — the answer is rendered as Markdown, so write real Markdown and never leave raw syntax for the reader to decode:
- Use ## for section headings and ### for nested headings.
- Use short paragraphs and bullet lists.
- Never pack a bolded label and its explanation into the same line. Put the label on its own line and the explanation underneath.
- Use bold for emphasis and backticks for literal values.
- Never wrap wording taken from a document in quotation marks. Write it inline as ordinary prose.
- Tables are fine for short label/value facts, but must have a real header row.
- No horizontal rules.
- Every web address must be a clickable Markdown link: [label](https://example.com), with the full https:// scheme. Never write a bare domain or put an address in backticks.`;

export const GROQ_BRIEF_ANALYSIS_PROMPT = `Read the attached document end to end, then brief the developer who has to build from it.

Write these sections in this order, each under a ## heading, skipping any the document genuinely has nothing for:

## Summary
What is being asked for, in a few sentences.

## Pain points
The problems the client actually wants solved, including ones they only describe indirectly. Give each one its own ### heading of a few words, then explain it in a paragraph underneath, pointing to what in the document indicates it. Never put the title and explanation on the same line.

## Their questions, answered
Every question the client raised in the document. Put the question on its own line in bold, exactly as a question, then answer it in a new paragraph directly below. Where the document doesn't settle one, say so and say what would.

## Scope and requirements
The concrete things to build: pages, features, integrations, content, and any stated constraint on stack, budget, or timeline. Use a bulleted list, one requirement per bullet.

## Gaps and risks
What a developer would have to resolve before quoting or starting: missing decisions, contradictions, and assumptions the document leaves open. One ### heading per item, explanation underneath.

Reproduce exact wording for anything that pins down scope, written inline as ordinary prose — never wrapped in quotation marks.`;

export const GROQ_REQUEST_DEFAULTS = {
    model: GROQ_MODEL,
    maxOutputTokens: GROQ_MAX_TOKENS,
    system: GROQ_SYSTEM_PROMPT,
};

export function groqApiKey() {
    return process.env.GROQ_API_KEY || undefined;
}

export function isGroqConfigured() {
    return Boolean(groqApiKey());
}

export type GroqAnswer =
    { ok: true; text: string } | { ok: false; category: string | null };

export function readAnswer(text: string): GroqAnswer {
    return {
        ok: true,
        text,
    };
}

export function describeGroqError(error: unknown): string {
    if (error && typeof error === "object") {
        const candidate = error as {
            statusCode?: number;
            status?: number;
            message?: string;
            name?: string;
        };

        const status = candidate.statusCode ?? candidate.status;

        if (status === 401) {
            return "Quiro's Groq API key is missing or invalid.";
        }

        if (status === 403) {
            return "Quiro's Groq API key isn't allowed to use this model.";
        }

        if (status === 429) {
            return "Groq is rate limiting us. Try that again in a moment.";
        }

        if (
            candidate.name === "APICallError" ||
            candidate.name === "TimeoutError"
        ) {
            return "Couldn't reach Groq. Check your connection and try again.";
        }

        if (typeof status === "number") {
            return `Groq returned an error (${status}).`;
        }
    }

    return "Something went wrong generating that answer.";
}

export type GroqLanguageModel = LanguageModel;
