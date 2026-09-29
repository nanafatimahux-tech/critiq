import { NextResponse } from "next/server";
import { getReview, saveReview } from "@/lib/store";
import type { FeedbackKind } from "@/lib/types";

const KINDS: FeedbackKind[] = ["useful", "generic", "incorrect"];

// Per-finding feedback. Stored on the finding so it can later feed reviewer calibration.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { findingId?: string; kind?: FeedbackKind; note?: string };
  const review = await getReview(id);
  if (!review?.result) return NextResponse.json({ error: "Review not found." }, { status: 404 });
  const finding = review.result.findings.find((f) => f.id === body.findingId);
  if (!finding || !body.kind || !KINDS.includes(body.kind)) return NextResponse.json({ error: "Invalid feedback." }, { status: 400 });
  finding.feedback = { kind: body.kind, note: body.note?.slice(0, 2000), at: new Date().toISOString() };
  if (!review.sample) await saveReview(review);
  return NextResponse.json({ ok: true, feedback: finding.feedback });
}
