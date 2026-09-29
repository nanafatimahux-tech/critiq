"use client";

import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import { ExternalLink, FileText, ImageIcon, Quote, X } from "../icons";
import { cx } from "../ui";
import type { Block, EvidenceRef, Page, Review } from "@/lib/types";

interface EvidenceCtx {
  review: Review;
  blocks: Map<string, Block>;
  pages: Map<string, Page>;
  open: (ref: EvidenceRef) => void;
}
const Ctx = createContext<EvidenceCtx | null>(null);
export const useEvidence = () => useContext(Ctx)!;

export function EvidenceProvider({ review, open, children }: { review: Review; open: (r: EvidenceRef) => void; children: ReactNode }) {
  const value = useMemo(() => ({
    review,
    open,
    blocks: new Map(review.pages.flatMap((p) => p.blocks).map((b) => [b.id, b])),
    pages: new Map(review.pages.map((p) => [p.id, p])),
  }), [review, open]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function EvidenceChip({ ev }: { ev: EvidenceRef }) {
  const { blocks, pages, open } = useEvidence();
  const block = blocks.get(ev.blockId);
  if (!block) return null;
  const page = pages.get(block.pageId);
  const isVisual = block.kind === "image" || block.kind === "page";
  const where = page?.pageNumber ? `p. ${page.pageNumber}` : page?.title;
  return (
    <button
      type="button"
      onClick={() => open(ev)}
      className="group flex w-full items-start gap-2 rounded-xl border border-line bg-surface-2 px-3 py-2 text-left text-sm transition-colors hover:border-line-strong hover:bg-surface"
    >
      {isVisual ? <ImageIcon className="mt-0.5 size-3.5 shrink-0 text-accent" /> : <Quote className="mt-0.5 size-3.5 shrink-0 text-accent" />}
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 text-ink">
          {isVisual ? (block.kind === "page" ? "Whole page (visual review)" : `Image — ${block.text || "no alt text"}`) : `“${ev.quote || block.text}”`}
        </span>
        <span className="mt-0.5 block truncate font-display font-extrabold text-xs text-muted group-hover:text-ink">{where} · {ev.blockId}</span>
      </span>
    </button>
  );
}

export function EvidenceList({ evidence, max = 4 }: { evidence: EvidenceRef[]; max?: number }) {
  if (!evidence.length) return null;
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-1.5">
      {evidence.slice(0, max).map((ev, i) => <EvidenceChip key={ev.blockId + i} ev={ev} />)}
      {evidence.length > max && <p className="text-xs text-muted">+{evidence.length - max} more references</p>}
    </div>
  );
}

function highlight(text: string, quote: string) {
  if (!quote) return <mark className="evidence">{text}</mark>;
  const idx = text.toLowerCase().indexOf(quote.toLowerCase().replace(/[“”"]/g, "").trim());
  if (idx < 0) return <mark className="evidence">{text}</mark>;
  const end = idx + quote.replace(/[“”"]/g, "").trim().length;
  return <>{text.slice(0, idx)}<mark className="evidence">{text.slice(idx, end)}</mark>{text.slice(end)}</>;
}

export function EvidenceDrawer({ active, onClose }: { active: EvidenceRef | null; onClose: () => void }) {
  const { blocks, pages, review } = useEvidence();
  const targetRef = useRef<HTMLDivElement>(null);
  const block = active ? blocks.get(active.blockId) : undefined;
  const page = block ? pages.get(block.pageId) : undefined;
  const cs = review.caseStudies.find((c) => c.id === page?.caseStudyId);

  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => targetRef.current?.scrollIntoView({ block: "center", behavior: "smooth" }), 60);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => { clearTimeout(t); window.removeEventListener("keydown", onKey); };
  }, [active, onClose]);

  if (!active || !block || !page) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Evidence">
      <button aria-label="Close evidence" className="absolute inset-0 bg-black/20" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-[520px] flex-col border-l border-line bg-surface shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <p className="font-display font-extrabold text-xs tracking-wider text-muted uppercase">Evidence · <span className="normal-case">{block.id}</span></p>
            <h2 className="mt-1 truncate font-display font-black text-xl">{page.title}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
              {cs && cs.title !== page.title && <span>{cs.title}</span>}
              {page.pageNumber && <span className="inline-flex items-center gap-1"><FileText className="size-3" />Page {page.pageNumber}</span>}
              {page.url && <a href={page.url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 hover:text-accent">Open page <ExternalLink className="size-3" /></a>}
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="-m-1.5 rounded-md p-2.5 text-muted hover:bg-surface-2 hover:text-ink"><X className="size-5" /></button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <p className="mb-4 rounded-lg bg-surface-2 px-3 py-2 text-xs text-muted">
            This is the text we extracted from your portfolio. The highlighted passage is what the finding is based on.
          </p>
          <div className="space-y-3 text-[15px] leading-relaxed">
            {page.blocks.map((b) => {
              const isTarget = b.id === block.id;
              return (
                <div key={b.id} ref={isTarget ? targetRef : undefined}
                  className={cx("relative rounded-md", isTarget && "ring-2 ring-accent/40 ring-offset-4 ring-offset-surface")}>
                  {b.kind === "heading" && <h3 className="pt-2 font-semibold">{isTarget ? highlight(b.text, active.quote) : b.text}</h3>}
                  {(b.kind === "text" || b.kind === "list") && (
                    <p className={cx(b.kind === "list" && "pl-4 before:absolute before:left-0 before:content-['•']", "text-ink/90")}>{isTarget ? highlight(b.text, active.quote) : b.text}</p>
                  )}
                  {b.kind === "image" && (
                    <figure className={cx("overflow-hidden rounded-lg border", isTarget ? "border-accent bg-highlight" : "border-line bg-surface-2")}>
                      {b.src ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={b.src} alt={b.text} className="max-h-72 w-full object-contain" loading="lazy" />
                      ) : (
                        <div className="grid h-24 place-items-center text-subtle"><ImageIcon className="size-6" /></div>
                      )}
                      <figcaption className="px-3 py-1.5 text-xs text-muted">{b.text || "Image without alt text"}</figcaption>
                    </figure>
                  )}
                  {b.kind === "page" && (
                    <div className={cx("rounded-lg border px-3 py-2 text-xs", isTarget ? "border-accent bg-highlight" : "border-line bg-surface-2 text-muted")}>
                      {b.text} — reviewed visually from the uploaded file
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </aside>
    </div>
  );
}
