# Critiq design language

Extracted with the design-language-extractor skill from Mobbin web screens of **Manus** (home composer, project view, task progress) and **Codecademy** (My learning, skill benchmark, achievements, project-complete XP screen, path progress). All values are estimates from screenshots, not specs.

Critiq takes Manus's calm, editorial workspace as the base and borrows Codecademy's progress and achievement mechanics for gamification. No purple.

# Design Language Summary
A quiet, warm-neutral workspace: off-white canvas, white bordered surfaces, near-black ink, and a serif display line that makes the product feel considered rather than "AI-generated". Colour is used for meaning, not decoration. Progress is made tangible with Codecademy-style mechanics: mono eyebrow labels, XP bars with before → after values, a level ladder and circular achievement stamps, highlighted in a single yellow.

# Visual Style
- Overall: editorial minimalism (Manus) + utilitarian learning-product structure (Codecademy)
- Personality: calm, confident, honest; rewarding without being childish
- Tone: warm neutral, low chroma; one bright highlight (yellow) reserved for progress/XP
- Density: airy on entry screens (single centred task), medium on the report
- Feel: consumer-grade polish on a professional tool
- Polish: high; thin 1px borders, generous whitespace, very few shadows

# Layout System
- Manus entry: a single centred serif question + one composer card + a row of pill chips beneath. Nothing competes with the input.
- Codecademy report: header card with score/level on the left and explanation on the right, then stacked sections with plain bold section titles.
- Spacing: ~8px base; ~16px inside chips, ~20–24px inside cards, ~48–64px between major sections (estimate)
- Containers: composer ~560–640px wide; report content ~720–880px with a narrow left nav (estimate)
- Cards: white, 1px border, radius ~12–16px (Manus); Codecademy uses squarer cards — Critiq uses ~12px
- Responsive: only desktop observed; mobile behaviour is inferred (single column, composer full width)

# Color Palette
- Primary action: ~#1A1A19 near-black (Manus's send button, "Add credits" pill)
- Highlight / XP: ~#FFD300 Codecademy yellow, always with dark text on it
- Background: ~#F8F8F6 warm off-white (Manus canvas); sidebar ~#F1F1EE
- Surface: #FFFFFF
- Text: ~#1A1A19
- Muted text: ~#6B6B66
- Border: ~#E6E5E1
- Success: ~#2F8F5B (Manus task-progress checks, estimate)
- Warning: ~#B7791F (inferred)
- Error: ~#C2410C (inferred; not observed)
- Dark "celebration" surface: ~#10162F navy (Codecademy project-complete screen)

# Typography
- Display: a transitional serif for the one big question/heading (Manus "What can I do for you?") — guess: similar to Newsreader/Lora
- UI/body: neutral grotesque sans (~13–15px) — Inter-like
- Labels: monospace uppercase eyebrows (Codecademy "SECTIONS", "UNITS COMPLETED", "Subskill") — guess: Suisse Int'l Mono-like
- Headings: display ~36–44px serif (normal weight); section titles ~18–20px sans semibold
- Weights: 400 body, 500–600 labels/titles; serif stays regular weight
- Line height: ~1.5 body, ~1.15 display

# Component Language
- Buttons: primary = solid near-black, white text, full pill or ~10px radius; secondary = white with 1px border; Codecademy's yellow button only for "Continue" after earning XP
- Forms: Manus composer — large white card, soft border, textarea on top, tool buttons bottom-left, circular black send bottom-right
- Chips: pill, 1px border, white fill, small icon + label (Manus suggestion chips)
- Cards: white, 1px border, minimal/no shadow
- Navigation: Manus left rail with small monochrome icons; Codecademy text nav + tabs with underline for active
- Lists: Manus task list rows with icon, title, muted timestamp right-aligned; hairline separators
- Progress: Codecademy bar with hatched empty track, yellow fill, percentage badge; "3 / 3" counter on Manus task progress
- Badges: circular stamp achievements with title + date beneath (Codecademy)
- Scores: Codecademy benchmark gauge with named levels (Novice → Advanced)
- Empty states: not observed

# Interaction Patterns (inferred)
- Hover: subtle grey fill on rows/chips
- Active: black fill or underline tab
- Disabled: send button greys out until input exists (Manus, observed)
- Focus: not observed — use a visible 2px ink ring
- Loading: Manus step checklist with ticks and an n / total counter
- Motion: minimal; progress bars animate width

# Iconography & Imagery
- Icons: thin monochrome outline, ~16px, round caps (Manus)
- Achievements: circular line-art stamps (Codecademy)
- Illustrations: none in product chrome
- Colour in icons only where it carries meaning (green check, yellow XP)

## Critiq icon set
- Library: Lucide (`lucide-react`, free, ISC license) — thin outline, round caps, matches the Manus icon style above
- The whole set lives in `src/components/icons.ts` (35 icons, grouped by purpose). Import from there only; ESLint blocks direct `lucide-react` imports
- Sizes: 14px (`size-3.5`) inside chips and small text, 16px (`size-4`) in buttons and body text, 20px (`size-5`) for standalone and achievement icons
- Colour: inherit text colour (`currentColor`); add colour only when it carries meaning (green done, amber warning, red error, yellow XP)
- To add an icon: find it at lucide.dev/icons, add its name to the right group in `icons.ts`, then import it from `@/components/icons`
- To switch libraries later (e.g. Central Icons), re-export the new icons under the same names in `icons.ts`; no other file changes

# Copy Tone
- Direct, second person: "What can I do for you?", "You earned 25 XP each toward your skills!"
- Buttons: short verbs — "Continue", "Start", "Share", "New task"
- Progress stated plainly: "0 / 9 concepts practiced", "Exams passed 1 of 6"

# Design Rules
## Do
- Do open entry screens with one serif question and one obvious input
- Do use near-black solid buttons for primary actions
- Do use yellow only for progress, XP and earned achievements
- Do use mono uppercase eyebrows for metadata labels and counters
- Do show progress as before → after ("54 XP → 79 XP") and n / total
- Do use thin 1px borders on white surfaces instead of shadows
- Do keep icons monochrome outline unless the colour carries meaning
## Do not
- Do not use purple, gradients, glassmorphism or glow
- Do not tint whole sections with brand colour; keep the canvas neutral
- Do not bold the serif display face
- Do not use coloured icons as decoration on feature lists
- Do not invent rewards the user didn't earn — every XP/badge maps to real review data
