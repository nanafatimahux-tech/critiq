import Anthropic from "@anthropic-ai/sdk";
import type { BetaContentBlockParam } from "@anthropic-ai/sdk/resources/beta/messages/messages";
import { crawlPortfolio, CrawlError } from "../ingest/crawl";
import { fileMediaType, ingestFile } from "../ingest/files";
import { DIMENSIONS, SENIORITY, evidenceStats, priorityScore } from "../rubric";
import { getReview, readUpload, saveReview } from "../store";
import type {
  CaseStudy, EvidenceRef, Finding, Observation, Page, Review, ReviewError, Step, StepKey,
} from "../types";
import {
  AIError, EvaluateSchema, OBSERVE_SYSTEM, ObserveSchema, SEGMENT_SYSTEM, SegmentSchema,
  evaluateSystem, isAuthError, structured,
} from "./llm";
import { blockIndex, quoteInBlock } from "./verify";

export const STEP_LABELS: Record<StepKey, string> = {
  access: "Accessing your portfolio",
  extract: "Reading pages, text and images",
  segment: "Identifying case studies",
  observe: "Extracting evidence from each case study",
  verify: "Checking every quote against your portfolio",
  evaluate: "Evaluating against the hiring rubric",
  assemble: "Prioritizing the highest-impact changes",
};

export function initialSteps(): Step[] {
  return (Object.keys(STEP_LABELS) as StepKey[]).map((key) => ({ key, label: STEP_LABELS[key], status: "pending" }));
}

const MAX_IMAGES_PER_CALL = 8;

class Runner {
  constructor(public review: Review) {}

  async step(key: StepKey, status: Step["status"], detail?: string) {
    const s = this.review.steps.find((x) => x.key === key)!;
    s.status = status;
    if (detail !== undefined) s.detail = detail;
    await saveReview(this.review);
  }

  async fail(error: ReviewError, at: StepKey) {
    this.review.status = "failed";
    this.review.error = error;
    await this.step(at, "failed");
  }
}

export async function runReview(id: string) {
  const review = await getReview(id);
  if (!review) return;
  const r = new Runner(review);
  review.status = "processing";
  let current: StepKey = "access";
  try {
    /* 1. Access + extract */
    await r.step("access", "active");
    const pages: Page[] = [];
    const fileData = new Map<string, { name: string; data: Buffer; media: string }>();
    let urlFailure: CrawlError | null = null;
    let s = 0;

    if (review.input.url) {
      try {
        const { source, pages: crawled } = await crawlPortfolio(review.input.url, `s${++s}`, pages.length);
        review.sources.push(source);
        pages.push(...crawled);
      } catch (err) {
        if (!(err instanceof CrawlError)) throw err;
        urlFailure = err;
        review.sources.push({ id: `s${++s}`, kind: "url", label: review.input.url, status: "failed", error: err.reasons[0] });
      }
    }
    for (const f of review.input.files) {
      const data = await readUpload(f.storedAs);
      const sourceId = `s${++s}`;
      const { source, pages: filePages } = await ingestFile(f.name, data, sourceId, pages.length);
      review.sources.push(source);
      pages.push(...filePages);
      fileData.set(sourceId, { name: f.name, data, media: fileMediaType(f.name) });
    }
    review.pages = pages;

    if (urlFailure && !review.input.files.length) {
      return r.fail({ code: "url_inaccessible", title: urlFailure.message, message: "Upload a PDF export of your portfolio instead, or check that the link is public.", reasons: urlFailure.reasons }, "access");
    }
    const readable = pages.filter((p) => p.status === "reviewed");
    if (!readable.length) {
      return r.fail({ code: "no_content", title: "We couldn't find any readable portfolio content.", message: "Every page we tried was empty, password-protected, or couldn't be parsed.", reasons: review.sources.map((x) => x.error).filter(Boolean) as string[] }, "access");
    }
    const failedCount = pages.length - readable.length;
    await r.step("access", urlFailure || failedCount ? "warning" : "done",
      urlFailure ? "Portfolio URL was inaccessible — reviewing uploaded files only" : failedCount ? `${failedCount} page${failedCount > 1 ? "s" : ""} couldn't be read` : undefined);

    current = "extract";
    const stats = evidenceStats({ pages, caseStudies: [] });
    await r.step("extract", "done", `${stats.pages} pages · ${stats.images} images · ${stats.words.toLocaleString("en-US")} words`);

    /* 2. Segment */
    current = "segment";
    await r.step("segment", "active");
    const pageList = readable
      .map((p) => {
        const heads = p.blocks.filter((b) => b.kind === "heading").slice(0, 6).map((b) => b.text).join(" | ");
        const lead = p.blocks.filter((b) => b.kind === "text").slice(0, 2).map((b) => b.text).join(" ").slice(0, 300);
        return `[${p.id}] "${p.title}" ${p.url ?? `(file page ${p.pageNumber})`} — ${p.wordCount} words, ${p.imageCount} images\n  headings: ${heads}\n  opening: ${lead}`;
      })
      .join("\n");
    const seg = await structured({
      schema: SegmentSchema, system: SEGMENT_SYSTEM, effort: "low",
      content: [{ type: "text", text: `Pages:\n${pageList}` }],
    });
    const validIds = new Set(readable.map((p) => p.id));
    for (const pr of seg.pageRoles) {
      const p = pages.find((x) => x.id === pr.pageId);
      if (p) p.role = pr.role;
    }
    review.caseStudies = seg.caseStudies
      .map((c, i): CaseStudy => ({ id: `cs${i + 1}`, title: c.title, summary: c.summary, primary: c.primary, pageIds: c.pageIds.filter((id) => validIds.has(id)) }))
      .filter((c) => c.pageIds.length);
    for (const c of review.caseStudies) for (const pid of c.pageIds) {
      const p = pages.find((x) => x.id === pid);
      if (p) p.caseStudyId = c.id;
    }
    const primaryCount = review.caseStudies.filter((c) => c.primary).length;
    await r.step("segment", review.caseStudies.length ? "done" : "warning",
      review.caseStudies.length ? `${review.caseStudies.length} case stud${review.caseStudies.length > 1 ? "ies" : "y"} found (${primaryCount} primary)` : "No clear case studies found");

    /* 3. Observe */
    current = "observe";
    await r.step("observe", "active", `0 of ${review.caseStudies.length + 1} sections`);
    const byId = blockIndex(pages.flatMap((p) => p.blocks));
    const groups: { cs: CaseStudy | null; pages: Page[] }[] = review.caseStudies.map((cs) => ({
      cs, pages: cs.pageIds.map((id) => pages.find((p) => p.id === id)!).filter(Boolean),
    }));
    const loose = readable.filter((p) => !p.caseStudyId);
    if (loose.length) groups.push({ cs: null, pages: loose });

    let done = 0;
    const raw = await Promise.all(
      groups.map(async (g) => {
        const out = await observeGroup(g.cs, g.pages, fileData);
        done++;
        await r.step("observe", "active", `${done} of ${groups.length} sections`);
        return out.map((o) => ({ ...o, caseStudyId: g.cs?.id ?? null }));
      }),
    );
    const totalRaw = raw.flat().length;
    await r.step("observe", "done", `${totalRaw} observations`);

    /* 4. Verify */
    current = "verify";
    await r.step("verify", "active");
    const observations: Observation[] = [];
    let rejected = 0;
    for (const o of raw.flat()) {
      if (o.missing) {
        observations.push({ id: "", caseStudyId: o.caseStudyId, category: o.category, statement: o.statement, evidence: [], missing: true });
        continue;
      }
      const block = o.blockId ? byId.get(o.blockId) : undefined;
      if (!block) { rejected++; continue; }
      let ev: EvidenceRef;
      if (o.quote && block.kind !== "image" && block.kind !== "page") {
        if (!quoteInBlock(o.quote, block)) { rejected++; continue; }
        ev = { blockId: block.id, quote: o.quote, verified: true };
      } else {
        ev = { blockId: block.id, quote: "", verified: true };
      }
      observations.push({ id: "", caseStudyId: o.caseStudyId, category: o.category, statement: o.statement, evidence: [ev], missing: false });
    }
    observations.forEach((o, i) => (o.id = `o${i + 1}`));
    review.observations = observations;
    await r.step("verify", rejected ? "warning" : "done",
      rejected ? `${observations.length} verified · ${rejected} discarded (quote not found in portfolio)` : `${observations.length} observations verified`);

    /* 5. Evaluate */
    current = "evaluate";
    await r.step("evaluate", "active");
    const sen = SENIORITY[review.input.seniority];
    const rubricText = DIMENSIONS.map((d) => `- ${d.key} (${d.label}): ${d.question}\n  major_gap: ${d.rubric.major_gap}\n  developing: ${d.rubric.developing}\n  strong: ${d.rubric.strong}\n  excellent: ${d.rubric.excellent}`).join("\n");
    const csText = review.caseStudies.map((c) => `${c.id}: "${c.title}" (${c.primary ? "primary" : "secondary"}) — ${c.summary}`).join("\n") || "(none identified)";
    const obsText = observations.map((o) => {
      const ev = o.missing ? "MISSING" : o.evidence[0].quote ? `${o.evidence[0].blockId} "${o.evidence[0].quote}"` : `${o.evidence[0].blockId} (visual)`;
      return `[${o.id}] ${o.caseStudyId ?? "portfolio"} · ${o.category} · ${o.statement} — ${ev}`;
    }).join("\n");
    const allStats = evidenceStats(review);
    const limitations = buildLimitations(review, rejected);
    const evalInput = [
      `Target role: ${review.input.targetRole || "Product Designer"} (${sen.label})`,
      `Evidence reviewed: ${allStats.pages} pages, ${allStats.caseStudies} case studies, ${allStats.images} images, ${allStats.words} words.`,
      limitations.length ? `Limitations:\n- ${limitations.join("\n- ")}` : "",
      `Case studies:\n${csText}`,
      `Observations:\n${obsText}`,
      review.input.jobDescription ? `Job description:\n${review.input.jobDescription.slice(0, 12000)}` : "No job description provided — roleAlignment must be null.",
    ].filter(Boolean).join("\n\n");
    const ev = await structured({
      schema: EvaluateSchema, effort: "high",
      system: evaluateSystem(sen.label, sen.expectation, rubricText),
      content: [{ type: "text", text: evalInput }],
    });
    await r.step("evaluate", "done");

    /* 6. Assemble: map ids → evidence, prioritize deterministically */
    current = "assemble";
    await r.step("assemble", "active");
    const obsById = new Map(observations.map((o) => [o.id, o]));
    const evidenceFor = (ids: string[]) => {
      const seen = new Set<string>();
      const refs: EvidenceRef[] = [];
      for (const id of ids) for (const e of obsById.get(id)?.evidence ?? []) {
        const k = e.blockId + e.quote;
        if (!seen.has(k)) { seen.add(k); refs.push(e); }
      }
      return refs;
    };
    const missingFor = (ids: string[]) => ids.map((id) => obsById.get(id)).filter((o) => o?.missing).map((o) => o!.statement);
    const limitedCs = new Set(review.caseStudies.filter((c) => c.pageIds.some((id) => {
      const p = pages.find((x) => x.id === id);
      return !p || p.status !== "reviewed" || !!p.reason;
    })).map((c) => c.id));
    const csIds = new Set(review.caseStudies.map((c) => c.id));

    const findings: Finding[] = ev.findings
      .map((f, i): Finding | null => {
        const evidence = evidenceFor(f.observationIds);
        const missing = f.missingEvidence ?? (missingFor(f.observationIds).join(" ") || null);
        if (!evidence.length && !missing) return null; // ungrounded → dropped
        const caseStudyId = f.caseStudyId && csIds.has(f.caseStudyId) ? f.caseStudyId : null;
        return {
          id: `f${i + 1}`, kind: f.kind, title: f.title, dimension: f.dimension, caseStudyId,
          observation: f.observation, evidence, missingEvidence: missing,
          whyReviewerCares: f.whyReviewerCares, recommendation: f.recommendation,
          severity: f.severity, confidence: f.confidence,
          priorityScore: priorityScore(f.severity, f.dimension, f.confidence),
          affectedByLimitation: !!caseStudyId && limitedCs.has(caseStudyId),
        };
      })
      .filter((f): f is Finding => !!f);
    const gaps = findings.filter((f) => f.kind === "gap").sort((a, b) => b.priorityScore - a.priorityScore || a.id.localeCompare(b.id)).slice(0, 5);
    const strengths = findings.filter((f) => f.kind === "strength").slice(0, 3);

    const dims = DIMENSIONS.map((d) => {
      const x = ev.dimensions.find((y) => y.dimension === d.key);
      if (!x) return { dimension: d.key, band: "not_assessable" as const, rationale: "The reviewer could not assess this dimension from the available evidence.", strength: null, concern: null, evidence: [], confidence: "low" as const };
      return { dimension: d.key, band: x.band, rationale: x.rationale, strength: x.strength, concern: x.concern, evidence: evidenceFor(x.observationIds), confidence: x.confidence };
    });

    review.result = {
      verdict: ev.verdict, readiness: ev.readiness, summary: ev.summary,
      confidence: ev.confidence, confidenceNote: ev.confidenceNote, priorityNote: ev.priorityNote,
      dimensions: dims, findings: [...gaps, ...strengths],
      caseStudyReviews: ev.caseStudyReviews.filter((c) => csIds.has(c.caseStudyId)),
      roleAlignment: review.input.jobDescription && ev.roleAlignment
        ? ev.roleAlignment.map((a) => ({ requirement: a.requirement, status: a.status, note: a.note, evidence: evidenceFor(a.observationIds) }))
        : null,
      limitations,
    };
    review.status = "complete";
    await r.step("assemble", "done", `${gaps.length} priority fixes · ${strengths.length} strengths`);
  } catch (err) {
    console.error(`[review ${id}] failed at ${current}:`, err);
    if (isAuthError(err)) {
      return r.fail({ code: "ai_unavailable", title: "The AI reviewer isn't configured.", message: "Set ANTHROPIC_API_KEY in .env.local and restart the server.", reasons: [] }, current);
    }
    const msg = err instanceof AIError || err instanceof Anthropic.APIError ? err.message : "An unexpected error occurred.";
    return r.fail({ code: err instanceof Anthropic.APIError ? "ai_unavailable" : "internal", title: "The review couldn't be completed.", message: msg, reasons: [] }, current);
  }
}

function buildLimitations(review: Review, rejected: number) {
  const out: string[] = [];
  for (const s of review.sources) if (s.error) out.push(`${s.label}: ${s.error}`);
  const failed = review.pages.filter((p) => p.status !== "reviewed");
  for (const p of failed.slice(0, 6)) out.push(`"${p.title}" was not reviewed — ${(p.reason ?? "could not be read").replace(/^\w/, (c) => c.toLowerCase())}`);
  if (failed.length > 6) out.push(`…and ${failed.length - 6} more pages`);
  if (rejected) out.push(`${rejected} extracted observation${rejected > 1 ? "s were" : " was"} discarded because the quote could not be matched to your portfolio.`);
  return out;
}

async function observeGroup(
  cs: CaseStudy | null,
  pages: Page[],
  fileData: Map<string, { name: string; data: Buffer; media: string }>,
) {
  const text = pages.map((p) => {
    const lines = p.blocks.map((b) =>
      b.kind === "image" ? `[${b.id}] (image) ${b.text ? `alt: "${b.text}"` : "no alt text"}`
        : b.kind === "page" ? `[${b.id}] (whole PDF page — cite for visual observations about this page)`
          : `[${b.id}] (${b.kind}) ${b.text}`);
    return `## [${p.id}] ${p.title}${p.url ? ` — ${p.url}` : p.pageNumber ? ` — file page ${p.pageNumber}` : ""}\n${lines.join("\n")}`;
  }).join("\n\n");

  const header: BetaContentBlockParam = {
    type: "text",
    text: `${cs ? `Case study: "${cs.title}" — ${cs.summary}` : "Portfolio-level pages (home, about, resume, other). Focus on role, positioning and how the portfolio presents the designer."}\n\n${text}`,
  };

  const attachments: BetaContentBlockParam[] = [];
  const urlImages: BetaContentBlockParam[] = [];
  const sourceIds = new Set(pages.map((p) => p.sourceId));
  for (const sid of sourceIds) {
    const f = fileData.get(sid);
    if (!f) continue;
    const pageMap = pages.filter((p) => p.sourceId === sid).map((p) => `file page ${p.pageNumber} = [${p.id}.b${p.blocks[0]?.kind === "page" ? 0 : 1}]`).join(", ");
    if (f.media === "application/pdf") {
      attachments.push({ type: "text", text: `Attached PDF "${f.name}". Relevant pages: ${pageMap}.` });
      attachments.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: f.data.toString("base64") } });
    } else if (f.media) {
      attachments.push({ type: "text", text: `Uploaded image — block [${pages.find((p) => p.sourceId === sid)!.id}.b1]:` });
      attachments.push({ type: "image", source: { type: "base64", media_type: f.media as "image/png" | "image/jpeg" | "image/webp", data: f.data.toString("base64") } });
    }
  }
  for (const b of pages.flatMap((p) => p.blocks).filter((b) => b.kind === "image" && b.src && /\.(png|jpe?g|webp|gif)(\?|$)/i.test(b.src)).slice(0, MAX_IMAGES_PER_CALL)) {
    urlImages.push({ type: "text", text: `Image [${b.id}]:` });
    urlImages.push({ type: "image", source: { type: "url", url: b.src! } });
  }

  const run = (withUrlImages: boolean) =>
    structured({ schema: ObserveSchema, system: OBSERVE_SYSTEM, effort: "medium", content: [...attachments, ...(withUrlImages ? urlImages : []), header] });
  try {
    return (await run(urlImages.length > 0)).observations;
  } catch (err) {
    // An image URL the API can't fetch fails the whole request — retry text-only.
    if (urlImages.length && err instanceof Anthropic.BadRequestError) return (await run(false)).observations;
    throw err;
  }
}
