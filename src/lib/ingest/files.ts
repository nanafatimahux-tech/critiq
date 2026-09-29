import { extractText, getDocumentProxy } from "unpdf";
import type { Block, Page, Source } from "../types";

export const ACCEPTED_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

export function fileMediaType(name: string) {
  return ACCEPTED_TYPES[name.split(".").pop()?.toLowerCase() ?? ""];
}

function words(s: string) {
  return s.split(/\s+/).filter(Boolean).length;
}

// Turn a page of PDF text into paragraph blocks. PDF text has no semantic
// structure, so short title-case lines are treated as headings.
function textToBlocks(text: string, pageId: string): Block[] {
  const lines = text.split(/\n+/).map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean);
  const blocks: Block[] = [];
  let buf: string[] = [];
  let n = 0;
  const flush = () => {
    if (buf.length) blocks.push({ id: `${pageId}.b${++n}`, pageId, kind: "text", text: buf.join(" ") });
    buf = [];
  };
  for (const line of lines) {
    const isHeading = line.length < 60 && words(line) <= 8 && !/[.,;:]$/.test(line) && /^[A-Z0-9]/.test(line);
    if (isHeading) {
      flush();
      blocks.push({ id: `${pageId}.b${++n}`, pageId, kind: "heading", text: line });
    } else {
      buf.push(line);
      if (/[.!?]$/.test(line) && buf.join(" ").length > 280) flush();
    }
  }
  flush();
  return blocks;
}

export async function ingestFile(
  name: string,
  data: Buffer,
  sourceId: string,
  startIndex: number,
): Promise<{ source: Source; pages: Page[] }> {
  const type = fileMediaType(name);
  let idx = startIndex;

  if (type?.startsWith("image/")) {
    const pageId = `p${++idx}`;
    return {
      source: { id: sourceId, kind: "file", label: name, status: "ok" },
      pages: [
        {
          id: pageId, sourceId, title: name, status: "reviewed", pageNumber: 1,
          blocks: [{ id: `${pageId}.b1`, pageId, kind: "image", text: `Uploaded image: ${name}` }],
          wordCount: 0, imageCount: 1,
        },
      ],
    };
  }

  if (type !== "application/pdf") {
    return {
      source: { id: sourceId, kind: "file", label: name, status: "failed", error: "Unsupported file type — upload a PDF or image" },
      pages: [],
    };
  }

  try {
    const pdf = await getDocumentProxy(new Uint8Array(data));
    const { totalPages, text } = await extractText(pdf, { mergePages: false });
    const pages: Page[] = text.map((pageText, i) => {
      const pageId = `p${++idx}`;
      const blocks = textToBlocks(pageText, pageId);
      const wc = words(pageText);
      // Every PDF page also gets a "page" block so visual observations can cite it.
      blocks.unshift({ id: `${pageId}.b0`, pageId, kind: "page", text: `${name} — page ${i + 1}` });
      return {
        id: pageId, sourceId, title: blocks.find((b) => b.kind === "heading")?.text ?? `Page ${i + 1}`,
        pageNumber: i + 1, status: "reviewed", blocks, wordCount: wc, imageCount: wc < 25 ? 1 : 0,
        reason: wc < 25 ? "Image-only page — reviewed visually" : undefined,
      } satisfies Page;
    });
    const imageOnly = pages.filter((p) => p.wordCount < 25).length;
    return {
      source: {
        id: sourceId, kind: "file", label: `${name} (${totalPages} pages)`, status: "ok",
        error: imageOnly ? `${imageOnly} page${imageOnly > 1 ? "s have" : " has"} no selectable text and ${imageOnly > 1 ? "were" : "was"} reviewed visually only` : undefined,
      },
      pages,
    };
  } catch {
    return {
      source: { id: sourceId, kind: "file", label: name, status: "failed", error: "The PDF could not be opened — it may be encrypted or corrupted" },
      pages: [],
    };
  }
}
