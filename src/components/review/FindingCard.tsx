"use client";

import { useState } from "react";
import { AlertTriangle, Check, CircleSlash, Lightbulb, SearchX, ThumbsUp, Meh, Flag } from "../icons";
import { Button, Chip, ConfidenceTag, Eyebrow, SeverityBadge, cx } from "../ui";
import { FixToggle, type Quest } from "./Game";
import { EvidenceList, useEvidence } from "./Evidence";
import { DIMENSION_BY_KEY } from "@/lib/rubric";
import type { FeedbackKind, Finding } from "@/lib/types";

function Feedback({ finding, reviewId }: { finding: Finding; reviewId: string }) {
  const [state, setState] = useState<FeedbackKind | null>(finding.feedback?.kind ?? null);
  const [asking, setAsking] = useState(false);
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(!!finding.feedback);

  async function send(kind: FeedbackKind, text?: string) {
    setState(kind);
    await fetch(`/api/reviews/${reviewId}/feedback`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ findingId: finding.id, kind, note: text }),
    });
    setSent(true);
    setAsking(false);
  }

  if (sent && state) {
    return (
      <p className="flex items-center gap-1.5 text-xs text-muted">
        <Check className="size-3.5 text-strong" />
        {state === "useful" ? "Thanks — marked as useful." : state === "generic" ? "Thanks — marked as too generic. This helps tune future reviews." : "Thanks — reported as incorrect."}
      </p>
    );
  }
  if (asking) {
    return (
      <div className="w-full">
        <label htmlFor={`fb-${finding.id}`} className="text-sm font-medium">What&apos;s incorrect about this finding?</label>
        <textarea id={`fb-${finding.id}`} value={note} onChange={(e) => setNote(e.target.value)} rows={3}
          placeholder="e.g. The metric is on the next page — “Conversion rose 12% after launch”."
          className="mt-1.5 w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-base outline-none md:text-sm placeholder:text-subtle focus:border-ink" />
        <div className="mt-2 flex gap-2">
          <Button onClick={() => send("incorrect", note)} disabled={!note.trim()} className="h-10 sm:h-8">Send feedback</Button>
          <Button variant="ghost" onClick={() => setAsking(false)} className="h-10 sm:h-8">Cancel</Button>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-1">
      <span className="mr-1 text-xs text-muted">Was this accurate and useful?</span>
      <Button variant="ghost" className="h-9 px-2 text-xs sm:h-7" onClick={() => send("useful")}><ThumbsUp className="size-3.5" />Useful</Button>
      <Button variant="ghost" className="h-9 px-2 text-xs sm:h-7" onClick={() => send("generic")}><Meh className="size-3.5" />Too generic</Button>
      <Button variant="ghost" className="h-9 px-2 text-xs sm:h-7" onClick={() => setAsking(true)}><Flag className="size-3.5" />I disagree</Button>
    </div>
  );
}

export function FindingCard({ finding, index, quest }: { finding: Finding; index?: number; quest?: Quest }) {
  const { review } = useEvidence();
  const cs = review.caseStudies.find((c) => c.id === finding.caseStudyId);
  const isGap = finding.kind === "gap";
  const fixed = !!quest?.done.has(finding.id);
  return (
    <article id={finding.id} className={cx("scroll-mt-28 rounded-2xl border bg-surface shadow-card transition-colors sm:scroll-mt-52 lg:scroll-mt-40", fixed ? "border-xp" : "border-line")}>
      <header className="flex gap-3 px-4 pt-4 sm:px-5 sm:pt-5">
        {index !== undefined ? (
          <span className={cx("grid size-8 shrink-0 place-items-center rounded-full font-mono text-xs font-medium tabular-nums", fixed ? "bg-xp text-[#1a1a19]" : "border border-line-strong")}>{String(index).padStart(2, "0")}</span>
        ) : (
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-strong-soft text-strong"><Check className="size-4" strokeWidth={2.5} /></span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <h3 className="font-semibold leading-snug text-pretty">{finding.title}</h3>
            {isGap && quest && <FixToggle finding={finding} quest={quest} />}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {isGap && <SeverityBadge severity={finding.severity} />}
            <Chip>{DIMENSION_BY_KEY[finding.dimension].label}</Chip>
            <Chip>{cs ? cs.title : "Whole portfolio"}</Chip>
            <ConfidenceTag confidence={finding.confidence} />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 px-4 py-4 sm:px-5 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <Eyebrow>What we observed</Eyebrow>
            <p className="mt-1 text-[15px] leading-relaxed text-pretty">{finding.observation}</p>
          </div>
          {isGap && (
            <div>
              <Eyebrow>Why a reviewer cares</Eyebrow>
              <p className="mt-1 text-sm leading-relaxed text-muted text-pretty">{finding.whyReviewerCares}</p>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Eyebrow>Evidence</Eyebrow>
          <EvidenceList evidence={finding.evidence} />
          {finding.missingEvidence && (
            <div className="flex gap-2 rounded-lg border border-dashed border-line-strong px-3 py-2 text-sm">
              <SearchX className="mt-0.5 size-3.5 shrink-0 text-muted" />
              <span><span className="font-medium">Not found: </span><span className="text-muted">{finding.missingEvidence}</span></span>
            </div>
          )}
          {!finding.evidence.length && !finding.missingEvidence && (
            <p className="flex items-center gap-1.5 text-sm text-muted"><CircleSlash className="size-3.5" /> No direct reference</p>
          )}
        </div>
      </div>

      <div className={cx("mx-4 mb-4 flex gap-2.5 rounded-xl px-3.5 py-3 sm:mx-5", isGap ? "bg-surface-2" : "bg-strong-soft")}>
        <Lightbulb className={cx("mt-0.5 size-4 shrink-0", isGap ? "text-ink" : "text-strong")} />
        <div>
          <p className={cx("font-mono text-xs font-medium tracking-wider uppercase", isGap ? "text-ink" : "text-strong")}>{isGap ? "How to fix it" : "Keep doing"}</p>
          <p className="mt-0.5 text-sm leading-relaxed text-pretty">{finding.recommendation}</p>
        </div>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-2.5 sm:px-5">
        <Feedback finding={finding} reviewId={review.id} />
        {finding.affectedByLimitation && (
          <span className="inline-flex items-center gap-1 text-xs text-dev"><AlertTriangle className="size-3.5" />Based on partially-read content</span>
        )}
      </footer>
    </article>
  );
}
