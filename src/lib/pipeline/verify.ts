import type { Block } from "../types";

function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/[‘’‛`]/g, "'")
    .replace(/[“”‟]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/[^a-z0-9%$'".,\- ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// A quote is verified only if it (or each "…"-separated piece of it) appears
// verbatim in the cited block. This is the guard against fabricated evidence.
export function quoteInBlock(quote: string, block: Block | undefined): boolean {
  if (!block) return false;
  const hay = normalize(block.text);
  const pieces = quote
    .split(/\.\.\.|…/)
    .map((p) => normalize(p).replace(/^[\s"'.,-]+|[\s"'.,-]+$/g, ""))
    .filter((p) => p.length > 0);
  if (!pieces.length) return false;
  return pieces.every((p) => hay.includes(p));
}

export function blockIndex(blocks: Block[]) {
  return new Map(blocks.map((b) => [b.id, b]));
}
