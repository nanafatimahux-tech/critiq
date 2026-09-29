import Link from "next/link";
import type { ReactNode } from "react";
import { BAND_META } from "@/lib/rubric";
import type { Band, Confidence, Severity } from "@/lib/types";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-ink">
      <span className="grid size-7 place-items-center rounded-lg bg-accent font-serif text-lg leading-none text-on-accent">C</span>
      Critiq
    </Link>
  );
}

export function TopBar({ children }: { children?: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <div className="flex items-center gap-2">{children}</div>
      </div>
    </header>
  );
}

export function Card({ children, className, id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={cx("rounded-2xl border border-line bg-surface shadow-card", className)}>
      {children}
    </section>
  );
}

// Mono uppercase label for metadata and counters (Codecademy).
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx("font-mono text-xs font-medium tracking-wider text-muted uppercase", className)}>{children}</p>;
}

export function SectionTitle({ title, subtitle, right, eyebrow }: { title: string; subtitle?: string; right?: ReactNode; eyebrow?: string }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
      <div>
        {eyebrow && <Eyebrow className="mb-1">{eyebrow}</Eyebrow>}
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

const BAND_CLASS: Record<Band, string> = {
  major_gap: "bg-gap-soft text-gap",
  developing: "bg-dev-soft text-dev",
  strong: "bg-strong-soft text-strong",
  excellent: "bg-exc-soft text-exc",
  not_assessable: "bg-na-soft text-na",
};
export const BAND_BAR: Record<Band, string> = {
  major_gap: "bg-gap",
  developing: "bg-dev",
  strong: "bg-strong",
  excellent: "bg-exc",
  not_assessable: "bg-line-strong",
};

export function BandPill({ band }: { band: Band }) {
  return (
    <span className={cx("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap", BAND_CLASS[band])}>
      {BAND_META[band].label}
    </span>
  );
}

const SEV_CLASS: Record<Severity, string> = {
  critical: "border-crit/30 bg-crit-soft text-crit",
  high: "border-gap/30 bg-gap-soft text-gap",
  medium: "border-dev/30 bg-dev-soft text-dev",
  low: "border-line-strong bg-na-soft text-na",
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className={cx("inline-flex items-center rounded-full border px-2 py-px font-mono text-xs font-medium tracking-wider uppercase", SEV_CLASS[severity])}>
      {severity}
    </span>
  );
}

export function ConfidenceTag({ confidence }: { confidence: Confidence }) {
  const bars = confidence === "high" ? 3 : confidence === "medium" ? 2 : 1;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted" title={`${confidence} confidence`}>
      <span className="flex items-end gap-px" aria-hidden>
        {[1, 2, 3].map((i) => (
          <span key={i} className={cx("w-[3px] rounded-sm", i <= bars ? "bg-ink" : "bg-line-strong")} style={{ height: 4 + i * 3 }} />
        ))}
      </span>
      <span>{confidence[0].toUpperCase() + confidence.slice(1)} confidence</span>
    </span>
  );
}

export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2.5 py-0.5 text-xs text-muted", className)}>
      {children}
    </span>
  );
}

export function Button({
  children, variant = "primary", className, ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" }) {
  return (
    <button
      {...props}
      className={cx(
        "inline-flex h-9 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
        variant === "primary" && "bg-accent text-on-accent hover:bg-accent-hover",
        variant === "secondary" && "border border-line-strong bg-surface text-ink hover:bg-surface-2",
        variant === "ghost" && "text-muted hover:bg-surface-2 hover:text-ink",
        className,
      )}
    >
      {children}
    </button>
  );
}

// Shared class for text links: ink with a quiet underline instead of a colour.
export const LINK = "font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink";

// Codecademy-style bar: hatched empty track, solid fill.
export function ProgressBar({ value, max, tone = "xp", label }: { value: number; max: number; tone?: "xp" | "ink"; label: string }) {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}
      className="track-hatch h-2.5 overflow-hidden rounded-full ring-1 ring-line ring-inset">
      <div className={cx("h-full rounded-full transition-[width] duration-500", tone === "xp" ? "bg-xp" : "bg-ink")} style={{ width: `${pct}%` }} />
    </div>
  );
}
