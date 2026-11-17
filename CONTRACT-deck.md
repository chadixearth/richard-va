# CONTRACT — portfolio deck (richard-va)

The page is a **slide deck**: 11 stacked boards inside `<main class="deck">`.

Reference language: a cream paper collage deck. Crumpled sheet, one saturated
ink for all display type, a huge heavy serif word per board with a thin script
word tucked under its tail, black-and-white photocopied cutouts that overlap and
bleed off the edges, pen handwriting as margin texture, three mono micro-labels
in a rail across the top, and a lot of empty paper. Rebuilt in matcha.

## Non-negotiables

1. **Every section is exactly one `<section class="slide ...">`.** No `.wrap`.
   The `.slide` supplies padding, radius, min-height, the paper ground and
   `overflow: hidden`. There are no ground modifiers: every board is paper.
   **A board must fit one viewport.** At 1440 × 900 its inner content is
   **≤ 690 px** (board 785 = 900 − 97 park − 18 gap; minus 2 × 43 padding).
   Boards are sticky and all the same height. On a shorter screen the nav and
   padding compact (`@media (max-height: 850px)`) and the `--fit` net scales the
   rest; below 1000 × 700 the stack switches off. Author to the 690 and compress
   by **layout**, never by cutting copy.
2. **First child is `<Rail no="NN" name="Board" />`**, the three-label running
   head. It carries the board index; there is no separate number tab.
3. **Exactly one `.rv`** per file, on the board's main content wrapper.
4. **Tokens only.** Never a raw hex except inside an inline `<svg>` that needs a
   `currentColor` fallback.
5. **`--powder` (#A6D92F) is a FILL.** Never `color: var(--powder)`: it fails
   contrast on cream. It is the highlighter swipe, the tape and the dots.
6. **Two voices in every heading block**: the serif display word (`.d1`/`.d2`)
   against `.script` (Caveat). One ink, two personalities.
7. Copy comes **verbatim** from `src/data/content.ts`. Invent nothing.
8. Nothing a clipping can do may cross the rail.

## Tokens (frozen)

Ground: `--page #E6E2D2` · `--cream #F6F3E8` · `--cream-2 #EDE9DA` · `--paper #FBF9F2`
Ink: `--ink #0E1509` · `--body #2A3720` · `--muted #5C6B50`
Pen: `--pen #3E7A1E` (display ink, on cream) · `--pen-2 #2E5C15` (on the darker
desk ground: nav, HUD, skip link, where #3E7A1E only reaches 4.04:1)
Accent: `--powder #A6D92F` (fill only) · `--powder-2 #8CBD1F` · `--wash #DCE8C4`
Rules: `--rule`
Fonts: `--serif` Fraunces 900 (display, variable: `SOFT` 28, `WONK` 1, `opsz`
144 are set once on `body` and inherit) · `--display` Archivo (body) ·
`--script` Caveat (pen) · `--mono` DM Mono (rail, micro-labels)
Other: `--radius` 3px · `--gut` · `--pad` · `--ease`

## Utility classes (global.css) — USE THESE, do not re-invent

| class | what it is |
|---|---|
| `.d1 .d2` | Fraunces 900 uppercase display word, in `--pen` |
| `.d3` | smaller serif sub-head |
| `.cond` | Archivo condensed 800 uppercase, for a secondary line |
| `.script` | Caveat handwriting, the word tucked under the display word |
| `.label` | DM Mono micro-label |
| `.lede` / `.body-s` | body paragraph sizes |
| `.cut` | photocopy treatment: grayscale, blown contrast, `multiply` |
| `.cut--hard` | harder threshold, for the cutout portrait |
| `.cut--bot` | inverted ghost print, for botanical clippings |
| `.bleed` | a clipping sized by width and masked at the edges, runs off the sheet |
| `.snap` | a pasted photograph with a Caveat `<figcaption>` |
| `.tape` | translucent powder tape strip |
| `.mark` | powder highlighter swipe behind a word (animates in) |
| `.btn` `.btn--ghost` | buttons |
| `.sr` | screen-reader only; becomes a visible 44px skip link on focus |
| `<Rail no name />` | the three-label running head, required on every board |
| `<Scribble lines seed />` | pen handwriting block; wrap it in your own positioned div |

## Motion hooks (motion.ts owns these; a board only adds the attribute)

| attribute | what it does |
|---|---|
| `data-drift="N"` | the piece travels up to N px toward the pointer while the board is under it, and eases back on `pointerleave`. Depth is per piece, so a board with 10, 14 and 5 reads as layers of paper. Loose pieces only: photographs, clippings, scribbles, numerals. Never a block of body copy. |
| `data-draw` | the element's `--draw` is scrubbed 0 → 1 as the board is read. Use it in a transform (`scaleX(var(--draw))`) or a `stroke-dashoffset` so a rule or a pen stroke draws itself. |

`global.css` holds the default: `[data-draw] { --draw: 1 }` and
`.motion [data-draw] { --draw: 0 }`. Never declare `--draw: 0` in a component:
a scoped selector outspecifies that rule and leaves the stroke invisible on the
no-script and reduced-motion paths. Use `var(--draw)` and let the cascade set it.

Each board carries exactly one signature interaction on top of those hooks, and
it is hover polish: no `tabindex` on non-interactive rows, and nothing the page
needs in order to be read.

## Board order

| # | file | content |
|---|---|---|
| 01 | `Cover.astro` | PORTFOLIO, signature, cutout portrait |
| 02 | `About.astro` | `about.title`, `about.paras`, `about.strengths`, taped headshot |
| 03 | `Skills.astro` | `services` (3 × no/title/blurb/items[6]) |
| 04 | `Day.astro` | `runlog` (title/note/rows[6]) |
| 05 | `Projects.astro` | `work` (4 × label/title/body/tools) |
| 06 | `Numbers.astro` | `stats` (4 × n/l) |
| 07 | `Toolkit.astro` | `marquee` (22 strings), rows pause on hover and focus |
| 08 | `Resume.astro` | `experience` (3) + `education` |
| 09 | `Method.astro` | `process` (4 × no/title/text) |
| 10 | `Contact.astro` | `profile` fields |
| 11 | `Footer.astro` | wordmark + links |

Section ids used by the nav: `#about`, `#skills`, `#projects`, `#resume`, `#contact`.

## Assets

`src/assets/richard-headshot.jpg`, `src/assets/richard-cutout.png`,
`src/assets/photos/{hero-bg,stats-bg,svc-1,svc-2,svc-3,work-1..4}.jpg`

`texture.jpg` is unusable: its high-frequency grain inverts to white noise under
`.cut--bot`. Botanical clippings use `svc-3.jpg` (leaves) or `svc-2.jpg` (strata).

Import with `import { Image } from "astro:assets"` and a static import per file.
Every photo goes through `.cut`, `.snap` or `.bleed`, never a bare `<img>`.

## Imports that already exist

```astro
import { Image } from "astro:assets";
import { about, services, runlog, work, stats, marquee, experience, education, process, profile } from "../data/content";
```
