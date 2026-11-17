# Round two: the pictures I'd add next

The nine slots in `IMAGE-PROMPTS.md` are filled and live. These are the ones
the deck still wants, in the order I'd do them. Each says what it is for, what
layout change it needs, and the prompt to paste.

Same rules as round one: 35mm film, natural light, real photograph, no text in
frame, no screen text, no logos, no faces, no AI gloss. Any screen is closed,
angled away, dark, or blown out by glare. Everything is graded to grayscale by
the bake, so light matters and colour does not.

---

## First priority: the Projects board has no evidence

Four cards make four claims and show nothing. This is the weakest board on the
deck, and a buyer reads it as four paragraphs of assertion.

**A screenshot beats every prompt below.** The AI interviewer mid-interview,
the MIA dashboard, a LifeLeads sequence with real numbers, blurred where the
client's name shows. If you can get even two, use those and skip this section.
Photograph them off a screen if you cannot export them, or crop a capture to a
panel that carries no names. One real capture is worth four generated desks.

If you cannot, these four at least put an object next to each claim. They are
honest as atmosphere, not as proof, and I would caption them as objects rather
than as the product.

**Layout:** each card gets a small clipping pinned to its top corner, about
120px wide, rotated slightly, with the tape already used elsewhere. The
Projects board has the room; the cards shift down about 10px.

### `proj-1.jpg`, 4:5, AI Interviewer

> A smartphone propped upright in a stand on a desk beside a wired headset and
> a printed one-page list of questions with pencil ticks beside some of them,
> the phone screen dark and reflecting the window, shallow depth of field,
> hard side light, the rest of the desk falling into shadow.

### `proj-2.jpg`, 4:5, marketing agent

> A hand-drawn flow diagram on a large sheet of plain paper, boxes and arrows
> in pencil with several branches, a pen resting on top, photographed at a low
> angle across the desk so the far end of the sheet falls out of focus, strong
> light from one side.

### `proj-3.jpg`, 4:5, social desk

> Nine small printed photographs laid out in a three by three grid on a desk,
> slightly overlapping, a hand reaching in to move one of them, raking light
> from the left throwing shadows between the prints, shot from above at a
> slight angle.

### `proj-4.jpg`, 4:5, LifeLeads

> A printed list on a desk with a highlighter lying across it and several rows
> marked, a pen and a closed notebook beside it, shot close and tight so the
> page fills most of the frame and the writing is illegible, light from the
> right.

---

## Second: the Skills board is all type

Three services, no imagery at all. Three small polaroids down the right edge
would make it part of the same collage as the rest of the deck, and give each
service something concrete to sit next to.

**Layout:** a narrow fourth column on the right, one clipping per row, each
about 130px, alternating rotation. On a shorter viewport they drop out.

### `svc-4.jpg`, 4:5, executive and admin support

> A paper week-to-view desk diary open flat with several appointments written
> in and two crossed out, a pen across the spine, a cup at the edge of frame,
> photographed from directly above in soft daylight.

### `svc-5.jpg`, 4:5, AI automation

> A wall of small square sticky notes arranged in four neat columns, a few of
> them moved out of line, one hand placing another, side light making each
> note cast a small shadow, shot straight on, the writing on them illegible.

### `svc-6.jpg`, 4:5, social media management

> A month of printed social posts pinned to a cork board in a grid, corners
> curling, a few held with pins and one with tape, shot slightly from the side
> so the board recedes, daylight from a window to the left.

---

## Third: two small things

### `tex-2.jpg`, 4:5, a second grain

`svc-2` is the only texture on the deck and it repeats on four boards. One
more would stop the repeat reading as a pattern.

> Extreme macro of a manila folder's edge and the corner of the papers inside
> it, fibres visible, one corner bent, raking light, filling the whole frame,
> almost abstract, no text.

### `ct-1.jpg`, 4:5, the Contact board

The last board before the end is all type and a headshot. One object would
close the deck the way the cover opens it.

> A hand writing on a small notepad beside a closed laptop at the end of the
> day, only the hand and the pad in frame, warm low light from one lamp, the
> writing illegible, everything else dark.

---

## How to add them

The bake normalises exposure now, so a brighter or darker generation of the
same subject lands in the same place on the sheet. For each new file:

1. Save it to `src/assets/.orig/` under its filename from this document.
2. Add it to `EXPOSURE` in `scripts/bake-cuttings.mjs` as `"proj-1.jpg":
   "photo"` (or `"grain"` for `tex-2.jpg`).
3. `node scripts/bake-cuttings.mjs`, then `npm run build`.

Send them over and I'll wire the layout changes for whichever ones you
generate. The Projects four are the ones that change what the deck is worth.
