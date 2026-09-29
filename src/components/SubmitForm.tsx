"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ArrowRight, FileText, Globe, ImageIcon, Loader2, Paperclip, Plus, X } from "./icons";
import { Button, cx } from "./ui";
import { SENIORITY } from "@/lib/rubric";
import type { Seniority } from "@/lib/types";

const ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp";
const MAX_FILES = 6;
const PILL = "inline-flex h-10 items-center gap-2 rounded-full border border-line bg-surface px-3.5 text-sm md:h-9";

// Manus-style composer: one large input, tools along the bottom edge, and a
// single solid send action. The whole card is the drop target for files.
export function SubmitForm({ className }: { className?: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [role, setRole] = useState("Product Designer");
  const [seniority, setSeniority] = useState<Seniority>("mid");
  const [showJd, setShowJd] = useState(false);
  const [jd, setJd] = useState("");
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    setFiles((prev) => [...prev, ...Array.from(list)].slice(0, MAX_FILES));
    setError(null);
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() && !files.length) {
      setError("Add a portfolio link or upload a file to start your review.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const fd = new FormData();
    fd.set("url", url);
    fd.set("targetRole", role);
    fd.set("seniority", seniority);
    if (showJd) fd.set("jobDescription", jd);
    files.forEach((f) => fd.append("files", f));
    try {
      const res = await fetch("/api/reviews", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't start your review. Check your connection and try again.");
      router.push(`/reviews/${data.id}`);
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className={className}>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
        className={cx(
          "rounded-3xl border bg-surface shadow-card transition-colors focus-within:border-line-strong",
          dragging ? "border-dashed border-ink" : "border-line",
        )}
      >
        <label htmlFor="url" className="sr-only">Portfolio link</label>
        <div className="flex items-center gap-3 px-5 pt-5">
          <Globe className="size-5 shrink-0 text-subtle" aria-hidden />
          <input
            id="url" value={url} onChange={(e) => { setUrl(e.target.value); setError(null); }}
            placeholder="Paste your portfolio link" inputMode="url" autoComplete="url"
            className="h-10 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-subtle sm:text-lg"
          />
        </div>
        <p className="px-5 pt-1 pl-13 text-xs text-subtle">
          {dragging ? "Drop to attach" : "Or drop a PDF or case-study images here — PDF, PNG, JPG or WebP, up to 30 MB each"}
        </p>

        {files.length > 0 && (
          <ul className="flex flex-wrap gap-2 px-5 pt-3">
            {files.map((f, i) => (
              <li key={i} className="flex min-w-0 items-center gap-1.5 rounded-full border border-line bg-surface-2 py-1 pr-1 pl-2.5 text-xs">
                {f.type === "application/pdf" ? <FileText className="size-3.5 shrink-0" /> : <ImageIcon className="size-3.5 shrink-0" />}
                <span className="max-w-[180px] truncate" title={f.name}>{f.name}</span>
                <button type="button" aria-label={`Remove ${f.name}`} onClick={() => setFiles(files.filter((_, j) => j !== i))} className="rounded-full p-1 text-subtle hover:bg-surface hover:text-ink">
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {showJd && (
          <div className="mx-5 mt-4 border-t border-line pt-4">
            <div className="flex items-center justify-between">
              <label htmlFor="jd" className="text-sm font-medium">Job description <span className="font-normal text-subtle">(optional)</span></label>
              <button type="button" onClick={() => { setShowJd(false); setJd(""); }} className="text-xs text-muted hover:text-ink">Remove job description</button>
            </div>
            <textarea id="jd" value={jd} onChange={(e) => setJd(e.target.value)} rows={4}
              placeholder="Paste the full job description. We'll check how well your portfolio evidences what the role asks for."
              className="mt-2 w-full resize-y rounded-xl border border-line bg-surface-2 px-3 py-2 text-base outline-none placeholder:text-subtle focus:border-line-strong md:text-sm" />
          </div>
        )}

        {/* Tool row: wraps on mobile, send button drops to its own full-width row. */}
        <div className="flex flex-wrap items-center gap-2 p-4 pt-5 sm:p-5">
          <label className={cx(PILL, "w-full min-w-0 focus-within:border-line-strong sm:w-auto")}>
            <span className="font-mono text-xs text-subtle uppercase">Role</span>
            <input value={role} onChange={(e) => setRole(e.target.value)} aria-label="Target role"
              className="min-w-0 flex-1 bg-transparent text-base outline-none sm:w-36 sm:flex-none md:text-sm" />
          </label>
          <label className={cx(PILL, "w-full focus-within:border-line-strong sm:w-auto")}>
            <span className="font-mono text-xs text-subtle uppercase">Seniority</span>
            <select value={seniority} onChange={(e) => setSeniority(e.target.value as Seniority)} aria-label="Seniority"
              className="min-w-0 flex-1 bg-transparent text-base outline-none md:text-sm">
              {(Object.keys(SENIORITY) as Seniority[]).map((s) => <option key={s} value={s}>{SENIORITY[s].label}</option>)}
            </select>
          </label>
          <button type="button" onClick={() => inputRef.current?.click()} className={cx(PILL, "text-muted hover:text-ink")} disabled={files.length >= MAX_FILES}>
            <Paperclip className="size-4" /> Attach
          </button>
          <input ref={inputRef} type="file" accept={ACCEPT} multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
          {!showJd && (
            <button type="button" onClick={() => setShowJd(true)} className={cx(PILL, "text-muted hover:text-ink")}>
              <Plus className="size-4" /> Job description
            </button>
          )}
          <Button type="submit" disabled={submitting} className="h-11 w-full sm:ml-auto sm:w-auto md:h-10">
            {submitting ? <><Loader2 className="size-4 animate-spin" /> Starting review…</> : <>Start review <ArrowRight className="size-4" /></>}
          </Button>
        </div>
      </div>
      {error && <p role="alert" className="mt-3 rounded-xl bg-crit-soft px-4 py-2.5 text-sm text-crit">{error}</p>}
    </form>
  );
}
