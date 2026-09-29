import { NextResponse } from "next/server";
import { getReview } from "@/lib/store";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const review = await getReview((await params).id);
  if (!review) return NextResponse.json({ error: "Review not found." }, { status: 404 });
  return NextResponse.json(review, { headers: { "cache-control": "no-store" } });
}
