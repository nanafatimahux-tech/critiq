import { after, NextResponse } from "next/server";
import { initialSteps, runReview } from "@/lib/pipeline/run";
import { getReview, newId, saveReview } from "@/lib/store";

export const runtime = "nodejs";
export const maxDuration = 300;

// Re-review the same inputs (e.g. after the designer updates their site).
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const prev = await getReview((await params).id);
  if (!prev || prev.sample) return NextResponse.json({ error: "Review not found." }, { status: 404 });
  const id = newId();
  const now = new Date().toISOString();
  await saveReview({
    id, createdAt: now, updatedAt: now, status: "queued", steps: initialSteps(), input: prev.input,
    sources: [], pages: [], caseStudies: [], observations: [],
  });
  after(() => runReview(id));
  return NextResponse.json({ id });
}
