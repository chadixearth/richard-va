/* ═══════════════════════════════════════════════════════════════
   BACKDROP — the graph paper under every board

   One <canvas> per board, one gsap.ticker callback for all of them.
   Only boards that are on screen are drawn.

   1. GRID     rules itself in, in pen, the first time a board enters
               (verticals top→bottom, horizontals left→right, staggered),
               then drifts very slowly on the diagonal.
   2. CONTOURS 8 flowing topographic lines, some dashed. Their shape is a
               few summed sines; they advance with time and with the
               (eased) scroll velocity.
   3. POINTER  near the cursor the lines part and bulge away and the grid
               warps. The pointer is lerped, so nothing ever snaps.

   Nothing is allocated in the draw path: point buffers are typed arrays
   sized at resize, and the pointer warp writes into two module vars.
   ═══════════════════════════════════════════════════════════════ */

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* ── tuning ──────────────────────────────────────────────────── */
const CELL = 30; //            graph-paper cell, css px
const DPR_CAP = 1.5;
const N_LINES = 8; //          contour lines per board
const X_STEP = 14; //          contour sample spacing, css px
const GRID_STEP = 20; //       sample spacing along a grid line when warped
const RADIUS = 190; //         pointer influence, css px
const DRAW_IN = 1.2; //        seconds one grid line takes to rule in
const DRAW_SPREAD = 0.55; //   seconds across which the lines are staggered
const A_GRID = 0.055;
const A_LINE = 0.13;
const A_THICK = 0.17;
const A_DASH = 0.12;
const IDLE_DT = 1 / 30; //     no pointer, no scroll: 30 fps is plenty

const DASH = [5, 8];
const SOLID: number[] = [];

/* params per line: y0, amp1, ph1, amp2, ph2, amp3, ph3, thick(0/1), dash(0/1) */
const P = 9;

interface Field {
  slide: HTMLElement;
  cv: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  dpr: number;
  rgb: string; //            "r,g,b" of the pen on this board's ground
  on: boolean; //            on screen right now
  seen: boolean; //          has ruled its grid in already
  t0: number; //             ticker time of first entry
  dirty: boolean; //         needs a draw even if idle
  lastDraw: number;
  // pointer (css px, canvas space)
  hover: boolean;
  cx: number; //             last client coords
  cy: number;
  rx: number; //             cached rect
  ry: number;
  rw: number;
  rh: number;
  rectDirty: boolean;
  tx: number; //             target
  ty: number;
  px: number; //             eased
  py: number;
  ps: number; //             eased strength 0..1
  // fixed per-board character
  f1: number;
  f2: number;
  f3: number;
  s1: number;
  s2: number;
  s3: number;
  lines: Float32Array; //    N_LINES * P
  ys: Float32Array; //       one contour's sampled y values
}

const fields: Field[] = [];
let wx = 0; // warp output (see warp())
let wy = 0;

/* scroll state shared by every board */
let lastScroll = 0;
let scrollV = 0; //          eased px per tick
let scrollPh = 0; //         accumulated contour phase

/* ── helpers ─────────────────────────────────────────────────── */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** "r,g,b" for a css colour via the 2d context parser, so any syntax works */
function rgbOf(color: string, fallback: string): string {
  const m = color.match(/\d+(\.\d+)?/g);
  if (!m || m.length < 3) return fallback;
  return `${Math.round(+m[0])},${Math.round(+m[1])},${Math.round(+m[2])}`;
}

function hexToRgb(hex: string): string {
  const h = hex.trim().replace("#", "");
  if (h.length !== 6) return "62,122,30";
  const n = parseInt(h, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

function luminance(rgb: string): number {
  const [r, g, b] = rgb.split(",").map(Number);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/** Pointer warp: pushes (x, y) away from (px, py) inside RADIUS.
    Writes wx, wy. `k` is the peak displacement in px. */
function warp(x: number, y: number, px: number, py: number, s: number, k: number) {
  const dx = x - px;
  const dy = y - py;
  wx = x;
  wy = y;
  if (dx > RADIUS || dx < -RADIUS || dy > RADIUS || dy < -RADIUS) return;
  const d2 = dx * dx + dy * dy;
  if (d2 >= RADIUS * RADIUS) return;
  const d = Math.sqrt(d2) || 1;
  const u = 1 - d / RADIUS;
  const f = u * u * (3 - 2 * u) * k * s; // smoothstep falloff
  wx = x + (dx / d) * f;
  wy = y + (dy / d) * f;
}

/* ── per-board setup ─────────────────────────────────────────── */
function seedLines(f: Field, seed: number) {
  const r = rng(seed * 9973 + 17);
  f.f1 = (Math.PI * 2) / (620 + r() * 360);
  f.f2 = (Math.PI * 2) / (260 + r() * 180);
  f.f3 = (Math.PI * 2) / (130 + r() * 90);
  f.s1 = 0.05 + r() * 0.04;
  f.s2 = 0.08 + r() * 0.05;
  f.s3 = 0.12 + r() * 0.06;
  const base = r() * 6.28;
  for (let k = 0; k < N_LINES; k++) {
    const o = k * P;
    f.lines[o] = (k + 0.5 + (r() - 0.5) * 0.35) / N_LINES; // y0 as 0..1 of height
    f.lines[o + 1] = 0.045 + r() * 0.035; //  amp1 as fraction of height
    f.lines[o + 2] = base + k * 0.42; //     ph1 — shared drift, so lines nest
    f.lines[o + 3] = 0.014 + r() * 0.012; // amp2
    f.lines[o + 4] = base * 1.7 + k * 0.9;
    f.lines[o + 5] = 0.005 + r() * 0.005; // amp3
    f.lines[o + 6] = r() * 6.28;
    f.lines[o + 7] = k % 3 === 0 ? 1 : 0; // every third is a heavier index contour
    f.lines[o + 8] = k % 3 === 1 ? 1 : 0; // the next is dashed
  }
}

function size(f: Field, w: number, h: number) {
  f.dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
  f.w = w;
  f.h = h;
  f.cv.width = Math.max(1, Math.round(w * f.dpr));
  f.cv.height = Math.max(1, Math.round(h * f.dpr));
  f.ctx.setTransform(f.dpr, 0, 0, f.dpr, 0, 0);
  f.ctx.lineJoin = "round";
  f.ctx.lineCap = "round";
  const need = Math.ceil(w / X_STEP) + 2;
  if (f.ys.length < need) f.ys = new Float32Array(need);
  f.dirty = true;
  f.rectDirty = true;
}

/* ── drawing ─────────────────────────────────────────────────── */
function ease(p: number): number {
  const q = 1 - p;
  return 1 - q * q * q;
}

function drawGrid(f: Field, t: number, age: number) {
  const { ctx, w, h } = f;
  const nx = Math.ceil(w / CELL) + 1;
  const ny = Math.ceil(h / CELL) + 1;
  const ox = (t * 1.5) % CELL; //  slow diagonal drift
  const oy = (t * 0.95) % CELL;
  const warped = f.ps > 0.01;
  const { px, py, ps } = f;

  ctx.globalAlpha = A_GRID;
  ctx.lineWidth = 1;
  ctx.beginPath();

  /* verticals rule top→bottom, horizontals left→right */
  for (let i = 0; i < nx; i++) {
    const p = Math.min(1, Math.max(0, (age - (i / nx) * DRAW_SPREAD) / DRAW_IN));
    if (p <= 0) continue;
    const x = ox + i * CELL;
    const end = ease(p) * h;
    if (!warped) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, end);
    } else {
      warp(x, 0, px, py, ps, 12);
      ctx.moveTo(wx, wy);
      let y = GRID_STEP;
      for (; y < end; y += GRID_STEP) {
        warp(x, y, px, py, ps, 12);
        ctx.lineTo(wx, wy);
      }
      warp(x, end, px, py, ps, 12);
      ctx.lineTo(wx, wy);
    }
  }
  for (let j = 0; j < ny; j++) {
    const p = Math.min(1, Math.max(0, (age - (j / ny) * DRAW_SPREAD - 0.12) / DRAW_IN));
    if (p <= 0) continue;
    const y = oy + j * CELL;
    const end = ease(p) * w;
    if (!warped) {
      ctx.moveTo(0, y);
      ctx.lineTo(end, y);
    } else {
      warp(0, y, px, py, ps, 12);
      ctx.moveTo(wx, wy);
      let x = GRID_STEP;
      for (; x < end; x += GRID_STEP) {
        warp(x, y, px, py, ps, 12);
        ctx.lineTo(wx, wy);
      }
      warp(end, y, px, py, ps, 12);
      ctx.lineTo(wx, wy);
    }
  }
  ctx.stroke();
}

/** Strokes one batch of contours: pass 0 = thin solid, 1 = thick solid, 2 = dashed. */
function drawContours(f: Field, t: number, fade: number, pass: number) {
  const { ctx, w, h, ys, lines } = f;
  const n = Math.ceil(w / X_STEP) + 1;
  const hot = f.ps > 0.01;
  const { px, py, ps } = f;
  let any = false;

  ctx.beginPath();
  for (let k = 0; k < N_LINES; k++) {
    const o = k * P;
    const thick = lines[o + 7];
    const dash = lines[o + 8];
    const want = dash ? 2 : thick ? 1 : 0;
    if (want !== pass) continue;
    any = true;

    const yb = lines[o] * h;
    const a1 = lines[o + 1] * h;
    const a2 = lines[o + 3] * h;
    const a3 = lines[o + 5] * h;
    const p1 = lines[o + 2] + t * f.s1 + scrollPh;
    const p2 = lines[o + 4] - t * f.s2 - scrollPh * 1.6;
    const p3 = lines[o + 6] + t * f.s3 + scrollPh * 0.6;

    for (let i = 0; i < n; i++) {
      const x = i * X_STEP;
      ys[i] =
        yb +
        a1 * Math.sin(x * f.f1 + p1) +
        a2 * Math.sin(x * f.f2 + p2) +
        a3 * Math.sin(x * f.f3 + p3);
    }

    for (let i = 0; i < n; i++) {
      const x = i * X_STEP;
      let y = ys[i];
      let xx = x;
      if (hot) {
        const dx = x - px;
        const dy = y - py;
        if (dx < RADIUS && dx > -RADIUS && dy < RADIUS && dy > -RADIUS) {
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < RADIUS) {
            /* part: lines bow away from the pointer, hardest right at it */
            const u = 1 - d / RADIUS;
            const sm = u * u * (3 - 2 * u);
            const side = dy / (Math.abs(dy) + 22); // -1..1, 0 when exactly through it
            y += side * sm * ps * 46;
            xx += (dx / (d || 1)) * sm * ps * 6;
          }
        }
      }
      if (i === 0) ctx.moveTo(xx, y);
      else ctx.lineTo(xx, y);
    }
  }
  if (!any) return;

  if (pass === 2) {
    ctx.setLineDash(DASH);
    ctx.lineDashOffset = -t * 6;
    ctx.globalAlpha = A_DASH * fade;
    ctx.lineWidth = 1.1;
  } else if (pass === 1) {
    ctx.globalAlpha = A_THICK * fade;
    ctx.lineWidth = 1.5;
  } else {
    ctx.globalAlpha = A_LINE * fade;
    ctx.lineWidth = 1;
  }
  ctx.stroke();
  if (pass === 2) ctx.setLineDash(SOLID);
}

function render(f: Field, t: number) {
  const { ctx } = f;
  ctx.clearRect(0, 0, f.w, f.h);
  ctx.strokeStyle = `rgb(${f.rgb})`;
  const age = t - f.t0;
  drawGrid(f, t, age);
  /* the contours fade up after the grid has started to rule in */
  const fade = Math.min(1, Math.max(0, (age - 0.35) / 1.4));
  if (fade > 0) {
    drawContours(f, t, fade, 0);
    drawContours(f, t, fade, 1);
    drawContours(f, t, fade, 2);
  }
  ctx.globalAlpha = 1;
}

/* ── the one ticker ──────────────────────────────────────────── */
let running = false;

function tick(time: number, deltaMs: number) {
  const dt = Math.min(0.1, deltaMs / 1000);
  const sy = window.scrollY;
  const dS = sy - lastScroll;
  lastScroll = sy;
  /* eased velocity → contour phase */
  scrollV += (dS - scrollV) * (1 - Math.exp(-dt * 7));
  scrollPh += scrollV * 0.006;
  const scrolling = Math.abs(scrollV) > 0.05;

  /* pointer ease: frame-rate independent, never snaps */
  const kp = 1 - Math.exp(-dt * 9);
  const ks = 1 - Math.exp(-dt * 5);

  for (let i = 0; i < fields.length; i++) {
    const f = fields[i];
    if (!f.on) continue;

    if (f.hover) {
      if (f.rectDirty || dS !== 0) {
        const r = f.slide.getBoundingClientRect();
        f.rx = r.left;
        f.ry = r.top;
        f.rw = r.width || 1;
        f.rh = r.height || 1;
        f.rectDirty = false;
      }
      /* client → canvas space; the ratio absorbs the board's stack scale */
      f.tx = ((f.cx - f.rx) / f.rw) * f.w;
      f.ty = ((f.cy - f.ry) / f.rh) * f.h;
    }
    const goal = f.hover ? 1 : 0;
    const moving = Math.abs(f.tx - f.px) + Math.abs(f.ty - f.py) > 0.4 || Math.abs(goal - f.ps) > 0.003;
    f.px += (f.tx - f.px) * kp;
    f.py += (f.ty - f.py) * kp;
    f.ps += (goal - f.ps) * ks;
    if (!f.hover && f.ps < 0.003) f.ps = 0;

    if (!(moving || scrolling || f.dirty || time - f.t0 < DRAW_IN + DRAW_SPREAD + 0.5) && time - f.lastDraw < IDLE_DT) continue;
    f.lastDraw = time;
    f.dirty = false;
    render(f, time);
  }
}

function start() {
  if (running) return;
  running = true;
  lastScroll = window.scrollY;
  gsap.ticker.add(tick);
}

function stop() {
  if (!running) return;
  running = false;
  gsap.ticker.remove(tick);
}

/* ── public ──────────────────────────────────────────────────── */
export function backdrop(slides: HTMLElement[]): void {
  if (!slides.length) return;

  const pen = hexToRgb(
    getComputedStyle(document.documentElement).getPropertyValue("--pen") || "#3E7A1E",
  );
  const powder = hexToRgb(
    getComputedStyle(document.documentElement).getPropertyValue("--powder") || "#A6D92F",
  );

  slides.forEach((slide, idx) => {
    const cv = document.createElement("canvas");
    cv.className = "slide__field";
    cv.setAttribute("aria-hidden", "true");
    /* zoom:1 beats `.stacked .slide > *` (the --fit safety net) so the
       canvas is never scaled by it */
    cv.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;zoom:1";
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    slide.insertBefore(cv, slide.firstChild);

    /* on a dark ground the pen would vanish; use the powder there */
    const bg = rgbOf(getComputedStyle(slide).backgroundColor, "246,243,232");
    const rgb = luminance(bg) < 0.35 ? powder : pen;

    const f: Field = {
      slide, cv, ctx,
      w: 0, h: 0, dpr: 1, rgb,
      on: false, seen: false, t0: 0, dirty: true, lastDraw: 0,
      hover: false, cx: 0, cy: 0, rx: 0, ry: 0, rw: 1, rh: 1, rectDirty: true,
      tx: 0, ty: 0, px: 0, py: 0, ps: 0,
      f1: 0, f2: 0, f3: 0, s1: 0, s2: 0, s3: 0,
      lines: new Float32Array(N_LINES * P),
      ys: new Float32Array(0),
    };
    seedLines(f, idx + 1);
    fields.push(f);

    /* size from the observer only; nothing reads layout per frame */
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      const w = Math.round(r.width);
      const h = Math.round(r.height);
      if (w > 0 && h > 0 && (w !== f.w || h !== f.h)) size(f, w, h);
    });
    ro.observe(slide);

    slide.addEventListener("pointerenter", (e) => {
      f.hover = true;
      f.cx = e.clientX;
      f.cy = e.clientY;
      f.rectDirty = true;
      /* start under the pointer with strength 0, so it fades in rather than sweeps in */
      const r = slide.getBoundingClientRect();
      f.rx = r.left;
      f.ry = r.top;
      f.rw = r.width || 1;
      f.rh = r.height || 1;
      f.rectDirty = false;
      f.tx = f.px = ((f.cx - f.rx) / f.rw) * f.w;
      f.ty = f.py = ((f.cy - f.ry) / f.rh) * f.h;
    });
    slide.addEventListener("pointermove", (e) => {
      f.cx = e.clientX;
      f.cy = e.clientY;
    });
    slide.addEventListener("pointerleave", () => {
      f.hover = false;
    });

    ScrollTrigger.create({
      trigger: slide,
      start: "top bottom",
      end: "bottom top",
      onToggle: (self) => {
        f.on = self.isActive;
        if (f.on) {
          if (!f.seen) {
            f.seen = true;
            f.t0 = gsap.ticker.time;
          }
          f.dirty = true;
          f.rectDirty = true;
          start();
        } else if (!fields.some((o) => o.on)) {
          stop();
        }
      },
    });
  });
}
