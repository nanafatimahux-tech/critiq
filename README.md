# Critiq

Evidence-based portfolio reviews for product and UX designers. Critiq reads a
portfolio (URL, PDF, or images), and produces a hiring-manager-style review
where every finding points back to the exact page, quote, or image it's based on.

## Run it

Requires Node 20+ (this machine has it at `~/.local/node/bin`).

```bash
cp .env.example .env.local   # then add your ANTHROPIC_API_KEY
npm install
npm run dev
```

Open http://localhost:3000. `/reviews/sample` shows a complete sample review
and works without an API key.

## How a review works

```
Ingest → Portfolio model → Segment → Observe → Verify → Evaluate → Prioritize
```

| Stage | Where | What it does |
|---|---|---|
| Ingest | `src/lib/ingest/` | Crawls the URL (same site, depth 2, ≤20 pages, respects robots.txt) and extracts PDFs/images into `Page → Block` records with stable ids like `p3.b12`. Unreadable/password pages are logged, never silently dropped. |
| Segment | `pipeline/run.ts` + `llm.ts` | Claude classifies pages and groups them into case studies. |
| Observe | `llm.ts` `OBSERVE_SYSTEM` | Per case study (in parallel): neutral observations, each with a block id + verbatim quote, or an explicit `missing` record. Images/PDF pages are sent for visual review. |
| Verify | `pipeline/verify.ts` | Code checks every quote appears in the cited block. Unmatched observations are discarded and counted as a limitation. |
| Evaluate | `llm.ts` `evaluateSystem` | Fixed 8-dimension rubric (`src/lib/rubric.ts`), conditioned on seniority and optional job description. Output cites observation ids only. |
| Prioritize | `pipeline/run.ts` | Deterministic ranking: severity × dimension weight × confidence. Findings with no evidence and no stated missing evidence are dropped. |

Model: `claude-opus-5-5` via structured outputs, with server-side refusal
fallback enabled (`fallbacks: "default"`).

Storage is JSON files in `.data/` (reviews + uploads) — swap `src/lib/store.ts`
for Postgres when adding accounts.

## Not built yet

- Version comparison between re-reviews (Re-review exists; diff view doesn't)
- JavaScript-rendered portfolios (Framer/Webflow sites that render client-side) — needs a headless browser (Playwright)
- Accounts, sharing, "ask about this finding" chat
