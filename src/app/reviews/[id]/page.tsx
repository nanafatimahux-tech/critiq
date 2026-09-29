import { notFound } from "next/navigation";
import { getReview } from "@/lib/store";
import { ReviewView } from "@/components/review/ReviewView";

export const dynamic = "force-dynamic";

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const review = await getReview((await params).id);
  if (!review) notFound();
  return <ReviewView initial={review} />;
}
