/* Bake the deck's photocopy exposures into the image files.
 *
 * Every picture on the deck is printed into the paper with `mix-blend-mode:
 * multiply` and used to carry its exposure as a live CSS `filter`. Running
 * grayscale, contrast and invert over 2.7 megapixels on every repaint made
 * scrolling expensive, so the exposure is applied to the file once instead.
 *
 * Put an ungraded picture in src/assets/.orig/ under the filename of the slot
 * it replaces, then run:
 *
 *     node scripts/bake-cuttings.mjs
 *
 * It writes the graded copy to src/assets/ and leaves .orig untouched, so the
 * grade can be re-run or changed. Never point this at an already-baked file;
 * the exposure compounds.
 *
 * The chains match the ones documented at the `.cut` rule in global.css:
 *   base  grayscale(1) contrast(1.48) brightness(1.52)
 *   hard  grayscale(1) contrast(1.9)  brightness(1.4)
 *   bot   grayscale(1) invert(1) contrast(1.25) brightness(1.05)
 *
 * CSS applies them in that order to a channel in 0..1, and an invert is just a
 * sign flip on the input, so the whole chain collapses to one straight line:
 *
 *   plain     out = ((in - 0.5) * c + 0.5) * b  =  in * (c * b) + b * (0.5 - 0.5c)
 *   inverted  out = ((1 - in - 0.5) * c + 0.5) * b  =  in * (-c * b) + b * (0.5 + 0.5c)
 *
 * which is one `linear(a, offset)` call with the offset in 0..255.
 *
 * Two things have to be right or the result drifts away from what the browser
 * drew. CSS `filter` works on gamma-encoded sRGB, so the grey has to be mixed
 * with `recomb` (a straight Rec.709 matrix on the stored values) rather than
 * `grayscale()`, which converts through linear light and comes out about 3%
 * too bright. And the invert has to be folded into the line as the sign of
 * `a`; running `negate()` separately lands about 8 levels off.
 *
 * Checked against the browser's own render of the same chain: every slot
 * within 0.5 of 255 on the mean.
 */

import { readdirSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const orig = join(root, "src", "assets", ".orig");
const assets = join(root, "src", "assets");

/* which exposure each slot carries, by filename */
const EXPOSURE = {
  "work-1.jpg": "base",
  "work-2.jpg": "base",
  "work-3.jpg": "base",
  "work-4.jpg": "base",
  "svc-1.jpg": "base",
  "richard-headshot.jpg": "base",
  "richard-cutout.png": "hard",
  "svc-2.jpg": "bot",
  "svc-3.jpg": "bot",
};

/* where each slot lives, relative to src/assets */
const DEST = {
  "richard-cutout.png": "richard-cutout.png",
  "richard-headshot.jpg": "richard-headshot.jpg",
};
const destOf = (name) => join(assets, DEST[name] ?? join("photos", name));

const CHAIN = {
  base: { invert: false, contrast: 1.48, brightness: 1.52 },
  hard: { invert: false, contrast: 1.9, brightness: 1.4 },
  bot: { invert: true, contrast: 1.25, brightness: 1.05 },
};

/* Rec.709 luma, applied to the stored sRGB values: CSS `grayscale(1)` */
const L = [0.2126, 0.7152, 0.0722];
const LUMA = [L, L, L];

if (!existsSync(orig)) {
  mkdirSync(orig, { recursive: true });
  console.error(`No ungraded files yet. Put one in ${orig} and run this again.`);
  process.exit(1);
}

const files = readdirSync(orig).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
if (!files.length) {
  console.error(`Nothing to bake in ${orig}.`);
  process.exit(1);
}

let done = 0;
for (const name of files) {
  const which = EXPOSURE[basename(name)];
  if (!which) {
    console.warn(`skip  ${name}  (not a slot the deck uses; see IMAGE-PROMPTS.md)`);
    continue;
  }
  const { invert, contrast, brightness } = CHAIN[which];
  const a = (invert ? -1 : 1) * contrast * brightness;
  const b = 255 * brightness * (0.5 + (invert ? 0.5 : -0.5) * contrast);

  const img = sharp(join(orig, name)).recomb(LUMA).linear(a, b);

  const out = destOf(basename(name));
  const buf = name.toLowerCase().endsWith(".png")
    ? await img.png({ compressionLevel: 9 }).toBuffer()
    : await img.jpeg({ quality: 92, mozjpeg: true }).toBuffer();
  await sharp(buf).toFile(out);

  console.log(`bake  ${name}  ->  ${out.slice(root.length + 1)}  [${which}]`);
  done++;
}

console.log(done ? `\n${done} baked. Run \`npm run build\`.` : "\nNothing baked.");
