"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight, BookOpen, Crosshair, FlaskConical, Lock, PenTool, RotateCw, Scale, Sparkles, Star, Trophy, TrendingUp, Zap,
} from "../icons";
import { Button, Card, IconTile, ProgressBar, TONE, cx, type Tone } from "../ui";
import { LEVELS, XP_BY_SEVERITY, achievements, type AchievementIcon } from "@/lib/game";
import type { Finding, Review } from "@/lib/types";

// Quest progress is self-reported, so it lives in this browser only.
export function useQuest(review: Review) {
  const key = `critiq:quest:${review.id}`;
  const gaps = useMemo(() => review.result!.findings.filter((f) => f.kind === "gap"), [review]);
  const [done, setDone] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) setDone(new Set(JSON.parse(saved) as string[]));
    } catch { /* storage unavailable: quest still works for this visit */ }
  }, [key]);

  const toggle = useCallback((id: string) => {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      try { localStorage.setItem(key, JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  }, [key]);

  const total = gaps.reduce((n, f) => n + XP_BY_SEVERITY[f.severity], 0);
  const earned = gaps.filter((f) => done.has(f.id)).reduce((n, f) => n + XP_BY_SEVERITY[f.severity], 0);
  const count = gaps.filter((f) => done.has(f.id)).length;
  return { done, toggle, total, earned, count, size: gaps.length, complete: gaps.length > 0 && count === gaps.length };
}
export type Quest = ReturnType<typeof useQuest>;

export function xpFor(f: Finding) {
  return XP_BY_SEVERITY[f.severity];
}

const LEVEL_TONE = ["bg-gap", "bg-dev", "bg-sky", "bg-strong"];

// Level medallion + ladder (Uxcel league card).
export function LevelCard({ review }: { review: Review }) {
  const current = LEVELS[review.result!.readiness];
  return (
    <Card className="overflow-hidden">
      <div className="banner relative px-5 pt-5 pb-10 text-ink">
        <p className="font-display text-xs font-extrabold tracking-wider text-accent-ink uppercase">Hiring readiness</p>
        <p className="mt-1 font-display text-2xl font-black">{current.label}</p>
      </div>
      <div className="relative -mt-8 px-5 pb-5">
        <div className="flex items-end gap-3">
          <span className="grid size-16 place-items-center rounded-full border-2 border-outline bg-xp font-display text-3xl font-black text-on-xp">
            {current.level}
          </span>
          <p className="pb-1 font-display text-sm font-extrabold text-muted">Level {current.level} of 4</p>
        </div>
        <ol className="mt-4 grid grid-cols-4 gap-1.5" aria-label="Level ladder">
          {Object.values(LEVELS).map((l, i) => (
            <li key={l.level} className="min-w-0">
              <span className={cx("block h-2.5 rounded-full", l.level <= current.level ? LEVEL_TONE[i] : "bg-surface-2 ring-1 ring-line ring-inset")} />
              <span className={cx("mt-1.5 block text-xs leading-tight", l.level === current.level ? "font-bold text-ink" : "text-subtle")}>{l.label}</span>
            </li>
          ))}
        </ol>
      </div>
    </Card>
  );
}

export function QuestCard({ quest }: { quest: Quest }) {
  const left = quest.size - quest.count;
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <IconTile icon={Zap} tone="xp" />
        <div className="min-w-0 flex-1">
          <p className="font-display font-black">Fix quest</p>
          <p className="text-sm text-muted">{quest.complete ? "All fixes done!" : `${left} fix${left === 1 ? "" : "es"} to go`}</p>
        </div>
        <p className="font-display text-sm font-extrabold tabular-nums">{quest.count}/{quest.size}</p>
      </div>
      <div className="mt-4"><ProgressBar value={quest.earned} max={quest.total} label="Quest XP" /></div>
      <p className="mt-2 text-sm"><span className="font-display font-black tabular-nums text-xp-ink">{quest.earned} XP</span><span className="text-muted tabular-nums"> of {quest.total}</span></p>
    </Card>
  );
}

// A few confetti pieces + a floating "+XP" when a fix is marked done.
const BURST_COLORS = ["var(--xp)", "var(--accent)", "var(--sky)", "var(--pink)", "var(--strong)"];
function Burst({ xp }: { xp: number }) {
  return (
    <span aria-hidden>
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const r = 38 + (i % 3) * 10;
        return <span key={i} className="burst-piece" style={{ background: BURST_COLORS[i % 5], ["--dx" as string]: `${Math.cos(a) * r}px`, ["--dy" as string]: `${Math.sin(a) * r}px` }} />;
      })}
      <span className="xp-float font-display text-sm font-black whitespace-nowrap text-xp-ink">+{xp} XP</span>
    </span>
  );
}

export function FixToggle({ finding, quest }: { finding: Finding; quest: Quest }) {
  const done = quest.done.has(finding.id);
  const [celebrate, setCelebrate] = useState(0);
  return (
    <button
      type="button"
      onClick={() => { if (!done) setCelebrate((n) => n + 1); quest.toggle(finding.id); }}
      aria-pressed={done}
      className={cx(
        "relative inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border-2 px-4 font-display text-sm font-extrabold transition-colors active:scale-[.97]",
        done ? "border-strong bg-strong-soft text-strong" : "border-outline bg-surface text-ink hover:bg-accent-soft",
      )}
    >
      <span className={cx("grid size-5 place-items-center rounded-full", done ? "bg-strong text-surface" : "border-2 border-outline")}>
        {done && <svg viewBox="0 0 12 12" className="size-3" aria-hidden><path d="M2.5 6.2 5 8.5l4.5-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
      </span>
      {done ? "Fixed" : "Mark as fixed"}
      <span className={cx("rounded-full px-2 py-0.5 text-xs tabular-nums", done ? "bg-strong/15" : "bg-xp text-on-xp")}>+{xpFor(finding)} XP</span>
      {done && celebrate > 0 && <Burst key={celebrate} xp={xpFor(finding)} />}
    </button>
  );
}

// "Quest complete" moment: dark stage, gold reward button, one next step.
export function QuestComplete({ review, quest, onRerun, rerunning }: { review: Review; quest: Quest; onRerun: () => void; rerunning: boolean }) {
  if (!quest.complete) return null;
  const current = LEVELS[review.result!.readiness];
  return (
    <div className="animate-pop rounded-xl bg-stage p-5 text-white sm:p-6" role="status">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-xp text-on-xp"><Trophy className="size-6" /></span>
          <div>
            <p className="font-display text-lg font-black">Quest complete! <span className="text-xp">+{quest.earned} XP</span></p>
            <p className="mt-0.5 text-sm text-white/80">
              {current.level < 4 ? `Review again to confirm your fixes and see if you reach Level ${current.level + 1}.` : "Review again to confirm your fixes hold up."}
            </p>
          </div>
        </div>
        {review.sample ? (
          <Link href="/" className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-xp px-5 font-display font-extrabold text-on-xp hover:brightness-105">
            Review my portfolio <ArrowRight className="size-4" />
          </Link>
        ) : (
          <Button variant="reward" onClick={onRerun} disabled={rerunning} className="h-11 shrink-0">
            <RotateCw className={cx("size-4", rerunning && "animate-spin")} /> {rerunning ? "Starting…" : "Review again"}
          </Button>
        )}
      </div>
    </div>
  );
}

const ACHIEVEMENT_LOOK: Record<AchievementIcon, { icon: typeof Star; tone: Tone }> = {
  framing: { icon: Crosshair, tone: "accent" }, decisions: { icon: Scale, tone: "pink" },
  research: { icon: FlaskConical, tone: "strong" }, craft: { icon: PenTool, tone: "xp" },
  impact: { icon: TrendingUp, tone: "sky" }, story: { icon: BookOpen, tone: "pink" },
  case: { icon: Star, tone: "xp" }, ready: { icon: Trophy, tone: "accent" },
};

export function Achievements({ review, compact }: { review: Review; compact?: boolean }) {
  const list = achievements(review);
  const earned = list.filter((a) => a.earned).length;
  if (compact) {
    return (
      <Card className="p-5">
        <div className="flex items-center gap-3">
          <IconTile icon={Sparkles} tone="pink" />
          <div className="flex-1">
            <p className="font-display font-black">Badges</p>
            <p className="text-sm text-muted">{earned} of {list.length} unlocked</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {list.map((a) => {
            const look = ACHIEVEMENT_LOOK[a.icon];
            return a.earned
              ? <IconTile key={a.id} icon={look.icon} tone={look.tone} size="sm" className="ring-2 ring-surface" />
              : <span key={a.id} title={a.how} className="grid size-8 place-items-center rounded-lg border-2 border-dashed border-line-strong text-subtle"><Lock className="size-3.5" /></span>;
          })}
        </div>
        <a href="#achievements" className="mt-3 inline-block text-sm font-semibold text-accent-ink hover:underline">See how to unlock more</a>
      </Card>
    );
  }
  return (
    <Card className="p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="font-display font-extrabold text-muted tabular-nums">{earned} of {list.length} unlocked</p>
        <div className="w-32"><ProgressBar value={earned} max={list.length} tone="accent" size="sm" label="Badges unlocked" /></div>
      </div>
      <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {list.map((a) => {
          const look = ACHIEVEMENT_LOOK[a.icon];
          const Icon = a.earned ? look.icon : Lock;
          return (
            <li key={a.id} className={cx("flex flex-col items-center rounded-xl p-3 text-center", a.earned ? "bg-surface-2" : "border-2 border-dashed border-line")}>
              {/* One clean tinted circle per badge; locked ones stay a quiet outline. */}
              <span className={cx("grid size-14 place-items-center rounded-full", a.earned ? TONE[look.tone] : "text-subtle")} aria-hidden>
                <Icon className={a.earned ? "size-6" : "size-5"} />
              </span>
              <p className={cx("mt-2 font-display text-sm font-black", !a.earned && "text-muted")}>{a.title}</p>
              <p className="mt-0.5 text-xs text-muted text-pretty">{a.earned ? "Unlocked" : a.how}</p>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
