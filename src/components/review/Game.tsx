"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpen, Crosshair, FlaskConical, Lock, PenTool, RotateCw, Scale, Star, Trophy, TrendingUp } from "../icons";
import { Button, Card, Eyebrow, ProgressBar, cx } from "../ui";
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

// Codecademy benchmark-style: level number, named rung, and the ladder.
export function LevelBadge({ review }: { review: Review }) {
  const current = LEVELS[review.result!.readiness];
  return (
    <div>
      <Eyebrow>Hiring readiness</Eyebrow>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-serif text-5xl leading-none tabular-nums">{current.level}</span>
        <span className="text-sm text-muted">/ 4</span>
      </div>
      <p className="mt-1 font-semibold">Level {current.level} · {current.label}</p>
      <ol className="mt-4 grid grid-cols-4 gap-1" aria-label="Level ladder">
        {Object.values(LEVELS).map((l) => (
          <li key={l.level} className="min-w-0">
            <span className={cx("block h-2 rounded-full", l.level <= current.level ? "bg-ink" : "track-hatch ring-1 ring-line ring-inset")} />
            <span className={cx("mt-1.5 block text-xs leading-tight", l.level === current.level ? "font-semibold text-ink" : "text-subtle")}>{l.label}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function QuestProgress({ quest, compact }: { quest: Quest; compact?: boolean }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <Eyebrow>Fix quest</Eyebrow>
        <p className="font-mono text-xs text-muted tabular-nums">{quest.count} / {quest.size} fixes</p>
      </div>
      <div className="mt-2"><ProgressBar value={quest.earned} max={quest.total} label="Quest XP" /></div>
      <p className="mt-2 text-sm">
        <span className="font-semibold tabular-nums">{quest.earned} XP</span>
        <span className="text-muted tabular-nums"> of {quest.total} XP</span>
        {!compact && <span className="text-muted"> · Mark fixes done as you make them.</span>}
      </p>
    </div>
  );
}

export function FixToggle({ finding, quest }: { finding: Finding; quest: Quest }) {
  const done = quest.done.has(finding.id);
  return (
    <button
      type="button"
      onClick={() => quest.toggle(finding.id)}
      aria-pressed={done}
      className={cx(
        "inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition-colors sm:h-9",
        done ? "border-transparent bg-xp text-[#1a1a19]" : "border-line-strong bg-surface hover:border-ink",
      )}
    >
      <span className={cx("grid size-4 place-items-center rounded-full border", done ? "border-[#1a1a19] bg-[#1a1a19] text-xp" : "border-line-strong")}>
        {done && <svg viewBox="0 0 12 12" className="size-2.5" aria-hidden><path d="M2.5 6.2 5 8.5l4.5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
      </span>
      {done ? "Fixed" : "Mark as fixed"}
      <span className={cx("font-mono text-xs tabular-nums", done ? "" : "text-muted")}>+{xpFor(finding)} XP</span>
    </button>
  );
}

// Codecademy "Project complete" moment: dark stage, yellow reward, one next step.
export function QuestComplete({ review, quest, onRerun, rerunning }: { review: Review; quest: Quest; onRerun: () => void; rerunning: boolean }) {
  if (!quest.complete) return null;
  const current = LEVELS[review.result!.readiness];
  return (
    <div className="rounded-2xl bg-stage p-5 text-white sm:p-6" role="status">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-xp text-[#1a1a19]"><Trophy className="size-5" /></span>
          <div>
            <p className="font-semibold">Quest complete — <span className="text-xp">{quest.earned} XP</span> earned</p>
            <p className="mt-0.5 text-sm text-white/70">
              {current.level < 4 ? `Review again to confirm your fixes and see if you reach Level ${current.level + 1}.` : "Review again to confirm your fixes hold up."}
            </p>
          </div>
        </div>
        {review.sample ? (
          <Link href="/" className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-xp px-4 text-sm font-semibold text-[#1a1a19] hover:brightness-95">
            Review my portfolio <ArrowRight className="size-4" />
          </Link>
        ) : (
          <Button onClick={onRerun} disabled={rerunning} className="h-10 shrink-0 bg-xp text-[#1a1a19] hover:bg-xp hover:brightness-95">
            <RotateCw className={cx("size-4", rerunning && "animate-spin")} /> {rerunning ? "Starting…" : "Review again"}
          </Button>
        )}
      </div>
    </div>
  );
}

const ICONS: Record<AchievementIcon, typeof Star> = {
  framing: Crosshair, decisions: Scale, research: FlaskConical, craft: PenTool,
  impact: TrendingUp, story: BookOpen, case: Star, ready: Trophy,
};

export function Achievements({ review }: { review: Review }) {
  const list = achievements(review);
  const earned = list.filter((a) => a.earned).length;
  return (
    <Card className="p-4 sm:p-5">
      <p className="font-mono text-xs text-muted tabular-nums">{earned} of {list.length} unlocked</p>
      <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-4">
        {list.map((a) => {
          const Icon = a.earned ? ICONS[a.icon] : Lock;
          return (
            <li key={a.id} className="flex flex-col items-center text-center">
              {/* Stamp: double ring like Codecademy's achievement seals. */}
              <span className={cx(
                "grid size-16 place-items-center rounded-full border-2 p-1",
                a.earned ? "border-ink" : "border-dashed border-line-strong",
              )}>
                <span className={cx("grid size-full place-items-center rounded-full", a.earned ? "bg-xp-soft text-xp-ink ring-1 ring-ink" : "text-subtle")}>
                  <Icon className="size-5" />
                </span>
              </span>
              <p className={cx("mt-2 text-sm font-semibold", !a.earned && "text-muted")}>{a.title}</p>
              <p className="mt-0.5 text-xs text-muted text-pretty">{a.earned ? "Unlocked" : a.how}</p>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
