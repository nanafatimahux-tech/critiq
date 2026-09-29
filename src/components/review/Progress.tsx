import { AlertTriangle, Check, FileText, Globe, Loader2, X } from "../icons";
import { TopBar, Card, ProgressBar, cx } from "../ui";
import { SENIORITY, evidenceStats } from "@/lib/rubric";
import type { Review, Step } from "@/lib/types";

function StepIcon({ status }: { status: Step["status"] }) {
  if (status === "done") return <span className="grid size-5 place-items-center rounded-full bg-strong text-surface"><Check className="size-3" strokeWidth={3} /></span>;
  if (status === "warning") return <span className="grid size-5 place-items-center rounded-full bg-dev text-surface"><AlertTriangle className="size-3" strokeWidth={2.5} /></span>;
  if (status === "failed") return <span className="grid size-5 place-items-center rounded-full bg-crit text-surface"><X className="size-3" strokeWidth={3} /></span>;
  if (status === "active") return <Loader2 className="size-5 animate-spin text-accent" />;
  return <span className="grid size-5 place-items-center"><span className="size-2 rounded-full bg-line-strong" /></span>;
}

export function InputSummary({ review, className = "text-muted" }: { review: Review; className?: string }) {
  const { input } = review;
  return (
    <div className={cx("flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm", className)}>
      {input.url && <span className="inline-flex min-w-0 items-center gap-1.5"><Globe className="size-3.5 shrink-0" /><span className="truncate">{input.url}</span></span>}
      {input.files.map((f) => <span key={f.storedAs} className="inline-flex min-w-0 items-center gap-1.5"><FileText className="size-3.5 shrink-0" /><span className="truncate">{f.name}</span></span>)}
      <span>{input.targetRole} · {SENIORITY[input.seniority].label}</span>
      {input.jobDescription && <span>+ job description</span>}
    </div>
  );
}

export function Progress({ review }: { review: Review }) {
  const done = review.steps.filter((s) => s.status === "done" || s.status === "warning").length;
  const stats = evidenceStats(review);
  return (
    <>
      <TopBar />
      <main className="mx-auto max-w-[640px] px-4 py-10 sm:py-16">
        <Card className="p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display font-black text-2xl tracking-tight sm:text-3xl">Reading your portfolio</h1>
              <p className="mt-1 text-sm text-muted">This usually takes 1–3 minutes. Your review appears here when it&apos;s ready.</p>
            </div>
            <span className="shrink-0 rounded-full border border-line px-2.5 py-1 font-display font-extrabold text-xs text-muted tabular-nums">{done} / {review.steps.length}</span>
          </div>
          <div className="mt-4"><InputSummary review={review} /></div>

          <div className="mt-5"><ProgressBar value={done} max={review.steps.length} tone="accent" label="Review progress" /></div>

          <ol className="mt-6 space-y-4" aria-live="polite">
            {review.steps.map((s) => (
              <li key={s.key} className="flex gap-3">
                <StepIcon status={s.status} />
                <div className="min-w-0">
                  <p className={cx("text-sm", s.status === "pending" ? "text-subtle" : "font-medium text-ink")}>{s.label}</p>
                  {s.detail && <p className={cx("mt-0.5 text-xs", s.status === "warning" ? "text-dev" : "text-muted")}>{s.detail}</p>}
                </div>
              </li>
            ))}
          </ol>

          {stats.pages > 0 && (
            <div className="mt-7 grid grid-cols-2 gap-2 border-t border-line pt-5 sm:grid-cols-4">
              {[["Pages", stats.pages], ["Case studies", stats.caseStudies], ["Images", stats.images], ["Words", stats.words.toLocaleString("en-US")]].map(([k, v]) => (
                <div key={k as string} className="rounded-lg bg-surface-2 px-3 py-2">
                  <p className="font-display font-extrabold text-xs text-muted uppercase">{k}</p>
                  <p className="text-lg font-semibold tabular-nums">{v}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
    </>
  );
}
