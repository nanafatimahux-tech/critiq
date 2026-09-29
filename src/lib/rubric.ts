import type { Band, Confidence, DimensionKey, Review, EvidenceStats, Seniority, Severity } from "./types";

export interface DimensionDef {
  key: DimensionKey;
  label: string;
  question: string; // what a reviewer is asking
  weight: number; // prioritization weight (hiring impact)
  rubric: Record<Exclude<Band, "not_assessable">, string>;
}

// Fixed dimensions and rubric. Kept in code (not in the prompt only) so the UI
// can show exactly what the reviewer evaluated against.
export const DIMENSIONS: DimensionDef[] = [
  {
    key: "problem_framing",
    label: "Problem framing",
    question: "Is the problem clearly defined, with users, context and why it mattered?",
    weight: 1.0,
    rubric: {
      major_gap: "Problem is absent or stated only as a feature/brief to execute.",
      developing: "Problem is named but lacks user, business context or constraints.",
      strong: "Problem, affected users, and stakes are clear and specific.",
      excellent: "Problem is sharply reframed from evidence; stakes and constraints drive the work.",
    },
  },
  {
    key: "product_thinking",
    label: "Product thinking",
    question: "Does the designer connect design work to user needs and business goals?",
    weight: 1.2,
    rubric: {
      major_gap: "Work is presented as screens with no link to goals or users.",
      developing: "Goals are mentioned but do not visibly shape the solution.",
      strong: "User and business goals clearly shape scope and priorities.",
      excellent: "Shows strategic trade-offs, sequencing and scoping driven by goals.",
    },
  },
  {
    key: "decision_quality",
    label: "Decision quality",
    question: "Are key decisions explained with alternatives, trade-offs and evidence?",
    weight: 1.3,
    rubric: {
      major_gap: "Final solutions shown with no explanation of why.",
      developing: "Some rationale, but alternatives and trade-offs are rarely shown.",
      strong: "Key decisions show alternatives considered and why one won.",
      excellent: "Decisions are explicit, evidence-backed and show judgment under constraints.",
    },
  },
  {
    key: "ux_reasoning",
    label: "UX reasoning",
    question: "Is research and interaction design reasoning visible and sound?",
    weight: 1.0,
    rubric: {
      major_gap: "No research or interaction rationale is present.",
      developing: "Research methods listed as process steps without insights.",
      strong: "Research produces insights that visibly inform the design.",
      excellent: "Insights, testing and iteration form a clear, convincing loop.",
    },
  },
  {
    key: "visual_craft",
    label: "Visual & UI craft",
    question: "Is the visual and interaction craft of the work (and the portfolio) high quality?",
    weight: 0.8,
    rubric: {
      major_gap: "Inconsistent, low-fidelity or hard-to-read visuals.",
      developing: "Competent visuals with noticeable inconsistencies in hierarchy or polish.",
      strong: "Polished, consistent visuals with clear hierarchy.",
      excellent: "Distinctive, highly refined craft that elevates the story.",
    },
  },
  {
    key: "impact_outcomes",
    label: "Impact & outcomes",
    question: "Are results evidenced with metrics, baselines or qualitative proof?",
    weight: 1.3,
    rubric: {
      major_gap: "No outcomes, or outcomes are claims with no support.",
      developing: "Outcomes are vague (\"improved\", \"users loved it\") without evidence.",
      strong: "Outcomes include metrics or credible qualitative evidence.",
      excellent: "Outcomes have baselines, attribution and reflection on what they mean.",
    },
  },
  {
    key: "ownership_collaboration",
    label: "Ownership & collaboration",
    question: "Is it clear what the designer personally did and how they worked with others?",
    weight: 1.1,
    rubric: {
      major_gap: "\"We\" throughout; individual contribution cannot be identified.",
      developing: "Role is stated but contributions are not distinguished from the team's.",
      strong: "Personal scope, responsibilities and collaborators are clear.",
      excellent: "Shows leadership, influence and cross-functional impact beyond own deliverables.",
    },
  },
  {
    key: "storytelling",
    label: "Storytelling",
    question: "Can a busy reviewer grasp the story quickly and follow it to the end?",
    weight: 0.9,
    rubric: {
      major_gap: "No discernible narrative; process dump or image gallery.",
      developing: "Story exists but is long, linear process-heavy, or buries the point.",
      strong: "Clear arc with a scannable structure and a strong opening.",
      excellent: "Tight, compelling narrative that leads with insight and outcomes.",
    },
  },
];

export const DIMENSION_BY_KEY = Object.fromEntries(DIMENSIONS.map((d) => [d.key, d])) as Record<
  DimensionKey,
  DimensionDef
>;

export const SENIORITY: Record<Seniority, { label: string; expectation: string }> = {
  junior: {
    label: "Junior",
    expectation:
      "Expect solid fundamentals and clear process. Impact evidence and strategic framing are nice-to-have; do not penalize their absence as heavily.",
  },
  mid: {
    label: "Mid-level",
    expectation:
      "Expect clear problem framing, explained decisions and some evidence of outcomes. Ownership should be distinguishable from the team's.",
  },
  senior: {
    label: "Senior",
    expectation:
      "Expect explicit trade-offs, measurable outcomes, clear personal ownership and influence on product direction. Process narration without judgment is a significant gap.",
  },
  lead: {
    label: "Lead / Staff",
    expectation:
      "Expect strategic scope, cross-team influence, mentoring or leadership signals, and business-level outcomes. Execution-only stories are a major gap.",
  },
};

export const BAND_META: Record<Band, { label: string; rank: number }> = {
  major_gap: { label: "Major gap", rank: 1 },
  developing: { label: "Developing", rank: 2 },
  strong: { label: "Strong", rank: 3 },
  excellent: { label: "Excellent", rank: 4 },
  not_assessable: { label: "Not assessable", rank: 0 },
};

export const READINESS_META = {
  not_ready: { label: "Not ready", index: 0 },
  needs_work: { label: "Needs work", index: 1 },
  almost_ready: { label: "Almost ready", index: 2 },
  ready: { label: "Ready", index: 3 },
} as const;

const SEVERITY_WEIGHT: Record<Severity, number> = { critical: 4, high: 3, medium: 2, low: 1 };
const CONFIDENCE_WEIGHT: Record<Confidence, number> = { high: 1, medium: 0.8, low: 0.5 };

// Deterministic prioritization: identical inputs always rank identically.
export function priorityScore(severity: Severity, dimension: DimensionKey, confidence: Confidence) {
  return +(SEVERITY_WEIGHT[severity] * DIMENSION_BY_KEY[dimension].weight * CONFIDENCE_WEIGHT[confidence]).toFixed(2);
}

export function evidenceStats(review: Pick<Review, "pages" | "caseStudies">): EvidenceStats {
  const reviewed = review.pages.filter((p) => p.status === "reviewed");
  return {
    pages: reviewed.length,
    pagesFailed: review.pages.filter((p) => p.status === "failed").length,
    caseStudies: review.caseStudies.length,
    images: reviewed.reduce((n, p) => n + p.imageCount, 0),
    words: reviewed.reduce((n, p) => n + p.wordCount, 0),
  };
}
