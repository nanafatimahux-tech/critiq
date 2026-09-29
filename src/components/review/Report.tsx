"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import {
  AlertTriangle, ArrowRight, CheckCircle2, ChevronDown, CircleDashed, FileText, Globe, Info, RotateCw, XCircle,
} from "../icons";
import { BAND_BAR, BandPill, Button, Card, Chip, ConfidenceTag, Eyebrow, LINK, SectionTitle, TopBar, cx } from "../ui";
import { Achievements, LevelBadge, QuestComplete, QuestProgress, useQuest, xpFor } from "./Game";
import { EvidenceDrawer, EvidenceList, EvidenceProvider } from "./Evidence";
import { FindingCard } from "./FindingCard";
import { InputSummary } from "./Progress";
import { BAND_META, DIMENSIONS, DIMENSION_BY_KEY, SENIORITY, evidenceStats } from "@/lib/rubric";
import type { DimensionScore, EvidenceRef, Review } from "@/lib/types";

const NAV = [
  ["summary", "Summary"],
  ["evidence", "Evidence reviewed"],
  ["scorecard", "Scorecard"],
  ["fixes", "Fix quest"],
  ["strengths", "Strengths"],
  ["achievements", "Achievements"],
  ["case-studies", "Case studies"],
  ["role-fit", "Role fit"],
  ["method", "How this review works"],
] as const;

function BandMeter({ band }: { band: DimensionScore["band"] }) {
  const rank = BAND_META[band].rank;
  return (
    <span className="flex gap-0.5" aria-hidden>
      {[1, 2, 3, 4].map((i) => (
        <span key={i} className={cx("h-2 w-5 rounded-sm sm:w-7", band === "not_assessable" ? "bg-[repeating-linear-gradient(135deg,var(--border-strong)_0_2px,transparent_2px_5px)] ring-1 ring-line ring-inset" : i <= rank ? BAND_BAR[band] : "bg-surface-2 ring-1 ring-line ring-inset")} />
      ))}
    </span>
  );
}

function ScoreRow({ score }: { score: DimensionScore }) {
  const [open, setOpen] = useState(false);
  const def = DIMENSION_BY_KEY[score.dimension];
  return (
    <li className="border-t border-line first:border-t-0">
      <button onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-surface-2 sm:px-5">
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">{def.label}</span>
          <span className="mt-0.5 text-xs text-muted line-clamp-2 sm:line-clamp-1">{score.rationale}</span>
        </span>
        <span className="hidden sm:block"><BandMeter band={score.band} /></span>
        <span className="shrink-0 text-right sm:w-[108px]"><BandPill band={score.band} /></span>
        <ChevronDown className={cx("size-4 shrink-0 text-subtle transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 bg-surface-2 px-4 py-4 sm:px-5 lg:grid-cols-2">
          <div className="space-y-3 text-sm">
            <p className="leading-relaxed">{score.rationale}</p>
            {score.strength && <p className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-strong" /><span><span className="font-medium">Strength: </span>{score.strength}</span></p>}
            {score.concern && <p className="flex gap-2"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-dev" /><span><span className="font-medium">Concern: </span>{score.concern}</span></p>}
            {score.band !== "not_assessable" && (
              <p className="text-xs text-muted"><span className="font-medium text-ink">{BAND_META[score.band].label} means: </span>{def.rubric[score.band]}</p>
            )}
            <ConfidenceTag confidence={score.confidence} />
          </div>
          <div>
            <Eyebrow className="mb-2">Evidence</Eyebrow>
            {score.evidence.length ? <EvidenceList evidence={score.evidence} max={3} /> : <p className="text-sm text-muted">No specific passage to point to. See the rationale.</p>}
          </div>
        </div>
      )}
    </li>
  );
}

export function Report({ review }: { review: Review }) {
  const router = useRouter();
  const [active, setActive] = useState<EvidenceRef | null>(null);
  const [rerunning, setRerunning] = useState(false);
  const open = useCallback((r: EvidenceRef) => setActive(r), []);
  const close = useCallback(() => setActive(null), []);
  const result = review.result!;
  const stats = evidenceStats(review);
  const gaps = result.findings.filter((f) => f.kind === "gap");
  const strengths = result.findings.filter((f) => f.kind === "strength");
  const nav = NAV.filter(([id]) => id !== "role-fit" || result.roleAlignment);
  const quest = useQuest(review);

  async function rerun() {
    setRerunning(true);
    const res = await fetch(`/api/reviews/${review.id}/rerun`, { method: "POST" });
    const data = await res.json();
    if (res.ok) router.push(`/reviews/${data.id}`);
    else setRerunning(false);
  }

  return (
    <EvidenceProvider review={review} open={open}>
      <TopBar>
        {review.sample ? (
          <Link href="/" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-accent px-4 text-sm font-medium text-on-accent hover:bg-accent-hover">Review my portfolio <ArrowRight className="size-4" /></Link>
        ) : (
          <Button variant="secondary" onClick={rerun} disabled={rerunning}><RotateCw className={cx("size-4", rerunning && "animate-spin")} />{rerunning ? "Starting…" : "Review again"}</Button>
        )}
      </TopBar>

      {review.sample && (
        <div className="border-b border-line bg-xp-soft">
          <p className="mx-auto max-w-[1200px] px-4 py-2 text-sm text-xp-ink sm:px-6">
            <Info className="mr-1.5 inline size-4 align-[-3px]" />This is a sample review of a fictional portfolio. Select any evidence to see the page it came from.
          </p>
        </div>
      )}

      <div className="mx-auto grid max-w-[1200px] gap-8 px-4 py-6 sm:px-6 sm:py-8 lg:grid-cols-[200px_1fr]">
        <nav aria-label="Report sections" className="hidden lg:block">
          <ul className="sticky top-20 space-y-0.5 text-sm">
            {nav.map(([id, label]) => (
              <li key={id}><a href={`#${id}`} className="block rounded-md px-2.5 py-1.5 text-muted hover:bg-surface hover:text-ink">{label}</a></li>
            ))}
          </ul>
        </nav>

        <main className="min-w-0 space-y-10">
          {/* Below lg the sidebar is hidden; a sticky scrollable jump bar keeps sections one tap away. */}
          <nav aria-label="Report sections" className="sticky top-14 z-20 -mx-4 -mt-6 border-b border-line bg-canvas/95 backdrop-blur sm:-mx-6 sm:-mt-8 lg:hidden">
            <ul className="flex gap-1 overflow-x-auto px-4 py-2 text-sm [scrollbar-width:none] sm:px-6">
              {nav.map(([id, label]) => (
                <li key={id} className="shrink-0"><a href={`#${id}`} className="block rounded-md px-2.5 py-1.5 whitespace-nowrap text-muted hover:bg-surface hover:text-ink">{label}</a></li>
              ))}
            </ul>
          </nav>
          {/* Header + summary */}
          <div id="summary" className="scroll-mt-28 lg:scroll-mt-20">
            <Eyebrow>Portfolio review</Eyebrow>
            <h1 className="mt-2 font-serif text-3xl leading-tight tracking-tight sm:text-4xl">{review.input.targetRole}</h1>
            <div className="mt-2"><InputSummary review={review} /></div>
            <p className="mt-1 text-xs text-subtle">Reviewer perspective: Senior Product Design Hiring Manager · {new Date(review.createdAt).toLocaleDateString("en-US", { dateStyle: "medium" })}</p>

            {result.limitations.length > 0 && (
              <div className="mt-5 flex gap-3 rounded-xl border border-dev/30 bg-dev-soft px-4 py-3">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-dev" />
                <div className="text-sm">
                  <p className="font-semibold text-dev">Review completed with limitations</p>
                  <ul className="mt-1 space-y-0.5 text-ink/80">{result.limitations.map((l) => <li key={l}>{l}</li>)}</ul>
                  {gaps.some((g) => g.affectedByLimitation) && <p className="mt-1 text-xs text-muted">Findings based on partially-read content are labelled.</p>}
                </div>
              </div>
            )}

            <Card className="mt-5 p-5 sm:p-6">
              <div className="grid gap-6 md:grid-cols-[1fr_260px]">
                <div>
                  <p className="text-lg leading-snug font-semibold text-pretty sm:text-xl">{result.verdict}</p>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted text-pretty">{result.summary}</p>
                </div>
                <div className="space-y-4 border-t border-line pt-5 md:border-t-0 md:border-l md:pt-0 md:pl-6">
                  <LevelBadge review={review} />
                  <p className="text-xs text-muted">Judged at {SENIORITY[review.input.seniority].label} level.</p>
                  <ConfidenceTag confidence={result.confidence} />
                  {result.confidenceNote && <p className="text-xs text-muted">{result.confidenceNote}</p>}
                </div>
              </div>
              <div className="mt-5 flex gap-2.5 rounded-xl bg-surface-2 px-4 py-3">
                <ArrowRight className="mt-0.5 size-4 shrink-0" />
                <p className="text-sm"><span className="font-semibold">Start here: </span>{result.priorityNote}</p>
              </div>
              <div className="mt-5 grid gap-5 border-t border-line pt-5 md:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold">Highest-impact fixes</p>
                  <ol className="mt-2 space-y-1.5">
                    {gaps.map((g, i) => (
                      <li key={g.id}><a href={`#${g.id}`} className={cx("flex gap-2 text-sm hover:underline", quest.done.has(g.id) && "text-muted line-through")}><span className="w-4 shrink-0 font-mono text-xs leading-5 text-subtle tabular-nums">{String(i + 1).padStart(2, "0")}</span><span className="flex-1 text-pretty">{g.title}</span><span className="shrink-0 font-mono text-xs leading-5 text-muted tabular-nums">+{xpFor(g)}</span></a></li>
                    ))}
                    {!gaps.length && <li className="text-sm text-muted">No significant gaps found.</li>}
                  </ol>
                </div>
                <div>
                  <p className="text-sm font-semibold">Top strengths</p>
                  <ul className="mt-2 space-y-1.5">
                    {strengths.map((s) => (
                      <li key={s.id}><a href={`#${s.id}`} className="flex gap-2 text-sm hover:underline"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-strong" /><span className="text-pretty">{s.title}</span></a></li>
                    ))}
                    {!strengths.length && <li className="text-sm text-muted">No clear strengths could be evidenced yet.</li>}
                  </ul>
                </div>
              </div>
            </Card>
          </div>

          {/* Evidence reviewed */}
          <div id="evidence" className="scroll-mt-28 lg:scroll-mt-20">
            <SectionTitle title="Evidence reviewed" subtitle="Everything the reviewer read. Findings only cite this content." />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[["Pages reviewed", stats.pages], ["Case studies", stats.caseStudies], ["Images", stats.images], ["Words", stats.words.toLocaleString("en-US")]].map(([k, v]) => (
                <Card key={k as string} className="px-4 py-3">
                  <p className="font-mono text-xs text-muted uppercase">{k}</p>
                  <p className="mt-1 font-serif text-3xl tabular-nums">{v}</p>
                </Card>
              ))}
            </div>
            <Card className="mt-3 divide-y divide-line">
              {review.sources.map((s) => (
                <div key={s.id} className="px-4 py-3 sm:px-5">
                  <div className="flex items-center gap-2 text-sm">
                    {s.kind === "url" ? <Globe className="size-4 text-muted" /> : <FileText className="size-4 text-muted" />}
                    <span className="min-w-0 flex-1 truncate font-medium">{s.label}</span>
                    {s.status === "ok" ? <Chip className="border-strong/20 bg-strong-soft text-strong">Read fully</Chip> : s.status === "partial" ? <Chip className="border-dev/20 bg-dev-soft text-dev">Partially read</Chip> : <Chip className="border-crit/20 bg-crit-soft text-crit">Not read</Chip>}
                  </div>
                  {s.error && <p className="mt-1 pl-6 text-xs text-muted">{s.error}</p>}
                  <ul className="mt-2 flex flex-wrap gap-1.5 pl-6">
                    {review.pages.filter((p) => p.sourceId === s.id).map((p) => (
                      <li key={p.id} title={p.reason}>
                        <Chip className={cx(p.status !== "reviewed" && "border-dashed line-through decoration-subtle")}>
                          {p.status === "reviewed" ? <CheckCircle2 className="size-3 text-strong" /> : p.status === "skipped" ? <CircleDashed className="size-3" /> : <XCircle className="size-3 text-crit" />}
                          <span className="max-w-[200px] truncate">{p.pageNumber ? `p. ${p.pageNumber}` : p.title}</span>
                        </Chip>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </Card>
          </div>

          {/* Scorecard */}
          <div id="scorecard" className="scroll-mt-28 lg:scroll-mt-20">
            <SectionTitle title="Scorecard" subtitle="Scores reflect how well the portfolio presents your work — not your ability as a designer."
              right={<a href="#method" className={cx("text-sm", LINK)}>How scores work</a>} />
            <Card><ul>{result.dimensions.map((d) => <ScoreRow key={d.dimension} score={d} />)}</ul></Card>
          </div>

          {/* Priority fixes */}
          <div id="fixes" className="scroll-mt-28 lg:scroll-mt-20">
            <SectionTitle eyebrow="Priority fixes" title="Your fix quest" subtitle="In the order we'd tackle them. Each fix is tied to evidence in your portfolio — bigger fixes earn more XP." />
            <div className="space-y-4">
              {gaps.length > 0 && (
                <div className="z-10 sm:sticky sm:top-[106px] lg:top-[72px]">
                  {quest.complete ? (
                    <QuestComplete review={review} quest={quest} onRerun={rerun} rerunning={rerunning} />
                  ) : (
                    <Card className="p-4 sm:px-5"><QuestProgress quest={quest} /></Card>
                  )}
                </div>
              )}
              {gaps.map((f, i) => <FindingCard key={f.id} finding={f} index={i + 1} quest={quest} />)}
              {!gaps.length && <Card className="p-5 text-sm text-muted">No significant gaps were found at this level. The reviewer didn&apos;t manufacture weaknesses to fill this section.</Card>}
            </div>
          </div>

          <div id="strengths" className="scroll-mt-28 lg:scroll-mt-20">
            <SectionTitle title="Strengths" subtitle="What's working — keep it through your edits." />
            <div className="space-y-4">{strengths.map((f) => <FindingCard key={f.id} finding={f} />)}</div>
          </div>

          <div id="achievements" className="scroll-mt-28 lg:scroll-mt-20">
            <SectionTitle title="Achievements" subtitle="Unlocked by what your portfolio already shows. Locked ones tell you what earns them." />
            <Achievements review={review} />
          </div>

          {/* Case studies */}
          <div id="case-studies" className="scroll-mt-28 lg:scroll-mt-20">
            <SectionTitle title="Case studies" subtitle={`${review.caseStudies.length} identified`} />
            <div className="grid gap-4 md:grid-cols-2">
              {review.caseStudies.map((cs) => {
                const r = result.caseStudyReviews.find((x) => x.caseStudyId === cs.id);
                const count = gaps.filter((g) => g.caseStudyId === cs.id).length;
                return (
                  <Card key={cs.id} className="flex flex-col p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold">{cs.title}</h3>
                      {!cs.primary && <Chip>Secondary</Chip>}
                    </div>
                    <p className="mt-1 text-sm text-muted">{cs.summary}</p>
                    {r && (
                      <div className="mt-4 space-y-2.5 text-sm">
                        <p className="font-medium text-pretty">{r.verdict}</p>
                        <p className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-strong" /><span>{r.whatWorks}</span></p>
                        <p className="flex gap-2"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-dev" /><span>{r.whatToFix}</span></p>
                      </div>
                    )}
                    <p className="mt-auto pt-4 text-xs text-muted">{count ? `${count} priority fix${count > 1 ? "es" : ""}` : "No priority fixes"} · {cs.pageIds.length} page{cs.pageIds.length > 1 ? "s" : ""}</p>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Role fit */}
          {result.roleAlignment && (
            <div id="role-fit" className="scroll-mt-28 lg:scroll-mt-20">
              <SectionTitle title="Role fit" subtitle="How well the portfolio evidences what the job description asks for." />
              <Card className="divide-y divide-line">
                {result.roleAlignment.map((a) => (
                  <div key={a.requirement} className="grid grid-cols-[minmax(0,1fr)] gap-3 px-4 py-4 sm:px-5 md:grid-cols-2">
                    <div>
                      <div className="flex items-start gap-2">
                        {a.status === "evidenced" ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-strong" /> : a.status === "partial" ? <CircleDashed className="mt-0.5 size-4 shrink-0 text-dev" /> : <XCircle className="mt-0.5 size-4 shrink-0 text-crit" />}
                        <div>
                          <p className="text-sm font-medium">{a.requirement}</p>
                          <p className="mt-0.5 text-sm text-muted">{a.note}</p>
                        </div>
                      </div>
                    </div>
                    {a.evidence.length ? <EvidenceList evidence={a.evidence} max={2} /> : <p className="text-sm text-muted md:pt-0.5">No supporting evidence found in the portfolio.</p>}
                  </div>
                ))}
              </Card>
            </div>
          )}

          {/* Method */}
          <div id="method" className="scroll-mt-28 lg:scroll-mt-20">
            <SectionTitle title="How this review works" />
            <Card className="p-5 sm:p-6">
              <ol className="grid gap-4 text-sm sm:grid-cols-2">
                <li><span className="font-semibold">1. Read.</span> <span className="text-muted">We extract the text and images of every page we can access, and log anything we couldn&apos;t read.</span></li>
                <li><span className="font-semibold">2. Observe.</span> <span className="text-muted">Neutral observations are recorded with a verbatim quote — or explicitly marked as missing.</span></li>
                <li><span className="font-semibold">3. Verify.</span> <span className="text-muted">Every quote is checked against your portfolio in code. Anything that can&apos;t be matched is discarded.</span></li>
                <li><span className="font-semibold">4. Evaluate &amp; prioritize.</span> <span className="text-muted">A fixed rubric is applied at your target level; fixes are ranked by severity × hiring weight × confidence.</span></li>
              </ol>
              <p className="mt-5 text-sm"><span className="font-semibold">Expectations at {SENIORITY[review.input.seniority].label} level: </span><span className="text-muted">{SENIORITY[review.input.seniority].expectation}</span></p>
              <details className="group mt-5 rounded-lg border border-line">
                <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium">
                  View the full rubric <ChevronDown className="size-4 text-subtle transition-transform group-open:rotate-180" />
                </summary>
                <div className="overflow-x-auto border-t border-line">
                  <table className="w-full min-w-[720px] text-left text-xs">
                    <thead className="bg-surface-2 text-muted">
                      <tr><th className="px-3 py-2 font-medium">Dimension</th>{(["major_gap", "developing", "strong", "excellent"] as const).map((b) => <th key={b} className="px-3 py-2 font-medium">{BAND_META[b].label}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {DIMENSIONS.map((d) => (
                        <tr key={d.key} className="align-top">
                          <td className="px-3 py-2.5 font-medium">{d.label}</td>
                          {(["major_gap", "developing", "strong", "excellent"] as const).map((b) => <td key={b} className="px-3 py-2.5 text-muted">{d.rubric[b]}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </Card>
          </div>
        </main>
      </div>
      <EvidenceDrawer active={active} onClose={close} />
    </EvidenceProvider>
  );
}
