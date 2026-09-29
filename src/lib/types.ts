// Core domain model for Critiq.
// The evidence layer (Source → Page → Block, each with a stable id) is the
// backbone: every observation, score and finding points back to block ids.

export type Seniority = "junior" | "mid" | "senior" | "lead";

export type DimensionKey =
  | "problem_framing"
  | "product_thinking"
  | "decision_quality"
  | "ux_reasoning"
  | "visual_craft"
  | "impact_outcomes"
  | "ownership_collaboration"
  | "storytelling";

export type Band = "major_gap" | "developing" | "strong" | "excellent" | "not_assessable";
export type Confidence = "low" | "medium" | "high";
export type Severity = "critical" | "high" | "medium" | "low";

export type BlockKind = "heading" | "text" | "list" | "image" | "page";

export interface Block {
  id: string; // e.g. "p3.b12"
  pageId: string;
  kind: BlockKind;
  text: string; // text content, or alt/caption for images
  src?: string; // image url
}

export interface Page {
  id: string; // e.g. "p3"
  sourceId: string;
  title: string;
  url?: string;
  pageNumber?: number;
  status: "reviewed" | "failed" | "skipped";
  reason?: string;
  role?: "case_study" | "about" | "resume" | "home" | "other";
  caseStudyId?: string;
  blocks: Block[];
  wordCount: number;
  imageCount: number;
}

export interface Source {
  id: string;
  kind: "url" | "file";
  label: string;
  status: "ok" | "partial" | "failed";
  error?: string;
}

export interface CaseStudy {
  id: string;
  title: string;
  summary: string;
  primary: boolean;
  pageIds: string[];
}

export interface EvidenceRef {
  blockId: string;
  quote: string;
  verified: boolean;
}

export type ObservationCategory =
  | "problem"
  | "role"
  | "research"
  | "decision"
  | "alternative"
  | "outcome"
  | "metric"
  | "collaboration"
  | "constraint"
  | "visual"
  | "structure"
  | "claim";

export interface Observation {
  id: string;
  caseStudyId: string | null;
  category: ObservationCategory;
  statement: string;
  evidence: EvidenceRef[];
  missing: boolean; // true = records an absence ("No metric found for…")
}

export interface DimensionScore {
  dimension: DimensionKey;
  band: Band;
  rationale: string;
  strength: string | null;
  concern: string | null;
  evidence: EvidenceRef[];
  confidence: Confidence;
}

export type FeedbackKind = "useful" | "generic" | "incorrect";

export interface Finding {
  id: string;
  kind: "gap" | "strength";
  title: string;
  dimension: DimensionKey;
  caseStudyId: string | null;
  observation: string;
  evidence: EvidenceRef[];
  missingEvidence: string | null;
  whyReviewerCares: string;
  recommendation: string;
  severity: Severity;
  confidence: Confidence;
  priorityScore: number;
  affectedByLimitation: boolean;
  feedback?: { kind: FeedbackKind; note?: string; at: string };
}

export interface RoleAlignment {
  requirement: string;
  status: "evidenced" | "partial" | "missing";
  note: string;
  evidence: EvidenceRef[];
}

export interface CaseStudyReview {
  caseStudyId: string;
  verdict: string;
  whatWorks: string;
  whatToFix: string;
}

export interface ReviewResult {
  verdict: string; // one-line overall
  readiness: "not_ready" | "needs_work" | "almost_ready" | "ready";
  summary: string;
  confidence: Confidence;
  confidenceNote: string | null;
  priorityNote: string;
  dimensions: DimensionScore[];
  findings: Finding[]; // prioritized gaps followed by strengths
  caseStudyReviews: CaseStudyReview[];
  roleAlignment: RoleAlignment[] | null;
  limitations: string[];
}

export type StepKey =
  | "access"
  | "extract"
  | "segment"
  | "observe"
  | "evaluate"
  | "verify"
  | "assemble";

export interface Step {
  key: StepKey;
  label: string;
  status: "pending" | "active" | "done" | "warning" | "failed";
  detail?: string;
}

export interface ReviewError {
  code: "url_inaccessible" | "no_content" | "parse_failed" | "ai_unavailable" | "internal";
  title: string;
  message: string;
  reasons: string[];
}

export interface ReviewInput {
  url?: string;
  files: { name: string; storedAs: string; size: number }[];
  seniority: Seniority;
  targetRole: string;
  jobDescription?: string;
}

export interface Review {
  id: string;
  createdAt: string;
  updatedAt: string;
  input: ReviewInput;
  status: "queued" | "processing" | "complete" | "failed";
  steps: Step[];
  error?: ReviewError;
  sources: Source[];
  pages: Page[];
  caseStudies: CaseStudy[];
  observations: Observation[];
  result?: ReviewResult;
  sample?: boolean;
}

export interface EvidenceStats {
  pages: number;
  pagesFailed: number;
  caseStudies: number;
  images: number;
  words: number;
}
