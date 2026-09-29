"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertCircle, RotateCw, Upload } from "../icons";
import { Button, Card, TopBar } from "../ui";
import { InputSummary } from "./Progress";
import type { Review } from "@/lib/types";

export function ErrorState({ review }: { review: Review }) {
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);
  const err = review.error ?? { code: "internal", title: "The review couldn't be completed.", message: "", reasons: [] };

  async function retry() {
    setRetrying(true);
    const res = await fetch(`/api/reviews/${review.id}/rerun`, { method: "POST" });
    const data = await res.json();
    if (res.ok) router.push(`/reviews/${data.id}`);
    else setRetrying(false);
  }

  const urlProblem = err.code === "url_inaccessible" || err.code === "no_content";
  return (
    <>
      <TopBar />
      <main className="mx-auto max-w-[560px] px-4 py-12 sm:py-20">
        <Card className="p-6 sm:p-8">
          <span className="grid size-10 place-items-center rounded-full bg-crit-soft text-crit"><AlertCircle className="size-5" /></span>
          <h1 className="mt-4 font-serif text-2xl tracking-tight">{err.title}</h1>
          <div className="mt-2"><InputSummary review={review} /></div>

          {err.reasons.length > 0 && (
            <div className="mt-5">
              <p className="text-sm font-medium">Possible reasons</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
                {err.reasons.map((r) => <li key={r}>{r}</li>)}
              </ul>
            </div>
          )}
          {err.message && <p className="mt-5 text-sm text-muted">{err.message}</p>}

          <div className="mt-7 flex flex-col gap-2 sm:flex-row">
            {urlProblem ? (
              <>
                <Link href="/" className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-accent px-4 text-sm font-medium text-on-accent hover:bg-accent-hover">
                  <Upload className="size-4" /> Upload a PDF instead
                </Link>
                <Button variant="secondary" onClick={retry} disabled={retrying} className="h-10"><RotateCw className="size-4" /> Try the link again</Button>
              </>
            ) : (
              <>
                <Button onClick={retry} disabled={retrying} className="h-10 flex-1"><RotateCw className="size-4" /> Try again</Button>
                <Link href="/" className="inline-flex h-10 items-center justify-center rounded-full border border-line-strong px-4 text-sm font-medium hover:bg-surface-2">Start over</Link>
              </>
            )}
          </div>
        </Card>
      </main>
    </>
  );
}
