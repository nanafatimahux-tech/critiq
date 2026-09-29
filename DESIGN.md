# Critiq design language

Extracted with the design-language-extractor skill from Mobbin web screens of **ClassDojo** (teacher classroom, class list, student portfolio home, login options) and **Uxcel** (home dashboard with streak/league/getting-started rail, skill graph, lesson feedback, onboarding choice, dark mode). All values are estimates from screenshots, not specs.

ClassDojo sets the colour and personality (primary). Uxcel sets the product layout and progress mechanics. Earlier Manus/Codecademy direction is retired.

# Colour direction (current)
Layout comes from ClassDojo + Uxcel (below). Colour was reworked using **Preply** (Mobbin web: tutor search, tutor profile, My lessons, Learn) as a *guide, not a copy*: we took its principles, not its palette.

**Principles borrowed from Preply:** flat surfaces with no gradients or glow; one confident signature colour on buttons with a near-black 2px outline; secondary buttons white with the same outline; tight corners (~8–12px) instead of pills everywhere; soft tinted labels; underline tabs; borders instead of shadows.

**Critiq's own:** warm cream canvas, coral signature (not Preply pink), gold for XP, cobalt/green/teal as supporting tones, and a flat coral marker highlight in the hero headline.

| Role | Value |
|---|---|
| Signature (primary buttons, marker) | `#FF6B4A` coral, dark text |
| Signature text (labels, links) | `#B8361A` |
| Outline (button/composer borders) | `#16140F` |
| XP / reward | `#FFC933` gold |
| Info | `#2F5BEA` cobalt |
| Success | `#11845B` |
| Extra tone ("pink" token) | `#0E9AA7` teal |
| Canvas | `#FBF8F3` warm cream |
| Surface | `#FFFFFF` |
| Text / muted | `#16140F` / `#5C554B` |
| Border | `#E5DED3` |

**Light mode only.** Dark mode was removed on request; `color-scheme: light` keeps browser controls light too.

Rules: bright coral is for fills and icons only — small coral text uses the deeper signature-text token (contrast ≥ 4.5:1). Never white text on coral or gold.

# Layout language (ClassDojo + Uxcel)

# Design Language Summary
Playful but organised. A lavender-grey canvas with soft white cards, a vivid ClassDojo purple for every primary action, and a small family of bright supporting colours (sunny yellow, sky blue, green, pink) used for rewards and meaning. Bold rounded headings give it warmth. Uxcel-style widgets — level, quest progress, skill graph, badges — make improvement feel like progress in a game, and every one is backed by real review data.

# Visual Style
- Overall: friendly, colourful, rounded (ClassDojo) on a clean product grid (Uxcel)
- Personality: encouraging coach, not a stern grader
- Tone: bright accents on calm neutrals; colour carries meaning (reward, success, warning)
- Density: comfortable; content in cards, widgets in a right rail on desktop
- Polish: high; soft shadows, 16–24px radii, micro-interactions on rewards

# Layout System
- ClassDojo: top tabs under a big bold page title; content in white rounded cards on a tinted canvas; a sky-blue banner band with dots behind the hero area on the student home
- Uxcel: left nav + main column + right rail of stacked widgets (streak, league, getting started)
- Critiq report: pill tab bar for sections (all sizes), main column + sticky right rail (level, quest, badges) from `lg`; rail stacks above content on mobile
- Spacing: ~8px base; cards ~20–24px padding; ~40px between sections
- Responsive: mobile = single column, tabs scroll horizontally, rail widgets become a summary strip

# Color Palette (estimates → Critiq tokens)
| Role | Light | Dark | Source |
|---|---|---|---|
| Primary (buttons, links, active) | `#7D40FF` | `#A382FF` (dark text on it) | ClassDojo purple |
| Reward / XP | `#FFC62E` | `#FFCF4D` | ClassDojo yellow button, Uxcel streak bolt |
| Info / banner | `#3FA9F5` | `#6CC0FF` | ClassDojo sky banner |
| Success | `#1FA35B` | `#4ADE80` | ClassDojo point badges, Uxcel "Correct!" |
| Accent / gems | `#FF5FA2` | `#FF86BA` | Uxcel league gem, ClassDojo pinks |
| Background | `#F4F3FB` | `#120F24` | ClassDojo lavender canvas / deep indigo night |
| Surface | `#FFFFFF` | `#1C1836` | |
| Text | `#1F1B3D` | `#F1EFFF` | ClassDojo navy-indigo headings |
| Muted text | `#625E80` | `#B0ABD1` | |
| Border | `#E6E3F3` | `#2F2A52` | |
| Warning | `#C26A00` | `#FBBF4B` | |
| Error | `#E5484D` | `#FF7A7F` | |

Dark mode is a deep indigo night, not grey, so the colours keep their personality. Primary buttons swap to dark text in dark mode to keep contrast above 4.5:1.

# Typography
- Display: rounded, heavy geometric sans (ClassDojo headings) → **Nunito 800/900**
- Body/UI: neutral sans (Uxcel) → **Inter**
- Page titles ~28–40px Nunito 900; section titles ~20px Nunito 800; body 15–16px Inter
- Labels: small uppercase Nunito 800 with wide tracking

# Component Language
- Buttons: fully rounded pills; primary solid purple; secondary white with border; reward buttons yellow with dark text; slight lift on hover, press-down on click
- Cards: white, radius ~20px, soft shadow + hairline border
- Icon tiles: rounded squares tinted with a supporting colour holding a single icon (ClassDojo emoji-style tiles)
- Tabs: pill tabs; active = purple tint + purple text
- Badges: round coloured count bubbles (ClassDojo green points); pill status chips
- Progress: thick rounded bars, animated fill; checklist rows with coloured check circles (Uxcel getting started)
- Skill graph: radar/spider chart across rubric dimensions (Uxcel)
- Celebration: confetti burst + floating "+XP" on earning; completion card in purple→indigo gradient

# Interaction Patterns (inferred)
- Hover: lift (translate -1px) + stronger shadow on cards/buttons
- Active: press down; toggles fill with colour
- Rewards: short confetti + number pop; always disabled under `prefers-reduced-motion`
- Loading: step checklist with coloured checks and a filling bar

# Iconography & Imagery
- Icons: Lucide outline (see `src/components/icons.ts`) placed on coloured tiles
- No third-party mascots; personality comes from colour, tiles and motion

# Copy Tone
- Encouraging, second person, short: "Nice — 50 XP earned", "Your next level is 2 fixes away"
- Buttons: verbs ("Start review", "Mark as fixed", "Review again")

# Design Rules
## Do
- Do use ClassDojo purple for primary actions, active tabs and links
- Do use yellow only for XP and rewards, green for success/done, sky for information
- Do give every section heading a coloured icon tile
- Do celebrate earned progress (confetti, +XP) — briefly, and never under reduced motion
- Do back every level, XP, badge and graph point with real review data
- Do check every colour pair for contrast (light mode only)
## Do not
- Do not use flat grey dark mode; use the indigo night palette
- Do not put white text on light purple or yellow
- Do not use third-party mascots or brand illustrations
- Do not animate routine page loads

## Critiq icon set
- Library: Lucide (`lucide-react`, free, ISC license)
- The whole set lives in `src/components/icons.ts`, grouped by purpose. Import from there only; ESLint blocks direct `lucide-react` imports
- Sizes: 14px in chips, 16px in buttons/body, 20px on icon tiles
- To add an icon: find it at lucide.dev/icons, add it to `icons.ts`, import from `@/components/icons`
- To switch libraries later, re-export the new icons under the same names in `icons.ts`
