import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { BetaContentBlockParam } from "@anthropic-ai/sdk/resources/beta/messages/messages";
import { z } from "zod";

export const MODEL = "claude-opus-5-5";

let client: Anthropic | null = null;
function getClient() {
  client ??= new Anthropic();
  return client;
}

export class AIError extends Error {}

// One structured call. Server-side refusal fallback is enabled so a false-positive
// safety refusal reroutes to another model instead of failing the review.
export async function structured<S extends z.ZodType>(opts: {
  schema: S;
  system: string;
  content: BetaContentBlockParam[];
  effort: "low" | "medium" | "high";
}): Promise<z.infer<S>> {
  try {
    return await structuredOnce(opts);
  } catch (err) {
    // The SDK moves enum constraints into field descriptions, so a response can
    // occasionally fail Zod validation. Retry once; API errors are not retried here
    // (the SDK already retries 429/5xx).
    if (err instanceof Anthropic.APIError || err instanceof AIError) throw err;
    return structuredOnce(opts);
  }
}

async function structuredOnce<S extends z.ZodType>(opts: {
  schema: S;
  system: string;
  content: BetaContentBlockParam[];
  effort: "low" | "medium" | "high";
}): Promise<z.infer<S>> {
  const res = await getClient().beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: opts.system,
    messages: [{ role: "user", content: opts.content }],
    output_config: { format: betaZodOutputFormat(opts.schema), effort: opts.effort },
  });
  if (res.stop_reason === "refusal") throw new AIError("The reviewer declined to process this content.");
  if (res.stop_reason === "max_tokens") throw new AIError("The review response was cut off.");
  if (!res.parsed_output) throw new AIError("The reviewer returned an unreadable response.");
  return res.parsed_output as z.infer<S>;
}

export function isAuthError(err: unknown) {
  return err instanceof Anthropic.AuthenticationError || (err instanceof Error && /api key|apiKey|authentication/i.test(err.message));
}

/* ---------- Schemas ---------- */

export const SegmentSchema = z.object({
  pageRoles: z.array(
    z.object({
      pageId: z.string(),
      role: z.enum(["case_study", "about", "resume", "home", "other"]),
    }),
  ),
  caseStudies: z.array(
    z.object({
      title: z.string(),
      summary: z.string().describe("One sentence: what the project is, for whom."),
      primary: z.boolean().describe("True for substantive product/UX case studies a hiring reviewer would weigh most."),
      pageIds: z.array(z.string()),
    }),
  ),
});

const CATEGORY = z.enum([
  "problem", "role", "research", "decision", "alternative", "outcome", "metric",
  "collaboration", "constraint", "visual", "structure", "claim",
]);

export const ObserveSchema = z.object({
  observations: z.array(
    z.object({
      category: CATEGORY,
      statement: z.string().describe("A neutral, factual description of what is (or is not) present. No judgment."),
      blockId: z.string().nullable().describe("The [id] of the block this comes from; null only for missing observations."),
      quote: z.string().nullable().describe("Verbatim text copied from that block (max ~25 words). Null for visual or missing observations."),
      missing: z.boolean().describe("True when recording that expected evidence is absent."),
    }),
  ),
});

const DIM = z.enum([
  "problem_framing", "product_thinking", "decision_quality", "ux_reasoning",
  "visual_craft", "impact_outcomes", "ownership_collaboration", "storytelling",
]);
const CONF = z.enum(["low", "medium", "high"]);

export const EvaluateSchema = z.object({
  readiness: z.enum(["not_ready", "needs_work", "almost_ready", "ready"]),
  verdict: z.string().describe("One sentence overall judgment of the portfolio presentation, at the target seniority."),
  summary: z.string().describe("2-3 sentences expanding the verdict."),
  confidence: CONF,
  confidenceNote: z.string().nullable().describe("If confidence is not high: what evidence was missing."),
  priorityNote: z.string().describe("One sentence: what to fix first and why."),
  dimensions: z.array(
    z.object({
      dimension: DIM,
      band: z.enum(["major_gap", "developing", "strong", "excellent", "not_assessable"]),
      rationale: z.string(),
      strength: z.string().nullable(),
      concern: z.string().nullable(),
      observationIds: z.array(z.string()),
      confidence: CONF,
    }),
  ),
  findings: z.array(
    z.object({
      kind: z.enum(["gap", "strength"]),
      title: z.string().describe("Specific headline naming the case study where relevant."),
      dimension: DIM,
      caseStudyId: z.string().nullable(),
      observation: z.string().describe("What the portfolio shows or omits, stated concretely."),
      observationIds: z.array(z.string()),
      missingEvidence: z.string().nullable().describe("For gaps rooted in absence: exactly what was not found."),
      whyReviewerCares: z.string(),
      recommendation: z.string().describe("A concrete, doable change tied to the specific content."),
      severity: z.enum(["critical", "high", "medium", "low"]),
      confidence: CONF,
    }),
  ),
  caseStudyReviews: z.array(
    z.object({ caseStudyId: z.string(), verdict: z.string(), whatWorks: z.string(), whatToFix: z.string() }),
  ),
  roleAlignment: z
    .array(
      z.object({
        requirement: z.string(),
        status: z.enum(["evidenced", "partial", "missing"]),
        note: z.string(),
        observationIds: z.array(z.string()),
      }),
    )
    .nullable(),
});

/* ---------- Prompts ---------- */

export const SEGMENT_SYSTEM = `You organize a designer's portfolio into its parts before it is reviewed.
Classify every page by role and group case-study pages into case studies (a case study may span several pages, or several PDF pages).
Mark a case study primary if it is a substantive product/UX project; mark secondary for small visual pieces, side projects or non-design work.
Use only the page ids provided.`;

export const OBSERVE_SYSTEM = `You are the evidence-extraction stage of a portfolio review. You record OBSERVATIONS only — no judgments, no advice.

Content is given as blocks, each prefixed with an id like [p3.b12]. Images and PDF pages may be attached; they are labelled with their block id.

Record what a hiring reviewer would look for:
- problem: the problem, users, context
- role: what the designer personally did, their title, team size
- research: research methods AND the insights they produced
- decision / alternative: design decisions, alternatives considered, trade-offs
- outcome / metric: results, metrics, baselines, qualitative proof
- collaboration: work with PM/engineering/stakeholders
- constraint: technical, business or time constraints
- visual: observable visual/UI craft qualities of the work or the portfolio itself (cite image or page block id, quote null)
- structure: how the case study is organized and paced
- claim: notable assertions (e.g. "improved conversion") exactly as stated

Rules:
1. quote MUST be copied character-for-character from the cited block's text. Never paraphrase inside quote. Keep quotes short.
2. Never invent metrics, methods, outcomes or roles. If something a reviewer expects is absent, add an observation with missing=true, blockId=null, quote=null, e.g. "No quantitative outcome or baseline is given for the checkout redesign."
3. Always check for, and record if missing: problem, personal role, research insights, decision rationale/alternatives, outcomes/metrics, collaboration.
4. Distinguish a claim from evidence: "improved conversion" with no number is a claim, and a missing metric.
5. 8-25 observations per case study. Be specific and neutral.`;

export function evaluateSystem(seniorityLabel: string, expectation: string, rubric: string) {
  return `You are the evaluation stage of Critiq, a portfolio review written from the perspective of a Senior Product Design Hiring Manager.
You judge the PORTFOLIO'S PRESENTATION of the designer's work — not the designer's worth or talent.

Target level: ${seniorityLabel}. ${expectation}

You are given only verified observations (ids like o12). Base every judgment on them.

Rubric (band definitions per dimension):
${rubric}

Rules:
- Absence of evidence is never evidence of absence: say "no quantitative outcome was found", never "the project had little impact".
- If a dimension cannot be judged from the observations, use band "not_assessable" and explain what is missing. Do not guess.
- Cite observationIds for every dimension and every finding. A finding without supporting observation ids must describe missingEvidence (cite the missing=true observations).
- Findings: produce up to 7 gaps and up to 4 strengths. Prefer the few highest-impact issues over many small ones. Each must be specific to THIS portfolio (name the case study, quote what it says or omits). Generic advice that could apply to any portfolio is a failure.
- If the portfolio is genuinely strong, say so; do not invent weaknesses. Low-severity polish notes are fine.
- Severity reflects hiring impact at the target level: critical = likely to fail a portfolio screen.
- Readiness: not_ready / needs_work / almost_ready / ready for a portfolio screen at the target level.
- Confidence is low when case studies are thin, missing, or large parts could not be read.
- caseStudyReviews: one per case study id given.
- roleAlignment: only when a job description is provided (else null). List 4-8 key requirements from it and whether the portfolio evidences them.
- Write plainly and directly, like an experienced reviewer. No flattery, no theatrics.`;
}
