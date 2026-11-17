/* Bake the deck's photocopy exposure into the image files.
 *
 * Every picture on the deck is printed into the paper with `mix-blend-mode:
 * multiply`, and used to carry its exposure as a live CSS `filter`. Filtering
 * megapixels on every repaint made the scroll expensive, so the exposure is
 * applied to the file once instead.
 *
 * Put an ungraded picture in src/assets/.orig/ under the filename of the slot
 * it replaces, then run:
 *
 *     node scripts/bake-cuttings.mjs
 *
 * It writes the graded copy into src/assets/ and leaves .orig alone, so the
 * grade can be re-run or retuned. Never point it at an already-baked file;
 * the exposure compounds.
 *
 * ── why this is not just contrast and brightness ──
 *
 * A generated photograph arrives at whatever exposure the model felt like. A
 * dark 6am desk sits at a median of 30 of 255; the ruled diary page sits at
 * 190. Pushing both through one fixed contrast curve crushes the first to
 * black and leaves the second grey, because contrast pivots around mid grey
 * and neither of them is anywhere near it.
 *
 * So each slot declares the tone it should land on, and the bake finds the
 * gamma that puts the image's median there:
 *
 *     e = ln(target) / ln(median)      then      out = in ^ e
 *
 * and only then applies contrast, pivoted on the target rather than on 0.5 so
 * the level it just set survives:
 *
 *     out = (out - target) * contrast + target
 *
 * That makes the grade exposure-independent: drop in a brighter or darker
 * photograph of the same subject and it lands in the same place on the sheet.
 *
 * The two slots that are not generated (the cutout and the headshot) keep the
 * original fixed chain, so the figure on the cover does not move:
 *
 *     grayscale(1) contrast(c) brightness(b)
 *       = in * (c * b) + b * (0.5 - 0.5c)
 *
 * one `linear(a, offset)` with the offset in 0..255.
 *
 * Grey is mixed with `recomb` (a Rec.709 matrix straight across the stored
 * sRGB values) rather than `grayscale()`, which converts through linear light
 * and comes out about 3% too bright.
 */

import { readdirSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const orig = join(root, "src", "assets", ".orig");
const assets = join(root, "src", "assets");

/* which grade each slot carries */
const EXPOSURE = {
  "work-1.jpg": "photo",
  "work-2.jpg": "photo",
  "work-3.jpg": "photo",
  "work-4.jpg": "photo",
  "svc-1.jpg": "photo",
  "svc-2.jpg": "grain",
  "svc-3.jpg": "page",
  "richard-headshot.jpg": "fixedSoft",
  "richard-cutout.png": "fixedHard",
};

/* where each slot lives, relative to src/assets */
const DEST = {
  "richard-cutout.png": "richard-cutout.png",
  "richard-headshot.jpg": "richard-headshot.jpg",
};
const destOf = (name) => join(assets, DEST[name] ?? join("photos", name));

const CHAIN = {
  /* a clipping pinned to the sheet: reads as a photocopy of a photograph */
  photo: { target: 0.46, contrast: 1.4 },
  /* the paper-grain ghost bleeding off a corner, at 75% opacity under a mask */
  grain: { target: 0.85, contrast: 1.05 },
  /* the ruled-page ghost: almost white, with the rules left readable */
  page: { target: 0.93, contrast: 1.4 },
  /* the two real photographs of Richard, on the original fixed chain */
  fixedSoft: { contrast: 1.48, brightness: 1.52 },
  fixedHard: { contrast: 1.9, brightness: 1.4 },
};

/* Rec.709 luma across the stored sRGB values: CSS `grayscale(1)` */
const L = [0.2126, 0.7152, 0.0722];
const LUMA = [L, L, L];

const clamp = (x, lo, hi) => (x < lo ? lo : x > hi ? hi : x);

async function gradeAuto(src, { target, contrast }) {
  const grey = sharp(src).recomb(LUMA);
  const { data, info } = await grey.raw().toBuffer({ resolveWithObject: true });
  const ch = info.channels;

  /* median of the luma channel, on a sample rather than every pixel */
  const step = Math.max(1, Math.floor(data.length / ch / 40000)) * ch;
  const sample = [];
  for (let i = 0; i < data.length; i += step) sample.push(data[i]);
  sample.sort((a, b) => a - b);
  const median = clamp(sample[Math.floor(sample.length / 2)] / 255, 0.01, 0.99);

  const e = clamp(Math.log(target) / Math.log(median), 0.1, 4);

  const lut = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    const lifted = Math.pow(i / 255, e);
    lut[i] = clamp(Math.round(((lifted - target) * contrast + target) * 255), 0, 255);
  }
  for (let i = 0; i < data.length; i += ch) {
    const v = lut[data[i]];
    for (let c = 0; c < Math.min(3, ch); c++) data[i + c] = v;
  }

  return { img: sharp(data, { raw: info }), median, e };
}

function gradeFixed(src, { contrast, brightness }) {
  const a = contrast * brightness;
  const b = 255 * brightness * (0.5 - 0.5 * contrast);
  return { img: sharp(src).recomb(LUMA).linear(a, b) };
}

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
  const chain = CHAIN[which];
  const src = join(orig, name);
  const { img, median, e } = chain.target
    ? await gradeAuto(src, chain)
    : gradeFixed(src, chain);

  const out = destOf(basename(name));
  const buf = name.toLowerCase().endsWith(".png")
    ? await img.png({ compressionLevel: 9 }).toBuffer()
    : await img.jpeg({ quality: 92, mozjpeg: true }).toBuffer();
  await sharp(buf).toFile(out);

  const how = median === undefined
    ? "fixed"
    : `median ${(median * 255).toFixed(0)} lifted to ${(chain.target * 255).toFixed(0)}, gamma ${e.toFixed(2)}`;
  console.log(`bake  ${name.padEnd(22)} ${which.padEnd(10)} ${how}`);
  done++;
}

console.log(done ? `\n${done} baked. Run \`npm run build\`.` : "\nNothing baked.");
