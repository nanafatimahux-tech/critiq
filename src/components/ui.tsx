import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { BAND_META } from "@/lib/rubric";
import type { Band, Confidence, Severity } from "@/lib/types";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-2 font-display text-lg font-black tracking-tight text-ink">
      <span className="grid size-8 place-items-center rounded-lg border-2 border-outline bg-accent text-lg leading-none text-on-accent transition-transform group-hover:-rotate-6">C</span>
      Critiq
    </Link>
  );
}

export function TopBar({ children }: { children?: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <div className="flex items-center gap-2">{children}</div>
      </div>
    </header>
  );
}

export function Card({ children, className, id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={cx("rounded-xl border border-line bg-surface", className)}>
      {children}
    </section>
  );
}

// Soft tinted tile holding one icon.
export type Tone = "accent" | "xp" | "sky" | "strong" | "pink" | "dev" | "gap";
export const TONE: Record<Tone, string> = {
  accent: "bg-accent-soft text-accent-ink",
  xp: "bg-xp-soft text-xp-ink",
  sky: "bg-sky-soft text-sky-ink",
  strong: "bg-strong-soft text-strong",
  pink: "bg-pink-soft text-pink-ink",
  dev: "bg-dev-soft text-dev",
  gap: "bg-gap-soft text-gap",
};
export function IconTile({ icon: Icon, tone = "accent", size = "md", className }: { icon: ComponentType<{ className?: string }>; tone?: Tone; size?: "sm" | "md" | "lg"; className?: string }) {
  return (
    <span className={cx("grid shrink-0 place-items-center", size === "sm" ? "size-8 rounded-lg" : size === "md" ? "size-10 rounded-lg" : "size-12 rounded-xl", TONE[tone], className)} aria-hidden>
      <Icon className={size === "lg" ? "size-6" : size === "md" ? "size-5" : "size-4"} />
    </span>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx("font-display text-xs font-extrabold tracking-wider text-accent-ink uppercase", className)}>{children}</p>;
}

export function SectionTitle({ title, subtitle, right, eyebrow, icon, tone }: {
  title: string; subtitle?: string; right?: ReactNode; eyebrow?: string;
  icon?: ComponentType<{ className?: string }>; tone?: Tone;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        {icon && <IconTile icon={icon} tone={tone} />}
        <div className="min-w-0">
          {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
          <h2 className="font-display text-xl font-black tracking-tight">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
        </div>
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
    <span className={cx("inline-flex items-center rounded-full px-2.5 py-0.5 font-display text-xs font-extrabold whitespace-nowrap", BAND_CLASS[band])}>
      {BAND_META[band].label}
    </span>
  );
}

const SEV_CLASS: Record<Severity, string> = {
  critical: "border border-crit bg-crit-soft text-crit",
  high: "bg-gap-soft text-gap",
  medium: "bg-dev-soft text-dev",
  low: "bg-na-soft text-na",
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className={cx("inline-flex items-center rounded-full px-2.5 py-0.5 font-display text-xs font-extrabold tracking-wide uppercase", SEV_CLASS[severity])}>
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
          <span key={i} className={cx("w-[3px] rounded-sm", i <= bars ? "bg-sky" : "bg-line-strong")} style={{ height: 4 + i * 3 }} />
        ))}
      </span>
      <span>{confidence[0].toUpperCase() + confidence.slice(1)} confidence</span>
    </span>
  );
}

export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full border border-line bg-surface-2 px-2.5 py-0.5 text-xs text-muted", className)}>
      {children}
    </span>
  );
}

// Outlined buttons with tight corners (Preply-inspired), coloured by role.
export const BUTTON_BASE = "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-5 font-display text-[15px] font-extrabold transition-colors active:scale-[.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
export const BUTTON_VARIANT = {
  primary: "border-2 border-outline bg-accent text-on-accent hover:bg-accent-hover",
  secondary: "border-2 border-outline bg-surface text-ink hover:bg-surface-2",
  ghost: "text-muted hover:bg-accent-soft hover:text-accent-ink",
  reward: "border-2 border-outline bg-xp text-on-xp hover:brightness-105",
} as const;

export function Button({
  children, variant = "primary", className, ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof BUTTON_VARIANT }) {
  return (
    <button {...props} className={cx(BUTTON_BASE, BUTTON_VARIANT[variant], className)}>
      {children}
    </button>
  );
}

// Text links: coral ink with a soft underline.
export const LINK = "font-semibold text-accent-ink underline decoration-accent/30 underline-offset-4 hover:decoration-accent";

export function ProgressBar({ value, max, tone = "xp", label, size = "md" }: { value: number; max: number; tone?: "xp" | "accent" | "strong"; label: string; size?: "sm" | "md" }) {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}
      className={cx("overflow-hidden rounded-full bg-surface-2 ring-1 ring-line ring-inset", size === "md" ? "h-3.5" : "h-2")}>
      <div
        className={cx("relative h-full rounded-full transition-[width] duration-700 ease-out", tone === "xp" ? "bg-xp" : tone === "strong" ? "bg-strong" : "bg-accent")}
        style={{ width: `${pct}%` }}
      >
      </div>
    </div>
  );
}
