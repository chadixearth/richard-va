# Image prompts for the deck

Nine picture slots. Matcha is the colour system (the green, the cream paper,
the grain), not the subject. Every photograph should show the work: a desk, a
plan, a printed report, a headset, the end of a long day. The green does the
theming; the pictures do the proving.

Two of the nine stay real photographs of you and should not be generated:
`src/assets/richard-cutout.png` (the figure on the cover) and
`src/assets/richard-headshot.jpg` (the pinned polaroid on About).

## How the deck treats a picture

Every picture is printed into the paper: grayscale, pushed to a high-contrast
photocopy, laid over the cream sheet so the whites disappear into the page.
That exposure is baked into the file, so a new image has to be baked before it
looks right.

1. Generate the image.
2. Save it into `src/assets/.orig/` under the exact filename of the slot you
   are replacing, for example `src/assets/.orig/work-1.jpg`.
3. Run `node scripts/bake-cuttings.mjs`.
4. `npm run build`.

The originals stay in `.orig` untouched, so the bake can be re-run. Never bake
a file twice; the exposure compounds.

Because everything ends up black and white, colour in the source does not
matter. Light does. Ask for one strong light and deep shadow, every time.

## Say this at the end of every prompt

> Shot on 35mm film, natural light, shallow depth of field, real photograph,
> candid, no text anywhere in frame, no screen text, no logos, no watermark,
> no faces, muted colour, no HDR, no AI gloss, no 3D render.

Screens are the thing that gives a generated image away: a model writes
gibberish into every interface. So in every prompt that involves a laptop, the
screen is closed, angled away, dark, blown out by glare, or thrown out of
focus. Never ask for a readable interface.

Generate 4:5 portrait unless the slot says otherwise. Bigger is better; the
build downsamples.

---

## 1. `work-1.jpg`, 4:5 portrait

**Where:** the `07:00` polaroid on the Day board, and the `week one` polaroid
on the Method board.
**What it has to say:** the first hour. Mail triaged before the client is
awake.

> Close shot of a desk at seven in the morning, hands resting on a laptop
> keyboard, the screen tilted away from camera and out of focus, an open paper
> planner beside it with a handwritten list and three items already ticked
> off, a mug of tea at the edge of frame, hard window light from the left,
> the rest of the room dark.

## 2. `work-2.jpg`, 1:1 square

**Where:** the `The desk` polaroid on the cover, and the snapshot pinned to
the Projects header.
**What it has to say:** this is the desk your week is run from.

> Directly overhead shot of a working desk, everything squared up: a closed
> laptop, a wired headset coiled beside it, a paper notebook open to a
> handwritten weekly grid, a pen laid across it, a phone face down, a mug on
> a coaster, strong side light casting long shadows across the wood, nothing
> branded.

## 3. `work-3.jpg`, 4:5 portrait

**Where:** the `14:00` polaroid on the Day board, and the clipping on the
footer.
**What it has to say:** the afternoon. Work going out, not work being planned.

> Low angle across a desk in the afternoon, a headset resting on a stack of
> printed pages covered in handwritten margin notes and highlighter marks, a
> pen on top, a second monitor behind thrown completely out of focus with its
> screen reduced to a soft glow, raking light from the right.

## 4. `work-4.jpg`, 4:5 portrait

**Where:** the first polaroid on the cover, and the clipping on the Numbers
board. This is the first photograph anyone sees, so it carries the most.
**What it has to say:** the day starts before anyone asks for anything.

> A home office desk at six in the morning, one desk lamp throwing a hard pool
> of light, a laptop open at a sharp angle so the screen reads only as glare,
> an open notebook with a handwritten list of tasks, a cup of tea steaming,
> the window behind still dark, shot from the side, deep shadow everywhere
> else.

## 5. `svc-1.jpg`, 4:5 portrait

**Where:** the `Class of 2026` polaroid beside the education block on Resume.
**What it has to say:** finishing something long. It sits next to a degree.

> A university desk late at night at the end of a long piece of work: a thick
> stack of bound printed pages squared up on the left, a closed laptop, a cold
> cup, a few textbooks stacked flat, a desk lamp throwing one hard pool of
> light, the room behind it black.

## 6. `svc-2.jpg`, 4:5 portrait, texture only

**Where:** the pale ghost bleeding off the corner of the Day, Toolkit, Skills
and Footer boards. It is inverted, masked to a soft ellipse and dropped to 75%
opacity, so only the pattern survives.
**What it has to say:** nothing literal. It is paper grain on paper.

> Extreme macro of the edge of a thick stack of printed paper seen almost
> side on, every sheet a separate line, raking light picking out the ridges,
> the whole frame filled, no desk, no hands, no context, almost abstract.

## 7. `svc-3.jpg`, 4:5 portrait, texture only

**Where:** the most-used picture on the deck. The ghost at the corner of
About, Contact, Cover, Footer, Method, Numbers, Projects, Resume and Skills.
Inverted and masked, so it reads as a pale watermark under the type.
**What it has to say:** a week, on paper. Inverted, the ruled grid becomes a
faint schedule printed into the sheet.

> A paper desk diary open flat and photographed from directly above, a weekly
> grid of ruled boxes with handwritten entries in a few of them, a couple of
> items crossed out, soft even light, no shadow, the page filling the whole
> frame, no legible words.

If you want to keep one botanical note for the green, this is the only slot
where it belongs; a single tea leaf branch laid flat like a specimen sheet
will still work here. Everywhere else, plants are decoration.

---

## The two that must stay real

**`richard-cutout.png`.** You in a suit, cut out against transparency. The
deck knocks it to near-solid ink, so what it needs is a clean edge, not a nice
background. A phone photo against a plain wall with the background removed is
the right input. Keep the alpha channel, save as PNG.

**`richard-headshot.jpg`.** Square, head and shoulders, pinned as a polaroid
on About with your signature under it.

A generated face is the one thing on this deck a client could catch you on.

---

## Do not generate

- Anything with readable text on a screen. It is always wrong and it always
  reads as AI.
- Robots, glowing brains, circuit boards, blue holograms, floating interfaces.
- Handshakes, headset call-centre stock, a person pointing at a chart.
- Sparkles, glows, lens flares, anything that says "AI" as a graphic.
- Matcha bowls, whisks and tea ceremonies. That is the palette's job, not the
  photography's.

## Unused files

`src/assets/photos/hero-bg.jpg`, `stats-bg.jpg` and `texture.jpg` are left
over from the first design and are referenced by nothing. They can be deleted.

## The one that would beat all of these

A screenshot. The AI interviewer mid-interview, the marketing agent's
dashboard, a LifeLeads sequence with real numbers on it. Those are the only
images that prove what the Projects board claims, and a generated desk cannot
do that job. One clean capture with the client's name blurred is worth more
than the nine above.
