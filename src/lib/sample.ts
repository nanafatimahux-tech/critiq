import type {
  Block, BlockKind, CaseStudy, DimensionKey, EvidenceRef, Finding, Observation, Page, Review, Severity, Confidence,
} from "./types";
import { priorityScore } from "./rubric";

// A realistic, fully-grounded sample review of a fictional portfolio.
// Every quote below appears verbatim in the sample blocks.

function page(id: string, title: string, url: string, raw: [BlockKind, string][], extra: Partial<Page> = {}): Page {
  const blocks: Block[] = raw.map(([kind, text], i) => ({ id: `${id}.b${i + 1}`, pageId: id, kind, text, src: kind === "image" ? "" : undefined }));
  const textBlocks = blocks.filter((b) => b.kind !== "image");
  return {
    id, sourceId: "s1", title, url, status: "reviewed", blocks,
    wordCount: textBlocks.reduce((n, b) => n + b.text.split(/\s+/).length, 0),
    imageCount: blocks.length - textBlocks.length, ...extra,
  };
}

const BASE = "https://maya-chen.example";

const pages: Page[] = [
  page("p1", "Maya Chen — Product Designer", BASE, [
    ["heading", "Maya Chen — Product Designer"],
    ["text", "I design calm, useful products for commerce and healthcare."],
    ["image", "Fernway checkout thumbnail"],
    ["image", "Halo Health booking thumbnail"],
    ["image", "Orbit design system thumbnail"],
  ], { role: "home" }),
  page("p2", "Rebuilding checkout for Fernway", `${BASE}/work/fernway`, [
    ["heading", "Rebuilding checkout for Fernway"],
    ["text", "Fernway is a home goods retailer with 2M monthly shoppers. Checkout abandonment was the highest in the funnel."],
    ["heading", "My role"],
    ["text", "Lead designer on a squad with a PM, 4 engineers and a researcher. We owned checkout end to end."],
    ["heading", "Research"],
    ["text", "We ran 8 user interviews and a heuristic review of the existing flow."],
    ["image", "Affinity map from interviews"],
    ["text", "Shoppers told us surprise shipping costs at the last step made them leave."],
    ["heading", "Explorations"],
    ["image", "Early wireframes of single-page checkout"],
    ["image", "Iteration 2 of payment step"],
    ["image", "Iteration 3 of payment step"],
    ["image", "Final high-fidelity checkout screens"],
    ["text", "We explored a single-page checkout and an accordion layout before landing on the final design."],
    ["heading", "Outcome"],
    ["text", "The redesigned flow launched in March and improved conversion. Stakeholders were thrilled with the result."],
  ], { role: "case_study", caseStudyId: "cs1" }),
  page("p3", "Halo Health: booking a clinic visit in under a minute", `${BASE}/work/halo`, [
    ["heading", "Halo Health: booking a clinic visit in under a minute"],
    ["text", "Patients were calling the front desk to book because the online scheduler required 11 steps."],
    ["text", "I was the sole designer, partnering with a product manager and two engineers over 10 weeks."],
    ["heading", "Key decision: show availability first"],
    ["text", "We tested two directions with 6 patients: choosing a doctor first versus choosing a time first. Five of six preferred seeing available times first, so we led with availability and made doctor choice a filter."],
    ["image", "Side-by-side comparison of doctor-first and time-first flows"],
    ["heading", "Results"],
    ["text", "Online bookings grew from 38% to 61% of all appointments in the first quarter after launch, and front-desk call volume dropped by roughly a quarter."],
    ["image", "Final booking flow on mobile"],
  ], { role: "case_study", caseStudyId: "cs2" }),
  page("p4", "Orbit design system", `${BASE}/work/orbit`, [
    ["heading", "Orbit design system"],
    ["text", "A component library I built to unify our web and mobile products."],
    ["image", "Component overview"],
    ["image", "Color and type tokens"],
    ["image", "Button variants"],
    ["text", "Orbit now has 60+ components used across 3 product teams."],
  ], { role: "case_study", caseStudyId: "cs3" }),
  page("p5", "About", `${BASE}/about`, [
    ["heading", "About"],
    ["text", "I'm a product designer with 6 years of experience, most recently at Fernway. Before that I worked at an agency designing marketing sites."],
  ], { role: "about" }),
  {
    id: "p6", sourceId: "s1", title: "Playground", url: `${BASE}/playground`, status: "failed",
    reason: "Little readable content — the page may need JavaScript to render", blocks: [], wordCount: 0, imageCount: 0,
  },
];

const caseStudies: CaseStudy[] = [
  { id: "cs1", title: "Rebuilding checkout for Fernway", summary: "Checkout redesign for a home goods retailer with 2M monthly shoppers.", primary: true, pageIds: ["p2"] },
  { id: "cs2", title: "Halo Health clinic booking", summary: "Simplifying online appointment booking for a clinic network's patients.", primary: true, pageIds: ["p3"] },
  { id: "cs3", title: "Orbit design system", summary: "A shared component library for web and mobile products.", primary: true, pageIds: ["p4"] },
];

const e = (blockId: string, quote = ""): EvidenceRef => ({ blockId, quote, verified: true });

const obs: [string | null, Observation["category"], string, EvidenceRef[]][] = [
  ["cs1", "problem", "Checkout abandonment is framed as the biggest funnel problem for a large retailer.", [e("p2.b2", "Checkout abandonment was the highest in the funnel.")]],
  ["cs1", "role", "Role is stated as lead designer, but ownership is described collectively.", [e("p2.b4", "We owned checkout end to end.")]],
  ["cs1", "research", "Research methods are listed: interviews and a heuristic review.", [e("p2.b6", "We ran 8 user interviews and a heuristic review")]],
  ["cs1", "research", "Research produced a specific insight about surprise shipping costs.", [e("p2.b8", "surprise shipping costs at the last step made them leave")]],
  ["cs1", "alternative", "Two alternatives are named without explaining why the final design was chosen.", [e("p2.b14", "We explored a single-page checkout and an accordion layout before landing on the final design.")]],
  ["cs1", "structure", "Four consecutive images show iterations with alt text only, no annotations.", [e("p2.b10"), e("p2.b11"), e("p2.b12"), e("p2.b13")]],
  ["cs1", "claim", "Outcome claims improved conversion with no number.", [e("p2.b16", "improved conversion")]],
  ["cs1", "metric", "No conversion metric, baseline, or experiment result is given for the checkout redesign.", []],
  ["cs2", "problem", "Problem is specific and measurable: an 11-step scheduler pushed patients to phone.", [e("p3.b2", "the online scheduler required 11 steps")]],
  ["cs2", "role", "Personal role, team and timeline are explicit.", [e("p3.b3", "I was the sole designer, partnering with a product manager and two engineers over 10 weeks.")]],
  ["cs2", "decision", "A key decision is shown with the alternative, the test and the result.", [e("p3.b5", "Five of six preferred seeing available times first, so we led with availability")]],
  ["cs2", "metric", "Outcome has a baseline and result for online booking share.", [e("p3.b8", "Online bookings grew from 38% to 61% of all appointments")]],
  ["cs2", "visual", "Comparison image of the two tested flows supports the decision narrative.", [e("p3.b6")]],
  ["cs3", "claim", "Adoption is stated as component count and teams, not product outcomes.", [e("p4.b6", "Orbit now has 60+ components used across 3 product teams.")]],
  ["cs3", "problem", "Problem is stated only as unifying products; no pain or cost of inconsistency is described.", [e("p4.b2", "A component library I built to unify our web and mobile products.")]],
  ["cs3", "decision", "No decisions about the system's structure, tokens or governance are explained.", []],
  ["cs3", "visual", "Most of the case study is component screenshots.", [e("p4.b3"), e("p4.b4"), e("p4.b5")]],
  [null, "structure", "The home page lists Fernway first; Halo Health, the most evidenced case study, is second.", [e("p1.b3"), e("p1.b4")]],
  [null, "role", "About page states 6 years of experience and recent employer.", [e("p5.b2", "I'm a product designer with 6 years of experience")]],
  [null, "collaboration", "No case study describes influencing roadmap or leading beyond the design squad.", []],
];

const observations: Observation[] = obs.map(([cs, category, statement, evidence], i) => ({
  id: `o${i + 1}`, caseStudyId: cs, category, statement, evidence, missing: evidence.length === 0,
}));

function finding(
  id: string, kind: Finding["kind"], dimension: DimensionKey, caseStudyId: string | null, severity: Severity, confidence: Confidence,
  f: Pick<Finding, "title" | "observation" | "evidence" | "whyReviewerCares" | "recommendation"> & { missingEvidence?: string },
): Finding {
  return {
    id, kind, dimension, caseStudyId, severity, confidence, missingEvidence: f.missingEvidence ?? null,
    priorityScore: priorityScore(severity, dimension, confidence), affectedByLimitation: false, ...f,
  };
}

const findings: Finding[] = [
  finding("f1", "gap", "impact_outcomes", "cs1", "critical", "high", {
    title: "Fernway checkout claims a conversion win but shows no evidence of it",
    observation: "The outcome section of your lead case study says the new flow \"improved conversion\" and that stakeholders were thrilled, but gives no number, baseline, or test result.",
    evidence: [e("p2.b16", "improved conversion")],
    missingEvidence: "No conversion rate, baseline, experiment result, or qualitative proof was found for the checkout redesign.",
    whyReviewerCares: "At senior level, reviewers screen for designers who can show their work moved a business metric. An unsupported claim on the first case study reads as either no impact or no measurement — both are red flags.",
    recommendation: "Replace the outcome paragraph with the before/after conversion (or abandonment) rate and the time window. If the number is confidential, use relative change (\"abandonment down ~18% over 6 weeks\") and name how it was measured.",
  }),
  finding("f2", "gap", "decision_quality", "cs1", "high", "high", {
    title: "Fernway shows four iterations but never explains why the final direction won",
    observation: "The Explorations section is four images in a row followed by one sentence naming two alternatives. The reasoning behind choosing the final design is absent.",
    evidence: [e("p2.b14", "We explored a single-page checkout and an accordion layout before landing on the final design."), e("p2.b10"), e("p2.b13")],
    whyReviewerCares: "Hiring managers read case studies to see how you think. A gallery of iterations shows effort, not judgment — they can't tell whether you made the call or why.",
    recommendation: "Cut the gallery to two annotated frames and add 2–3 explicit decision points: the options, the trade-off, and the evidence (e.g. the shipping-cost insight) that picked the winner. Halo Health's \"Key decision\" section is the model to copy.",
  }),
  finding("f3", "gap", "ownership_collaboration", "cs1", "high", "medium", {
    title: "Your personal contribution on Fernway is hidden behind \"we\"",
    observation: "You're titled lead designer, but every action in the case study is attributed to the team (\"We owned…\", \"We ran…\", \"We explored…\").",
    evidence: [e("p2.b4", "We owned checkout end to end."), e("p2.b6", "We ran 8 user interviews and a heuristic review")],
    whyReviewerCares: "Reviewers need to separate your work from the squad's. For a senior role they're specifically looking for what you drove and who you influenced.",
    recommendation: "Add a 3–4 bullet \"What I did\" block under My role (e.g. led the research synthesis, defined the checkout principles, drove the decision to surface shipping early). Switch key sentences to \"I\" where it was your call.",
  }),
  finding("f4", "gap", "storytelling", null, "medium", "medium", {
    title: "Your strongest case study isn't the first one a reviewer sees",
    observation: "Halo Health has the clearest problem, decision and measured outcome in the portfolio, but the home page leads with Fernway, which has the weakest evidence.",
    evidence: [e("p1.b3"), e("p1.b4"), e("p3.b8", "Online bookings grew from 38% to 61% of all appointments")],
    whyReviewerCares: "Many reviewers open only the first case study. It sets the bar for everything that follows.",
    recommendation: "Move Halo Health to the first slot until Fernway's outcome and decisions are fixed.",
  }),
  finding("f5", "gap", "product_thinking", "cs3", "medium", "medium", {
    title: "Orbit reads as a component gallery, not a product decision",
    observation: "The case study is mostly screenshots of components and tokens. The only framing is \"to unify our web and mobile products\", and success is measured as component count.",
    evidence: [e("p4.b2", "A component library I built to unify our web and mobile products."), e("p4.b6", "Orbit now has 60+ components used across 3 product teams.")],
    missingEvidence: "No description of the cost of inconsistency, adoption strategy, or structural decisions (tokens, governance) was found.",
    whyReviewerCares: "Design-system work is valued when it shows systems thinking and organizational influence. Component counts don't show either.",
    recommendation: "Open with the pain (e.g. duplicated effort, inconsistent UI, slow builds), explain 1–2 structural decisions, and report an outcome teams felt (build time, consistency audits, adoption across teams).",
  }),
  finding("s1", "strength", "decision_quality", "cs2", "low", "high", {
    title: "Halo Health is a model senior-level case study",
    observation: "It states a measurable problem, your exact role, a tested decision with the alternative, and a before/after result.",
    evidence: [e("p3.b5", "Five of six preferred seeing available times first, so we led with availability"), e("p3.b8", "Online bookings grew from 38% to 61% of all appointments")],
    whyReviewerCares: "This is exactly the decision → evidence → outcome chain reviewers look for.",
    recommendation: "Use this structure as the template for Fernway and Orbit.",
  }),
  finding("s2", "strength", "ux_reasoning", "cs1", "low", "high", {
    title: "Fernway research produced a specific, actionable insight",
    observation: "Research is summarized as a concrete finding, not just a list of methods.",
    evidence: [e("p2.b8", "surprise shipping costs at the last step made them leave")],
    whyReviewerCares: "Insight-led research signals you use research to make decisions rather than to tick process boxes.",
    recommendation: "Connect this insight explicitly to the final design decision.",
  }),
  finding("s3", "strength", "problem_framing", "cs2", "low", "high", {
    title: "Problems are framed concretely and measurably",
    observation: "Both commerce and healthcare case studies open with a specific, quantified problem.",
    evidence: [e("p3.b2", "the online scheduler required 11 steps"), e("p2.b2", "Checkout abandonment was the highest in the funnel.")],
    whyReviewerCares: "A sharp opening lets a busy reviewer understand the stakes in seconds.",
    recommendation: "Keep this pattern; add it to Orbit.",
  }),
];

export const SAMPLE_REVIEW: Review = {
  id: "sample",
  sample: true,
  createdAt: "2026-09-29T10:00:00.000Z",
  updatedAt: "2026-09-29T10:02:10.000Z",
  input: {
    url: BASE,
    files: [],
    seniority: "senior",
    targetRole: "Senior Product Designer, Growth",
    jobDescription: "Senior Product Designer, Growth. You'll lead design for our acquisition and checkout funnels, partner with PM and data science to run experiments, define success metrics, and contribute to our design system.",
  },
  status: "complete",
  steps: [
    { key: "access", label: "Accessing your portfolio", status: "warning", detail: "1 page couldn't be read" },
    { key: "extract", label: "Reading pages, text and images", status: "done", detail: "5 pages · 15 images · 412 words" },
    { key: "segment", label: "Identifying case studies", status: "done", detail: "3 case studies found (3 primary)" },
    { key: "observe", label: "Extracting evidence from each case study", status: "done", detail: "20 observations" },
    { key: "verify", label: "Checking every quote against your portfolio", status: "done", detail: "20 observations verified" },
    { key: "evaluate", label: "Evaluating against the hiring rubric", status: "done" },
    { key: "assemble", label: "Prioritizing the highest-impact changes", status: "done", detail: "5 priority fixes · 3 strengths" },
  ],
  sources: [{ id: "s1", kind: "url", label: "maya-chen.example", status: "partial", error: "1 of 6 pages could not be fully read" }],
  pages,
  caseStudies,
  observations,
  result: {
    readiness: "needs_work",
    verdict: "Strong foundation with one senior-level case study, but the lead case study doesn't yet prove impact or decision-making.",
    summary: "Halo Health shows exactly what a senior reviewer wants: a measurable problem, a tested decision and a before/after result. Fernway and Orbit don't meet that bar yet — outcomes are claimed rather than evidenced, and iterations are shown without the reasoning behind them.",
    confidence: "high",
    confidenceNote: null,
    priorityNote: "Fix Fernway's outcome and decision sections first — it's the first case study reviewers open and currently your weakest evidence.",
    dimensions: [
      { dimension: "problem_framing", band: "strong", rationale: "Two of three case studies open with a concrete, quantified problem.", strength: "Halo Health's 11-step scheduler problem is specific and measurable.", concern: "Orbit's problem is only \"unify our products\".", evidence: [e("p3.b2", "the online scheduler required 11 steps"), e("p2.b2", "Checkout abandonment was the highest in the funnel.")], confidence: "high" },
      { dimension: "product_thinking", band: "developing", rationale: "Business context is present for Fernway and Halo, but Orbit is presented as output without goals.", strength: "Halo ties design to front-desk load and online share.", concern: "Orbit's success is measured in components, not outcomes.", evidence: [e("p4.b6", "Orbit now has 60+ components used across 3 product teams.")], confidence: "medium" },
      { dimension: "decision_quality", band: "developing", rationale: "One excellent decision narrative (Halo); Fernway shows alternatives without reasoning.", strength: "Halo's time-first vs doctor-first test.", concern: "Fernway's final direction is unexplained.", evidence: [e("p3.b5", "Five of six preferred seeing available times first, so we led with availability"), e("p2.b14", "We explored a single-page checkout and an accordion layout before landing on the final design.")], confidence: "high" },
      { dimension: "ux_reasoning", band: "strong", rationale: "Research leads to specific insights and testing informs decisions.", strength: "Shipping-cost insight; patient preference test.", concern: null, evidence: [e("p2.b8", "surprise shipping costs at the last step made them leave")], confidence: "high" },
      { dimension: "visual_craft", band: "strong", rationale: "Final screens and comparison visuals are polished and consistent; iteration images lack annotation.", strength: "Clear side-by-side comparison in Halo.", concern: "Unannotated iteration gallery in Fernway.", evidence: [e("p3.b6"), e("p2.b13")], confidence: "medium" },
      { dimension: "impact_outcomes", band: "developing", rationale: "Halo has a strong before/after metric; the lead case study only claims improvement.", strength: "38% → 61% online booking share.", concern: "Fernway: \"improved conversion\" with no number.", evidence: [e("p3.b8", "Online bookings grew from 38% to 61% of all appointments"), e("p2.b16", "improved conversion")], confidence: "high" },
      { dimension: "ownership_collaboration", band: "developing", rationale: "Role is explicit on Halo, but Fernway attributes everything to the team and no case study shows influence beyond the squad.", strength: "Halo's role statement.", concern: "\"We\" throughout Fernway.", evidence: [e("p3.b3", "I was the sole designer, partnering with a product manager and two engineers over 10 weeks."), e("p2.b4", "We owned checkout end to end.")], confidence: "medium" },
      { dimension: "storytelling", band: "developing", rationale: "Case studies are short and scannable, but the weakest one is first and Fernway relies on an image gallery.", strength: "Concise, headline-led sections.", concern: "Order and gallery pacing.", evidence: [e("p1.b3"), e("p2.b10")], confidence: "medium" },
    ],
    findings,
    caseStudyReviews: [
      { caseStudyId: "cs1", verdict: "Good problem and research, but the decisions and outcome aren't evidenced.", whatWorks: "Clear business problem and a specific research insight.", whatToFix: "Add the metric, explain why the final direction won, and say what you personally did." },
      { caseStudyId: "cs2", verdict: "Your strongest case study — hiring-ready as written.", whatWorks: "Measurable problem, explicit role, tested decision, before/after result.", whatToFix: "Minor: add one sentence on what you'd do next or what you learned." },
      { caseStudyId: "cs3", verdict: "Shows craft, but not the systems thinking a senior reviewer looks for.", whatWorks: "Polished component documentation.", whatToFix: "Frame the pain, explain structural decisions, and report outcomes teams felt." },
    ],
    roleAlignment: [
      { requirement: "Lead design for acquisition and checkout funnels", status: "partial", note: "Fernway is directly relevant, but its outcome isn't evidenced.", evidence: [e("p2.b2", "Checkout abandonment was the highest in the funnel.")] },
      { requirement: "Run experiments with PM and data science", status: "missing", note: "No A/B test or experiment methodology appears anywhere in the portfolio.", evidence: [] },
      { requirement: "Define success metrics", status: "partial", note: "Halo defines and reports a metric; Fernway and Orbit don't.", evidence: [e("p3.b8", "Online bookings grew from 38% to 61% of all appointments")] },
      { requirement: "Contribute to the design system", status: "evidenced", note: "Orbit shows direct design-system ownership.", evidence: [e("p4.b2", "A component library I built to unify our web and mobile products.")] },
    ],
    limitations: ["\"Playground\" was not reviewed — little readable content — the page may need JavaScript to render"],
  },
};
