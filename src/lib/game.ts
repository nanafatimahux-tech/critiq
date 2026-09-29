// Gamification layer. Every level, XP value and achievement is derived from the
// review itself — nothing is awarded that the rubric didn't support.
import { BAND_META } from "./rubric";
import type { Band, DimensionKey, Review, ReviewResult, Severity } from "./types";

export const LEVELS: Record<ReviewResult["readiness"], { level: number; label: string }> = {
  not_ready: { level: 1, label: "Not ready" },
  needs_work: { level: 2, label: "Needs work" },
  almost_ready: { level: 3, label: "Almost ready" },
  ready: { level: 4, label: "Ready" },
};

// Bigger fixes are worth more, so the quest rewards tackling them in priority order.
export const XP_BY_SEVERITY: Record<Severity, number> = { critical: 50, high: 40, medium: 25, low: 15 };

export type AchievementIcon = "framing" | "decisions" | "research" | "craft" | "impact" | "story" | "case" | "ready";

export interface Achievement {
  id: string;
  title: string;
  icon: AchievementIcon;
  earned: boolean;
  how: string; // what earns it, shown on locked badges
}

const atLeastStrong = (band: Band | undefined) => !!band && BAND_META[band].rank >= BAND_META.strong.rank;

const DIMENSION_BADGES: { dimension: DimensionKey; id: string; title: string; icon: AchievementIcon; label: string }[] = [
  { dimension: "problem_framing", id: "framer", title: "Sharp framer", icon: "framing", label: "Problem framing" },
  { dimension: "decision_quality", id: "decider", title: "Decision maker", icon: "decisions", label: "Decision quality" },
  { dimension: "ux_reasoning", id: "researcher", title: "Evidence-led", icon: "research", label: "UX reasoning" },
  { dimension: "visual_craft", id: "crafter", title: "Crafted", icon: "craft", label: "Visual & UI craft" },
  { dimension: "impact_outcomes", id: "impact", title: "Impact proven", icon: "impact", label: "Impact & outcomes" },
  { dimension: "storytelling", id: "storyteller", title: "Storyteller", icon: "story", label: "Storytelling" },
];

export function achievements(review: Review): Achievement[] {
  const result = review.result!;
  const band = (d: DimensionKey) => result.dimensions.find((s) => s.dimension === d)?.band;
  const gapCases = new Set(result.findings.filter((f) => f.kind === "gap").map((f) => f.caseStudyId));
  return [
    ...DIMENSION_BADGES.map((b) => ({
      id: b.id, title: b.title, icon: b.icon,
      earned: atLeastStrong(band(b.dimension)),
      how: `Reach Strong in ${b.label}`,
    })),
    {
      id: "standout", title: "Standout case study", icon: "case" as const,
      earned: review.caseStudies.some((c) => !gapCases.has(c.id)),
      how: "Have a case study with no priority fixes",
    },
    {
      id: "ready", title: "Hire-ready", icon: "ready" as const,
      earned: result.readiness === "ready",
      how: "Reach Level 4",
    },
  ];
}
