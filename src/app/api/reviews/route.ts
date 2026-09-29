import { after, NextResponse } from "next/server";
import { fileMediaType } from "@/lib/ingest/files";
import { initialSteps, runReview } from "@/lib/pipeline/run";
import { CLOUD, newId, saveReview, saveUpload, uploadSize } from "@/lib/store";
import type { Review, Seniority } from "@/lib/types";

export const runtime = "nodejs";
// The review keeps running after the response (see after() below); allow up to 5 minutes.
export const maxDuration = 300;

const MAX_FILE_BYTES = 30 * 1024 * 1024;
const SENIORITIES: Seniority[] = ["junior", "mid", "senior", "lead"];

export async function POST(req: Request) {
  const form = await req.formData();
  const url = String(form.get("url") ?? "").trim();
  const seniority = String(form.get("seniority") ?? "mid") as Seniority;
  const targetRole = String(form.get("targetRole") ?? "").trim().slice(0, 120);
  const jobDescription = String(form.get("jobDescription") ?? "").trim().slice(0, 20000);
  const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  // In the cloud the browser uploads to Blob first and sends [{ name, pathname }] here.
  let uploaded: { name: string; pathname: string }[] = [];
  try {
    uploaded = JSON.parse(String(form.get("uploaded") ?? "[]"));
    if (!Array.isArray(uploaded)) uploaded = [];
  } catch { /* treat as none */ }
  if (uploaded.length && !CLOUD) return NextResponse.json({ error: "File storage isn't configured." }, { status: 400 });

  if (!url && !files.length && !uploaded.length) return NextResponse.json({ error: "Add a portfolio URL or upload at least one file." }, { status: 400 });
  if (!SENIORITIES.includes(seniority)) return NextResponse.json({ error: "Unknown seniority." }, { status: 400 });
  for (const f of files) {
    if (!fileMediaType(f.name)) return NextResponse.json({ error: `${f.name}: upload a PDF, PNG, JPG or WebP.` }, { status: 400 });
    if (f.size > MAX_FILE_BYTES) return NextResponse.json({ error: `${f.name} is larger than 30 MB.` }, { status: 400 });
  }

  const id = newId();
  const stored = [];
  for (const f of files) stored.push({ name: f.name, size: f.size, storedAs: await saveUpload(id, f.name, Buffer.from(await f.arrayBuffer())) });
  for (const u of uploaded.slice(0, 6)) {
    const name = String(u?.name ?? "").slice(0, 200);
    const size = await uploadSize(String(u?.pathname ?? ""));
    if (size === null || !fileMediaType(name)) return NextResponse.json({ error: `${name || "A file"} didn't upload correctly. Try adding it again.` }, { status: 400 });
    stored.push({ name, size, storedAs: u.pathname });
  }

  const now = new Date().toISOString();
  const review: Review = {
    id, createdAt: now, updatedAt: now, status: "queued", steps: initialSteps(),
    input: { url: url || undefined, files: stored, seniority, targetRole: targetRole || "Product Designer", jobDescription: jobDescription || undefined },
    sources: [], pages: [], caseStudies: [], observations: [],
  };
  await saveReview(review);
  after(() => runReview(id)); // runs after the response; the client polls for progress
  return NextResponse.json({ id });
}
