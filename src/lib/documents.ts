import "server-only";

import mammoth from "mammoth";
import { CanvasFactory } from "pdf-parse/worker";
import { PDFParse } from "pdf-parse";
import { formatBytes } from "@/lib/chat";
import { generateText } from "ai";
import { groq } from "@ai-sdk/groq";

export const MAX_DOCUMENT_BYTES = 15 * 1024 * 1024;

const PDF_TYPE = "application/pdf";

const DOCX_TYPE =
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export type DocumentKind = "pdf" | "docx" | "text";

export type DocumentType = {
    kind: DocumentKind;
    format: string;
};

const BY_CONTENT_TYPE: Record<string, DocumentType> = {
    [PDF_TYPE]: { kind: "pdf", format: "PDF" },
    [DOCX_TYPE]: { kind: "docx", format: "DOCX" },
    "text/plain": { kind: "text", format: "TXT" },
    "text/markdown": { kind: "text", format: "MD" },
};

const BY_EXTENSION: Record<string, DocumentType> = {
    pdf: { kind: "pdf", format: "PDF" },
    docx: { kind: "docx", format: "DOCX" },
    txt: { kind: "text", format: "TXT" },
    md: { kind: "text", format: "MD" },
};

export function classifyDocument(
    name: string,
    contentType: string,
): DocumentType | null {
    const normalizedType = contentType.split(";")[0].trim().toLowerCase();

    const byType = BY_CONTENT_TYPE[normalizedType];

    if (byType) return byType;

    const extension = name.split(".").pop()?.toLowerCase() ?? "";

    return BY_EXTENSION[extension] ?? null;
}

function countPdfPages(bytes: Buffer): number | null {
    const matches = bytes.toString("latin1").match(/\/Type\s*\/Page[^s]/g);

    return matches?.length || null;
}

export type ExtractedDocument = {
    text: string;
    pageCount: number | null;
};

export async function extractDocument(
    bytes: Buffer,
    kind: DocumentKind,
): Promise<ExtractedDocument> {
    let text = "";
    let pageCount: number | null = null;

    if (kind === "pdf") {
        const parser = new PDFParse({
            data: new Uint8Array(bytes),
            CanvasFactory,
        });

        try {
            const result = await parser.getText();

            text = result.text;
            pageCount = result.total;
        } finally {
            await parser.destroy();
        }

        pageCount ??= countPdfPages(bytes);
    } else if (kind === "docx") {
        const result = await mammoth.extractRawText({
            buffer: bytes,
        });

        text = result.value;
    } else {
        text = bytes.toString("utf8");
    }

    if (!text.trim()) {
        throw new Error(
            "That file has no readable text. If it is a scan, use OCR to extract its text first.",
        );
    }

    return { text, pageCount };
}

export function documentMeta(
    sizeBytes: number,
    pageCount: number | null,
): string {
    const size = formatBytes(sizeBytes);

    return pageCount ? `${size} · ${pageCount} pages` : size;
}

export type DocumentPayload = {
    id: string;
    name: string;
    contentType: string;
    data: Uint8Array;
    text: string;
};

export function toDocumentPrompt(document: DocumentPayload): string {
    return [
        `Document name: ${document.name}`,
        `Document type: ${document.contentType}`,
        "",
        "Use the following uploaded document as the source of truth.",
        "If you refer to a page, only provide a page number when it can be established from the supplied content.",
        "If the document does not contain the answer, say so.",
        "",
        "<document>",
        document.text,
        "</document>",
    ].join("\n");
}

export async function askDocument(
    document: Parameters<typeof toDocumentPrompt>[0],
    question: string,
) {
    const { text } = await generateText({
        model: groq("llama-3.3-70b-versatile"),
        messages: [
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: [
                            toDocumentPrompt(document),
                            "",
                            "Question:",
                            question,
                        ].join("\n"),
                    },
                ],
            },
        ],
    });

    return text;
}
