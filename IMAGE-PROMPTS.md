# Image prompts for the deck

Every picture on the deck is currently stock matcha photography standing in as
decoration. These are the prompts for replacing them with your own generated
images, one per slot, plus how to drop a new file in.

Two of the pictures are you and should stay real photographs, not generated:
`src/assets/richard-cutout.png` (the figure on the cover) and
`src/assets/richard-headshot.jpg` (the pinned polaroid on About).

## How the deck treats a picture

Every picture is printed into the paper: converted to grayscale, pushed to a
high-contrast photocopy, and laid over the cream sheet so the white of the
photo disappears into the page. That exposure is baked into the file, so a new
image has to be baked before it looks right.

1. Generate the image.
2. Save it into `src/assets/.orig/` with the exact filename of the slot you are
   replacing, for example `src/assets/.orig/work-1.jpg`.
3. Run `node scripts/bake-cuttings.mjs`. It regrades every file in `.orig` into
   `src/assets/` with that slot's exposure.
4. `npm run build`.

The originals stay in `.orig` untouched, so you can re-run the bake any time.
Never bake a file that is already baked; the exposure compounds.

## What to tell the generator, every time

End every prompt with this, because the deck does its own grading and a picture
that arrives already stylised fights it:

> Shot on 35mm film, natural available light, shallow depth of field, real
> photograph, no text, no watermark, no logo, no people's faces, muted colour,
> nothing oversaturated, no HDR, no AI gloss.

Generate at 4:5 portrait unless the slot says otherwise. Bigger is better; the
build downsamples.

---

## 1. `work-1.jpg` — 4:5 portrait

**Where:** the `07:00` polaroid on the Day board, and the `week one` polaroid on
the Method board.
**What it has to say:** the first hour of the working day, before anything is
asked of you.

> Close overhead shot of a single cup of matcha being whisked on a plain
> wooden desk at dawn, one hand holding the bowl, steam catching the light,
> a closed notebook and a pen beside it, soft window light from the left,
> deep shadows, everything else out of frame.

## 2. `work-2.jpg` — 1:1 square

**Where:** the `The desk` polaroid on the cover, and the snapshot pinned to the
Projects header.
**What it has to say:** the desk this work actually runs from.

> Overhead shot of a tidy working desk from directly above: a laptop closed at
> the edge of frame, a mug of tea, a paper notebook with a pen laid across it,
> a pair of headphones coiled, strong side light making long shadows on the
> wood, nothing branded, no screen visible.

## 3. `work-3.jpg` — 4:5 portrait

**Where:** the `14:00` polaroid on the Day board, and the clipping on the
footer.
**What it has to say:** the middle of the afternoon, work in progress.

> A second cup of tea half finished beside a stack of printed pages with
> handwritten marks in the margins, seen at a low angle across the desk
> surface, afternoon light raking from the right, a phone face down, the
> background falling out of focus.

## 4. `work-4.jpg` — 4:5 portrait

**Where:** the `Matcha, 6am` polaroid on the cover, and the clipping on the
Numbers board.
**What it has to say:** the ritual that starts the day. This is the first
picture anyone sees, so it carries the most weight.

> A hand pouring hot water from a small kettle into a matcha bowl, shot close
> and slightly from the side, steam rising into a shaft of early morning
> light, a bamboo whisk resting on a folded cloth, dark background, the
> highlights blown bright.

## 5. `svc-1.jpg` — 4:5 portrait

**Where:** the `Class of 2026` polaroid beside the education block on Resume.
**What it has to say:** finishing something. It sits next to a degree, so it
should feel like an ending, not a product shot.

> A desk at night near the end of a long piece of work: a laptop open and out
> of focus, a cup gone cold, a stack of bound printed pages squared up on the
> left, a desk lamp throwing a hard pool of light, the rest of the room dark.

## 6. `svc-2.jpg` — 4:5 portrait, texture

**Where:** the pale ghost bleeding off the corner of the Day, Toolkit, Skills
and Footer boards. It is inverted, masked to a soft ellipse and sunk to 75%
opacity, so what matters is the pattern, not the subject.
**What it has to say:** nothing literal. It is grain on the paper.

> Extreme close-up of matcha powder sifted across a flat surface, raking light
> picking up every ridge and clump, no bowl, no hands, no context, the whole
> frame filled with the texture, almost abstract, high contrast between the
> peaks and the hollows.

## 7. `svc-3.jpg` — 4:5 portrait, botanical

**Where:** the most-used picture on the deck. The leaf ghost at the corner of
About, Contact, Cover, Footer, Method, Numbers, Projects, Resume and Skills.
Inverted and masked, so it reads as a pale pressed specimen.
**What it has to say:** a plant pressed in the margin of a notebook.

> A single tea plant branch with five or six leaves laid flat on a white
> surface, photographed from directly above like a botanical specimen sheet,
> even diffuse light, no shadow to speak of, the leaves sharp against an empty
> white background, nothing else in frame.

---

## The two that must stay real

**`richard-cutout.png`** — you in a suit, cut out against transparency. The
deck knocks it to solid ink, so what it needs is a clean edge and a clear
separation from the background, not a nice background. A phone photo against a
plain wall, with the background removed, is the right input. Keep the alpha
channel; save it as PNG.

**`richard-headshot.jpg`** — the same photo or another one, square, head and
shoulders, pinned as a polaroid on About with your signature under it.

A generated face here would be the one thing on the deck that is a lie, and a
client who meets you will know. Use your own photograph.

---

## Unused files

`src/assets/photos/hero-bg.jpg`, `stats-bg.jpg` and `texture.jpg` are left over
from the first design and are not referenced by any board. Nothing needs to
replace them; they can be deleted.

## The honest note

The picture that would do the most for this deck is not on this list. It is a
screenshot: the AI interviewer mid-interview, the marketing agent's dashboard,
a LifeLeads sequence with real numbers on it. Those are the only images that
prove the claims the boards make. Matcha is atmosphere, and a buyer reads
atmosphere as decoration. If you can get even one clean screenshot with the
client's name blurred, it belongs on the Projects board more than any of these.
