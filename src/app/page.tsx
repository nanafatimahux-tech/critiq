import Link from "next/link";
import { ArrowRight, Globe, Lock, Scale, Star, Trophy, Zap } from "@/components/icons";
import { SubmitForm } from "@/components/SubmitForm";
import { DIMENSION_LOOK } from "@/components/dimensions";
import { Card, Eyebrow, IconTile, LINK, TopBar, type Tone } from "@/components/ui";
import { DIMENSIONS } from "@/lib/rubric";
import { CLOUD } from "@/lib/store";

const STEPS: { icon: typeof Globe; tone: Tone; title: string; body: string }[] = [
  { icon: Globe, tone: "sky", title: "We read your work", body: "Every page and image we can reach. Anything we couldn't read is listed, never guessed at." },
  { icon: Trophy, tone: "accent", title: "You get your level", body: "Your hiring readiness from Level 1 to 4, plus a skill graph across 8 areas hiring managers look for." },
  { icon: Zap, tone: "xp", title: "You clear your quest", body: "3–5 fixes ranked by impact, each worth XP. Tick them off, then review again to level up." },
];

export default function Home() {
  return (
    <>
      <TopBar>
        <Link href="/reviews/sample" className="rounded-lg px-3.5 py-2 font-display text-sm font-extrabold text-muted transition-colors hover:bg-surface-2 hover:text-ink">Sample review</Link>
      </TopBar>

      {/* Flat tinted header band; the composer overlaps its bottom edge. */}
      <div className="banner">
        <div className="mx-auto max-w-[760px] px-4 pt-12 pb-28 text-center text-ink sm:px-6 sm:pt-16 sm:pb-32">
          <p className="inline-flex items-center gap-1.5 rounded-md border border-outline bg-surface px-2.5 py-1 font-display text-xs font-extrabold tracking-wider uppercase">
            <Star className="size-3.5 text-accent" /> Hiring-manager-style reviews
          </p>
          <h1 className="mt-5 font-display text-4xl leading-[1.05] font-black tracking-tight text-balance sm:text-6xl">
            Level up your <span className="text-accent-strong">design portfolio</span>
          </h1>
          <p className="mx-auto mt-4 max-w-[48ch] text-base text-muted text-pretty sm:text-lg">
            See your work the way a hiring manager does — then turn the feedback into a quest you can actually finish.
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-[760px] px-4 pb-20 sm:px-6">
        <SubmitForm className="-mt-20 sm:-mt-24" cloudUploads={CLOUD} />

        <div className="mt-4 flex justify-center">
          <Link href="/reviews/sample" className="inline-flex items-center gap-1.5 rounded-lg border-2 border-outline bg-surface px-4 py-2 font-display text-sm font-extrabold hover:bg-surface-2">
            See a sample review <ArrowRight className="size-4" />
          </Link>
        </div>

        <section className="mt-20" aria-labelledby="how">
          <Eyebrow className="text-center">How it works</Eyebrow>
          <h2 id="how" className="mt-2 text-center font-display text-3xl font-black tracking-tight">Three steps to your next level</h2>
          <ol className="mt-8 grid gap-4 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <Card className="relative h-full p-5">
                  <span className="absolute top-4 right-4 grid size-7 place-items-center rounded-md bg-surface-2 font-display text-sm font-black text-subtle">{i + 1}</span>
                  <IconTile icon={s.icon} tone={s.tone} size="lg" />
                  <p className="mt-4 font-display text-lg font-black">{s.title}</p>
                  <p className="mt-1 text-sm text-muted text-pretty">{s.body}</p>
                </Card>
              </li>
            ))}
          </ol>
        </section>

        {/* Uxcel-style preview of the rewards, clearly labelled as an example. */}
        <section className="mt-16" aria-labelledby="earn">
          <Card className="overflow-hidden">
            <div className="grid gap-6 p-5 sm:grid-cols-[1fr_1.1fr] sm:p-7">
              <div>
                <Eyebrow>What you earn</Eyebrow>
                <h2 id="earn" className="mt-2 font-display text-2xl font-black tracking-tight">Progress you can see</h2>
                <p className="mt-2 text-sm text-muted text-pretty">
                  Every level, XP point and badge comes from the rubric and your actual work — nothing is handed out for free.
                </p>
                <Link href="/reviews/sample#fixes" className={`mt-4 inline-block text-sm ${LINK}`}>Try the quest in the sample</Link>
              </div>
              <div className="space-y-3 rounded-lg bg-surface-2 p-4" aria-label="Example rewards">
                <p className="text-xs font-semibold text-subtle">Example</p>
                <div className="flex items-center gap-3">
                  <span className="grid size-12 place-items-center rounded-full border-2 border-outline bg-xp font-display text-2xl font-black text-on-xp">2</span>
                  <div>
                    <p className="font-display font-black">Level 2 · Needs work</p>
                    <p className="text-xs text-muted">2 fixes to your next review</p>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-semibold"><span>Fix quest</span><span className="text-xp-ink">90 / 180 XP</span></div>
                  <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-surface ring-1 ring-line ring-inset"><div className="h-full w-1/2 rounded-full bg-xp" /></div>
                </div>
                <div className="flex gap-2">
                  <IconTile icon={DIMENSION_LOOK.problem_framing.icon} tone="accent" size="sm" />
                  <IconTile icon={Scale} tone="pink" size="sm" />
                  <IconTile icon={Star} tone="xp" size="sm" />
                  <span className="grid size-8 place-items-center rounded-xl border-2 border-dashed border-line-strong text-subtle"><Lock className="size-3.5" /></span>
                </div>
              </div>
            </div>
          </Card>
        </section>

        <section className="mt-16" aria-labelledby="rubric">
          <Eyebrow className="text-center">The rubric</Eyebrow>
          <h2 id="rubric" className="mt-2 text-center font-display text-3xl font-black tracking-tight">8 things hiring managers look for</h2>
          <p className="mx-auto mt-2 max-w-[56ch] text-center text-sm text-muted">
            Scores reflect how well your portfolio <em>presents</em> your work — not your ability as a designer.
          </p>
          <dl className="mt-8 grid gap-3 sm:grid-cols-2">
            {DIMENSIONS.map((d) => (
              <Card key={d.key} className="flex gap-3 p-4">
                <IconTile icon={DIMENSION_LOOK[d.key].icon} tone={DIMENSION_LOOK[d.key].tone} />
                <div>
                  <dt className="font-display font-black">{d.label}</dt>
                  <dd className="mt-0.5 text-sm text-muted">{d.question}</dd>
                </div>
              </Card>
            ))}
          </dl>
        </section>
      </main>
    </>
  );
}
