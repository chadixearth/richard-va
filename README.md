# Richard Legaspi — AI-Native Virtual Assistant

A one-page portfolio built as a **deck**: eleven stacked boards that all sit on the
same sheet of cream paper, assembled the way a printed presentation is — photocopied
cutouts bleeding off the edges, torn snapshots, blocks of pen handwriting in the
margins, a running head across the top of every board, and one heavy serif word per
board in a single matcha ink.

## Run

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # static output in dist/
```

## Structure
- `src/data/content.ts` — every word on the page.
- `src/pages/index.astro` — the slide order.
- `src/layouts/Layout.astro` — head, fonts, floating nav, deck HUD, motion entry point.
- `src/styles/global.css` — tokens, the `.slide` system and all collage utilities.
- `src/scripts/motion.ts` — the whole motion system (GSAP + ScrollTrigger + SplitText).
- `CONTRACT-deck.md` — the frozen token list and utility reference each slide is built against.
- `src/components/` — one component per slide:
| # | file | board |
|---|---|---|
| 01 | `Cover` | Portfolio cover |
| 02 | `About` | About me |
| 03 | `Skills` | Skills & expertise |
| 04 | `Day` | A day on the desk |
| 05 | `Projects` | Previous projects |
| 06 | `Numbers` | By the numbers |
| 07 | `Toolkit` | Tools I run daily |
| 08 | `Resume` | Working experience + education |
| 09 | `Method` | How I work |
| 10 | `Contact` | Let's work together |
| 11 | `Footer` | End card |

Every board is the same cream ground. There is no dark panel any more: the deck is
one sheet of paper, and contrast comes from scale, ink and empty space instead of
from flipping the background.

## Assets
- `src/assets/richard-cutout.png` — background-removed portrait (rembg, isnet-general-use).
- `src/assets/richard-headshot.jpg` — headshot, pasted as a torn snapshot.
- `src/assets/photos/*.jpg` — Unsplash photography (free licence). The source frames are
  dark and moody, so they are never shown straight: `.cut` lifts a crop into a high-key
  photocopy, `.cut--hard` pushes the figure to near-solid ink, and `.cut--bot` inverts
  botanical frames so the leaves go dark and the background dissolves into the paper.
  Every clipping is masked with a soft radial so it reads as torn, not as a rectangle
  of stock photo.
- `public/og.png` — 1200×630 social card.

## Palette — matcha
Page `#E6E2D2` · paper `#F6F3E8` · cream-2 `#EDE9DA`
Ink `#0E1509` · body `#2A3720` · muted `#5C6B50`
**Pen `#3E7A1E`** · pen-2 `#2E5C15` (hover)
Fill only: powder `#A6D92F` · powder-2 `#8CBD1F` · wash `#DCE8C4`

Green is the only hue, and there is exactly one ink: `--pen` carries every display
word, the rail, the handwriting and the HUD. Powder is a **fill** — the highlighter
swipe, a dot, a tape strip — never a text colour, because it does not clear contrast
on cream.

## Type
**Playfair Display** 900 is the big word on every board: uppercase, tight, in `--pen`.
**Archivo** variable (`wght 100..900`, `wdth 62..125`) does the rest — 400 for body,
`.cond` for the compact poster voice.
**Caveat** is the pen: the thin script word under each display word, the snapshot
captions and the handwriting blocks.
**DM Mono** handles the rail, micro-labels and numbers.

Every board pairs one heavy serif word with one handwritten one — that pairing is the
system, and the rail repeating the same three micro-labels across the top of all
eleven boards is what ties them into a deck.

## Motion — "flipping through the deck"
All of it lives in `src/scripts/motion.ts`, built on GSAP ScrollTrigger + SplitText
and Lenis. One idea: this is a stack of printed boards on a desk and you are flipping
through it.

1. **One board, one panel.** Above 900×620 the panels turn sticky (`.stacked`) and
   every one of them is exactly `--board` tall — `100vh` minus the nav park minus the
   deck gap — parked at the same `--park`. Nothing is ever half on screen or sliced by
   the nav. **Panels are authored to fit that frame** (see `CONTRACT-deck.md`);
   `--fit` is a JS safety net that scales a panel down on a short viewport rather than
   clipping it, and it should read `1` on a normal desktop.
2. **Hold.** `--hold` (30vh) is the still beat a board gets on screen before the next
   one starts climbing over it, so nothing flashes past.
3. **Stack.** The arriving board slides over the last one, which scales to 94.5% and
   falls into shadow via `--dim`, with an upward `box-shadow` doing the casting.
4. **Pen.** Every Caveat word wipes on left to right, the same gesture as the
   highlighter `--swipe` behind *system* on the closer. Handwriting blocks draw
   themselves stroke by stroke with `stroke-dashoffset`.
5. **Desk.** Snapshots, clippings, tape and handwriting drop in from above and
   overshoot (`back.out`), in random order, like pieces tossed onto a page. The
   cover is choreographed by hand instead: paper, then the figure, then the title
   printed across it, then the pen signs and annotates — the order is the reading
   order.
6. **Drift.** Once a board is pinned its clippings keep moving inside the frame
   (scrub parallax), and the day timeline draws hour by hour (`--draw` per row).
7. **Alive.** The tool rows are seamless marquees whose speed *and direction* answer
   your scroll velocity. Stop and everything eases back to idle.

Headlines rise out of masked lines (SplitText `mask: "lines"`; `.m-line` carries the
descender room, `.m-line-mask` cancels it in the flow). The right-hand HUD counts the
board you are on, drawn in `--pen` and reading its name off each board's rail.

**Smooth scroll.** Lenis runs in its default mode, which animates the real scroll
position instead of transforming a wrapper — that is the only kind that survives
`position: sticky`, so the stack keeps working. It drives `ScrollTrigger.update` off
`gsap.ticker`. Anything that scrolls programmatically (in-page links, a deep link on
load) has to go through `lenis.scrollTo`, or Lenis springs it back.

`prefers-reduced-motion` drops the module entirely: `.motion` is removed, nothing is
hidden, nothing is sticky, nothing is smoothed. Same if the script fails to load.

## Deploy
Vercel: import the repo, framework preset **Astro**, build `npm run build`, output `dist`. No env vars.
