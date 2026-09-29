import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { SubmitForm } from "@/components/SubmitForm";
import { Eyebrow, LINK, TopBar } from "@/components/ui";
import { DIMENSIONS } from "@/lib/rubric";

const STEPS = [
  { n: "01", title: "We read the work", body: "Every page and image we can reach. Anything we couldn't read is listed, not guessed at." },
  { n: "02", title: "You get a level", body: "Your hiring readiness on a four-level ladder, scored against a rubric you can see." },
  { n: "03", title: "You get a quest", body: "3–5 fixes ranked by impact, each worth XP. Check them off, then review again to level up." },
];

export default function Home() {
  return (
    <>
      <TopBar>
        <Link href="/reviews/sample" className="rounded-full px-3 py-1.5 text-sm font-medium text-muted hover:bg-surface-2 hover:text-ink">Sample review</Link>
      </TopBar>
      <main className="mx-auto max-w-[720px] px-4 pt-12 pb-20 sm:px-6 sm:pt-20">
        <div className="text-center">
          <Eyebrow>Portfolio review · hiring manager lens</Eyebrow>
          <h1 className="mt-4 font-serif text-4xl leading-[1.1] tracking-tight text-balance sm:text-5xl">
            Which portfolio should we review?
          </h1>
          <p className="mx-auto mt-4 max-w-[52ch] text-base text-muted text-pretty">
            Add a link, upload a PDF, or both. You&apos;ll get a level, a scorecard and a short quest of fixes — each tied to your actual work.
          </p>
        </div>

        <SubmitForm className="mt-8" />

        <div className="mt-4 flex justify-center">
          <Link href="/reviews/sample" className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm text-muted hover:border-line-strong hover:text-ink">
            See a sample review <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <section className="mt-20 sm:mt-24" aria-labelledby="how">
          <Eyebrow>How it works</Eyebrow>
          <h2 id="how" className="mt-2 font-serif text-2xl tracking-tight sm:text-3xl">Three moves, one level up.</h2>
          <ol className="mt-6 grid border-t border-line sm:grid-cols-3">
            {STEPS.map((s) => (
              <li key={s.n} className="border-b border-line py-5 sm:border-b-0 sm:py-6 sm:pr-6 sm:[&:not(:first-child)]:border-l sm:[&:not(:first-child)]:pl-6">
                <p className="font-mono text-xs text-subtle">{s.n}</p>
                <p className="mt-2 font-semibold">{s.title}</p>
                <p className="mt-1 text-sm text-muted text-pretty">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-16" aria-labelledby="rubric">
          <Eyebrow>The rubric</Eyebrow>
          <h2 id="rubric" className="mt-2 font-serif text-2xl tracking-tight sm:text-3xl">What the reviewer scores</h2>
          <p className="mt-2 max-w-[60ch] text-sm text-muted">
            From the point of view of a senior product design hiring manager. Scores reflect how well your portfolio <em>presents</em> your work — not your ability as a designer. <Link href="/reviews/sample#method" className={LINK}>See the full rubric</Link>
          </p>
          <dl className="mt-6 grid border-t border-line sm:grid-cols-2 sm:gap-x-8">
            {DIMENSIONS.map((d, i) => (
              <div key={d.key} className="flex gap-4 border-b border-line py-4">
                <span className="w-6 shrink-0 pt-0.5 font-mono text-xs text-subtle">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <dt className="text-sm font-semibold">{d.label}</dt>
                  <dd className="mt-0.5 text-sm text-muted">{d.question}</dd>
                </div>
              </div>
            ))}
          </dl>
        </section>
      </main>
    </>
  );
}
