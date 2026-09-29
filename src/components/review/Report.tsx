"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle, ArrowRight, BookOpen, CheckCircle2, ChevronDown, CircleDashed, FileText, FlaskConical, Globe, ImageIcon, Info,
  Quote, RotateCw, Sparkles, Star, Trophy, Users, XCircle, Zap,
} from "../icons";
import { BAND_BAR, BandPill, Button, Card, Chip, ConfidenceTag, IconTile, LINK, SectionTitle, SeverityBadge, TopBar, cx } from "../ui";
import { DIMENSION_LOOK } from "../dimensions";
import { Achievements, LevelCard, QuestCard, QuestComplete, useQuest, xpFor, type Quest } from "./Game";
import { EvidenceDrawer, EvidenceList, EvidenceProvider } from "./Evidence";
import { FindingCard } from "./FindingCard";
import { InputSummary } from "./Progress";
import { BAND_META, DIMENSIONS, DIMENSION_BY_KEY, SENIORITY, evidenceStats } from "@/lib/rubric";
import type { DimensionScore, EvidenceRef, Finding, Review } from "@/lib/types";

const NAV = [
  ["summary", "Summary"],
  ["scorecard", "Scorecard"],
  ["fixes", "Fix quest"],
  ["strengths", "Strengths"],
  ["achievements", "Badges"],
  ["case-studies", "Case studies"],
  ["role-fit", "Role fit"],
  ["evidence", "Evidence"],
  ["method", "Method"],
] as const;

// Scroll offset clears the sticky top bar + tab bar.
const ANCHOR = "scroll-mt-32";

// Scroll-spy: the last section whose top has passed a reading line a third of the
// way down the screen is "current". A tapped tab wins until its scroll settles.
function useCurrentSection(key: string) {
  const [current, setCurrent] = useState(key.split(",")[0]);
  const lockUntil = useRef(0);
  useEffect(() => {
    const ids = key.split(",");
    let frame = 0;
    const update = () => {
      frame = 0;
      if (Date.now() < lockUntil.current) return;
      const line = Math.max(150, window.innerHeight * 0.35);
      let id = ids[0];
      for (const i of ids) {
        const el = document.getElementById(i);
        if (el && el.getBoundingClientRect().top <= line) id = i;
      }
      // Short last sections may never reach the line; at the very bottom, the last one is current.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 24) id = ids[ids.length - 1];
      setCurrent(id);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [key]);
  const select = useCallback((id: string) => {
    lockUntil.current = Date.now() + 900;
    setCurrent(id);
  }, []);
  return [current, select] as const;
}

function BandMeter({ band, small }: { band: DimensionScore["band"]; small?: boolean }) {
  const rank = BAND_META[band].rank;
  return (
    <span className="flex gap-0.5" aria-hidden>
      {[1, 2, 3, 4].map((i) => (
        <span key={i} className={cx("h-2 rounded-sm", small ? "w-2.5" : "w-5 sm:w-7", band === "not_assessable" ? "bg-[repeating-linear-gradient(135deg,var(--border-strong)_0_2px,transparent_2px_5px)] ring-1 ring-line ring-inset" : i <= rank ? BAND_BAR[band] : "bg-surface-2 ring-1 ring-line ring-inset")} />
      ))}
    </span>
  );
}

// Plain-language summary of the 8 scores (Uxcel "strengths / skill gaps" pattern):
// what's going well, what to work on, and a key for the 4-step bars.
function ScoreSummary({ scores }: { scores: DimensionScore[] }) {
  const rank = (s: DimensionScore) => BAND_META[s.band].rank;
  const good = scores.filter((s) => rank(s) >= 3).sort((a, b) => rank(b) - rank(a));
  const work = scores.filter((s) => s.band !== "not_assessable" && rank(s) <= 2).sort((a, b) => rank(a) - rank(b));
  const unscored = scores.filter((s) => s.band === "not_assessable");
  const group = (title: string, list: DimensionScore[], good: boolean) => (
    <div className="rounded-lg border border-line bg-surface p-4">
      <p className="flex items-center gap-2 font-display font-black">
        {good ? <CheckCircle2 className="size-4 text-strong" /> : <ArrowRight className="size-4 text-dev" />}
        {title}
        <span className="font-sans text-sm font-semibold text-muted">{list.length}</span>
      </p>
      <ul className="mt-2">
        {list.map((sc) => (
          <li key={sc.dimension}>
            <a href={`#score-${sc.dimension}`} className="flex items-center justify-between gap-3 border-t border-line py-2 text-sm first:border-t-0 hover:underline">
              <span className="min-w-0">{DIMENSION_BY_KEY[sc.dimension].label}</span>
              <BandPill band={sc.band} />
            </a>
          </li>
        ))}
        {!list.length && <li className="py-2 text-sm text-muted">{good ? "Nothing at Strong yet — that's what the fixes are for." : "Nothing — every area is Strong or better."}</li>}
      </ul>
    </div>
  );
  return (
    <div className="px-4 py-5 sm:px-6">
      <p className="font-display text-2xl font-black">Strong in {good.length} of {scores.length} areas</p>
      <p className="mt-1 text-sm text-muted">
        {work.length ? `Bring the ${work.length} area${work.length > 1 ? "s" : ""} under “Work on these next” up to Strong to move up a level. Your fix quest targets them.` : "Every scored area is at Strong or above."}
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {group("Doing well", good, true)}
        {group("Work on these next", work, false)}
      </div>
      {unscored.length > 0 && (
        <p className="mt-3 text-xs text-muted">Couldn&apos;t score from what we could read: {unscored.map((u) => DIMENSION_BY_KEY[u.dimension].label).join(", ")}.</p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted" aria-label="How to read the bars">
        <span className="font-semibold text-ink">Reading the bars:</span>
        {(["major_gap", "developing", "strong", "excellent"] as const).map((b) => (
          <span key={b} className="inline-flex items-center gap-1.5"><BandMeter band={b} small />{BAND_META[b].label}</span>
        ))}
      </div>
    </div>
  );
}

const whereOf = (review: Review, f: Finding) => review.caseStudies.find((c) => c.id === f.caseStudyId)?.title ?? "Whole portfolio";

// One highlighted "up next" fix, the rest as plain rows, finished ones folded
// away (Deel's current-step highlight + Linear/Asana status grouping).
function FixesSummary({ gaps, quest, review }: { gaps: Finding[]; quest: Quest; review: Review }) {
  if (!gaps.length) {
    return <Card className="border-t-4 border-t-strong p-5 text-sm text-muted">No significant gaps found at this level.</Card>;
  }
  const open = gaps.filter((g) => !quest.done.has(g.id));
  const done = gaps.filter((g) => quest.done.has(g.id));
  const [next, ...rest] = open;
  const num = (g: Finding) => gaps.indexOf(g) + 1;
  return (
    <Card className="h-full overflow-hidden border-t-4 border-t-accent">
      <div className="flex items-baseline justify-between gap-3 px-5 pt-5">
        <p className="font-display text-lg font-black">Your fixes</p>
        <p className="text-sm font-semibold text-muted tabular-nums">{done.length} of {gaps.length} done</p>
      </div>
      {next ? (
        <a href={`#${next.id}`} className="group mx-5 mt-3 block rounded-lg border-2 border-outline bg-accent-soft p-4">
          <p className="font-display text-xs font-extrabold tracking-wider text-accent-ink uppercase">Up next · Fix {num(next)}</p>
          <p className="mt-1 font-display text-lg leading-snug font-black text-pretty">{next.title}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <SeverityBadge severity={next.severity} />
            <Chip className="bg-surface">{whereOf(review, next)}</Chip>
            <span className="rounded-full bg-xp px-2 py-0.5 font-display text-xs font-extrabold text-on-xp tabular-nums">+{xpFor(next)} XP</span>
          </div>
          <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold group-hover:underline">Start this fix <ArrowRight className="size-4" /></span>
        </a>
      ) : (
        <div className="mx-5 mt-3 rounded-lg bg-strong-soft p-4 text-sm font-semibold text-strong">All fixes done — review again to see your new level.</div>
      )}
      {rest.length > 0 && (
        <ol className="mt-1 px-5">
          {rest.map((g) => (
            <li key={g.id}>
              <a href={`#${g.id}`} className="group flex items-start gap-3 border-b border-line py-3 text-sm last:border-b-0">
                <span className="grid size-6 shrink-0 place-items-center rounded-full border-2 border-line-strong font-display text-xs font-black text-muted">{num(g)}</span>
                <span className="min-w-0 flex-1 text-pretty group-hover:underline">{g.title}</span>
                <span className="shrink-0 pt-0.5 font-display text-xs font-extrabold text-xp-ink tabular-nums">+{xpFor(g)} XP</span>
              </a>
            </li>
          ))}
        </ol>
      )}
      {done.length > 0 && (
        <details className="group mt-2 border-t border-line bg-surface-2/60 px-5 py-3">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-muted">
            <CheckCircle2 className="size-4 text-strong" /> Done ({done.length})
            <ChevronDown className="ml-auto size-4 transition-transform group-open:rotate-180" />
          </summary>
          <ul className="mt-2 space-y-1.5">
            {done.map((g) => <li key={g.id}><a href={`#${g.id}`} className="text-sm text-muted line-through hover:underline">{g.title}</a></li>)}
          </ul>
        </details>
      )}
      <div className="h-3" />
    </Card>
  );
}

// What's already working, with where it shows up (Ferndesk-style coloured top edge).
function StrengthsSummary({ strengths, review }: { strengths: Finding[]; review: Review }) {
  return (
    <Card className="h-full border-t-4 border-t-strong">
      <div className="px-5 pt-5">
        <p className="font-display text-lg font-black">Keep these</p>
        <p className="text-sm text-muted">Already working — protect them while you edit.</p>
      </div>
      <ul className="px-5 pt-1 pb-3">
        {strengths.map((st) => (
          <li key={st.id}>
            <a href={`#${st.id}`} className="group flex gap-3 border-b border-line py-3 last:border-b-0">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-strong-soft text-strong"><CheckCircle2 className="size-4" /></span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-pretty group-hover:underline">{st.title}</span>
                <span className="mt-0.5 block text-xs text-muted">{DIMENSION_BY_KEY[st.dimension].label} · {whereOf(review, st)}</span>
              </span>
            </a>
          </li>
        ))}
        {!strengths.length && <li className="py-3 text-sm text-muted">No clear strengths could be evidenced yet.</li>}
      </ul>
    </Card>
  );
}

function ScoreRow({ score }: { score: DimensionScore }) {
  const [open, setOpen] = useState(false);
  const def = DIMENSION_BY_KEY[score.dimension];
  return (
    <li id={`score-${score.dimension}`} className="scroll-mt-32 border-t border-line first:border-t-0">
      <button onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-surface-2 sm:px-5">
        <IconTile icon={DIMENSION_LOOK[score.dimension].icon} tone={DIMENSION_LOOK[score.dimension].tone} size="sm" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold">{def.label}</span>
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
            <p className="mb-2 font-display text-xs font-extrabold tracking-wider text-muted uppercase">Evidence</p>
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
  const [current, selectSection] = useCurrentSection(nav.map(([id]) => id).join(","));
  const tabsRef = useRef<HTMLUListElement>(null);

  // Keep the current tab visible when the bar scrolls sideways (mobile).
  useEffect(() => {
    const bar = tabsRef.current;
    const tab = bar?.querySelector<HTMLElement>(`[data-tab="${current}"]`);
    if (!bar || !tab) return;
    const left = tab.offsetLeft, right = left + tab.offsetWidth;
    if (left < bar.scrollLeft || right > bar.scrollLeft + bar.clientWidth) {
      bar.scrollTo({ left: left - 16, behavior: "smooth" });
    }
  }, [current]);

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
          <Link href="/" className="inline-flex h-10 items-center gap-1.5 rounded-lg border-2 border-outline bg-accent px-4 font-display text-sm font-extrabold text-on-accent hover:bg-accent-hover">Review my portfolio <ArrowRight className="size-4" /></Link>
        ) : (
          <Button variant="secondary" onClick={rerun} disabled={rerunning}><RotateCw className={cx("size-4", rerunning && "animate-spin")} />{rerunning ? "Starting…" : "Review again"}</Button>
        )}
      </TopBar>

      {review.sample && (
        <div className="border-b border-line bg-sky-soft">
          <p className="mx-auto max-w-[1200px] px-4 py-2 text-sm text-sky-ink sm:px-6">
            <Info className="mr-1.5 inline size-4 align-[-3px]" />This is a sample review of a fictional portfolio. Select any evidence to see the page it came from.
          </p>
        </div>
      )}

      {/* Flat tinted header band carrying the page title. */}
      <div className="banner">
        <div id="summary" className={cx("mx-auto max-w-[1200px] px-4 pt-8 pb-10 text-ink sm:px-6 sm:pt-10", ANCHOR)}>
          <p className="font-display text-xs font-extrabold tracking-wider text-accent-ink uppercase">Portfolio review</p>
          <h1 className="mt-1 font-display text-3xl leading-tight font-black tracking-tight text-balance sm:text-4xl">{review.input.targetRole}</h1>
          <div className="mt-2"><InputSummary review={review} className="text-muted" /></div>
          <p className="mt-1 text-xs text-subtle">Reviewer perspective: Senior Product Design Hiring Manager · {new Date(review.createdAt).toLocaleDateString("en-US", { dateStyle: "medium" })}</p>
        </div>
      </div>

      <nav aria-label="Report sections" className="sticky top-14 z-20 border-b border-line bg-canvas/90 backdrop-blur">
        <ul ref={tabsRef} className="mx-auto flex max-w-[1200px] gap-1 overflow-x-auto px-4 [scrollbar-width:none] sm:px-6">
          {nav.map(([id, label]) => (
            <li key={id} className="shrink-0">
              <a
                href={`#${id}`}
                data-tab={id}
                onClick={() => selectSection(id)}
                aria-current={current === id ? "location" : undefined}
                className={cx(
                  "block border-b-[3px] px-3 pt-3 pb-2.5 font-display text-sm font-extrabold whitespace-nowrap transition-colors",
                  current === id ? "border-accent text-ink" : "border-transparent text-muted hover:border-line-strong hover:text-ink",
                )}
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Mobile order: summary → level/quest/badges → sections. Desktop: sections + sticky right rail (Uxcel). */}
      <div className="mx-auto grid max-w-[1200px] gap-8 px-4 pt-6 pb-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:grid-rows-[auto_1fr]">
        <div className="min-w-0 space-y-4 lg:col-start-1">
          {result.limitations.length > 0 && (
            <div className="flex gap-3 rounded-2xl border border-dev/30 bg-dev-soft px-4 py-3">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-dev" />
              <div className="text-sm">
                <p className="font-bold text-dev">Review completed with limitations</p>
                <ul className="mt-1 space-y-0.5 text-ink/80">{result.limitations.map((l) => <li key={l}>{l}</li>)}</ul>
                {gaps.some((g) => g.affectedByLimitation) && <p className="mt-1 text-xs text-muted">Findings based on partially-read content are labelled.</p>}
              </div>
            </div>
          )}

          <Card className="p-5 sm:p-6">
            <p className="font-display text-xl leading-snug font-black text-pretty sm:text-2xl">{result.verdict}</p>
            <p className="mt-2 text-[15px] leading-relaxed text-muted text-pretty">{result.summary}</p>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
              <span>Judged at {SENIORITY[review.input.seniority].label} level</span>
              <ConfidenceTag confidence={result.confidence} />
              {result.confidenceNote && <span>{result.confidenceNote}</span>}
            </div>
            <div className="mt-5 flex gap-3 rounded-2xl bg-accent-soft px-4 py-3">
              <Zap className="mt-0.5 size-4 shrink-0 text-accent" />
              <p className="text-sm"><span className="font-bold text-accent-ink">Start here: </span>{result.priorityNote}</p>
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-5">
            <div className="min-w-0 md:col-span-3"><FixesSummary gaps={gaps} quest={quest} review={review} /></div>
            <div className="min-w-0 md:col-span-2"><StrengthsSummary strengths={strengths} review={review} /></div>
          </div>
        </div>

        <aside aria-label="Your progress" className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <div className="grid gap-4 sm:grid-cols-2 lg:sticky lg:top-32 lg:grid-cols-1">
            <LevelCard review={review} />
            {gaps.length > 0 && <QuestCard quest={quest} />}
            <div className="sm:col-span-2 lg:col-span-1"><Achievements review={review} compact /></div>
          </div>
        </aside>

        <main className="min-w-0 space-y-12 lg:col-start-1">
          {/* Scorecard */}
          <div id="scorecard" className={ANCHOR}>
            <SectionTitle icon={Sparkles} tone="accent" title="Scorecard" subtitle="How well the portfolio presents your work — not your ability as a designer."
              right={<a href="#method" className={cx("text-sm", LINK)}>How scores work</a>} />
            <Card className="overflow-hidden">
              <div className="border-b border-line bg-surface-2/60"><ScoreSummary scores={result.dimensions} /></div>
              <ul>{result.dimensions.map((d) => <ScoreRow key={d.dimension} score={d} />)}</ul>
            </Card>
          </div>

          {/* Priority fixes */}
          <div id="fixes" className={ANCHOR}>
            <SectionTitle icon={Zap} tone="xp" eyebrow="Priority fixes" title="Your fix quest" subtitle="In the order we'd tackle them. Bigger fixes earn more XP — mark each one done as you make it." />
            <div className="space-y-4">
              <QuestComplete review={review} quest={quest} onRerun={rerun} rerunning={rerunning} />
              {gaps.map((f, i) => <FindingCard key={f.id} finding={f} index={i + 1} quest={quest} />)}
              {!gaps.length && <Card className="p-5 text-sm text-muted">No significant gaps were found at this level. The reviewer didn&apos;t manufacture weaknesses to fill this section.</Card>}
            </div>
          </div>

          <div id="strengths" className={ANCHOR}>
            <SectionTitle icon={Star} tone="strong" title="Strengths" subtitle="What's working — keep it through your edits." />
            <div className="space-y-4">{strengths.map((f) => <FindingCard key={f.id} finding={f} />)}</div>
          </div>

          <div id="achievements" className={ANCHOR}>
            <SectionTitle icon={Trophy} tone="pink" title="Badges" subtitle="Unlocked by what your portfolio already shows. Locked ones tell you what earns them." />
            <Achievements review={review} />
          </div>

          {/* Case studies */}
          <div id="case-studies" className={ANCHOR}>
            <SectionTitle icon={BookOpen} tone="sky" title="Case studies" subtitle={`${review.caseStudies.length} identified`} />
            <div className="grid gap-4 md:grid-cols-2">
              {review.caseStudies.map((cs) => {
                const r = result.caseStudyReviews.find((x) => x.caseStudyId === cs.id);
                const count = gaps.filter((g) => g.caseStudyId === cs.id).length;
                return (
                  <Card key={cs.id} className="flex flex-col p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display text-lg font-black">{cs.title}</h3>
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
            <div id="role-fit" className={ANCHOR}>
              <SectionTitle icon={Users} tone="accent" title="Role fit" subtitle="How well the portfolio evidences what the job description asks for." />
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

          {/* Evidence reviewed */}
          <div id="evidence" className={ANCHOR}>
            <SectionTitle icon={FileText} tone="sky" title="Evidence reviewed" subtitle="Everything the reviewer read. Findings only cite this content." />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {([["Pages reviewed", stats.pages, Globe, "sky"], ["Case studies", stats.caseStudies, BookOpen, "accent"], ["Images", stats.images, ImageIcon, "pink"], ["Words", stats.words.toLocaleString("en-US"), Quote, "xp"]] as const).map(([k, v, icon, tone]) => (
                <Card key={k} className="p-4">
                  <IconTile icon={icon} tone={tone} size="sm" />
                  <p className="mt-3 font-display text-3xl font-black tabular-nums">{v}</p>
                  <p className="text-xs font-semibold text-muted">{k}</p>
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

          {/* Method */}
          <div id="method" className={ANCHOR}>
            <SectionTitle icon={FlaskConical} tone="strong" title="How this review works" />
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
