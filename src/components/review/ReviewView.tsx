"use client";

import { useEffect, useState } from "react";
import type { Review } from "@/lib/types";
import { Progress } from "./Progress";
import { ErrorState } from "./ErrorState";
import { Report } from "./Report";

// Polls while the pipeline runs; progress is written to the review after every step.
export function ReviewView({ initial }: { initial: Review }) {
  const [review, setReview] = useState(initial);
  const running = review.status === "queued" || review.status === "processing";

  useEffect(() => {
    if (!running) return;
    const t = setInterval(async () => {
      const res = await fetch(`/api/reviews/${review.id}`, { cache: "no-store" });
      if (res.ok) setReview(await res.json());
    }, 1200);
    return () => clearInterval(t);
  }, [running, review.id]);

  if (review.status === "failed") return <ErrorState review={review} />;
  if (running || !review.result) return <Progress review={review} />;
  return <Report review={review} />;
}
