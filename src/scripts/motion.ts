/* ═══════════════════════════════════════════════════════════════
   MOTION — "flipping through the deck"

   One idea, applied everywhere: this is a stack of printed boards
   on a desk, and you are flipping through it.

   1. STACK   — each board parks in the same frame; the next one climbs
                over it, and the one below shrinks and falls into shadow.
   2. HEAD    — display lines rise out of a mask, the pen word wipes on.
   3. DESK    — clippings, snapshots, tape and handwriting drop onto the
                page and overshoot, like pieces tossed down.
   4. DRIFT   — once a board is parked its pasted pieces keep moving.
   5. ALIVE   — the tool rows are marquees whose speed and direction
                answer your scroll.

   `prefers-reduced-motion` drops the whole file and shows a static page.
   ═══════════════════════════════════════════════════════════════ */

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger, SplitText);

type El = HTMLElement;

const doc = document;
const root = doc.documentElement;

const all = (sel: string, scope: ParentNode = doc): El[] =>
  Array.from(scope.querySelectorAll(sel)) as El[];
const one = (sel: string, scope: ParentNode = doc): El | null =>
  scope.querySelector(sel) as El | null;

/* The stylesheet only hides the reveal groups while this class is on, so a
   failed or skipped boot leaves a perfectly readable static page. */
root.classList.add("motion");

/* ── what moves, and in what order it is claimed ─────────────── */
const SEL = {
  /* any real heading counts, whichever display class a board happens to use */
  head: ":is(h1, h2, .d1, .d2, .cond):not(.script)",
  script: ".script",
  /* a marquee row is claimed whole: its track holds ~44 cloned chips and
     staggering them individually would take seconds and read as a bug */
  prop: ".snap, .scrib, .bleed, .tape, .tk__row",
  figure: ".skills__no, .method__no, .day__t, .num__fig, .day__dot, .resume__dot, .method__dot",
  copy: ".rail > *, .lede, .body-s, .d3, .label, .ct__v, .num__l, .ft__a, .resume__edutxt > *",
  chip: ".pill",
};

/* Claim each element once, outermost first, so a polaroid animates as one
   object instead of fighting with its own caption. */
function groups(slide: El) {
  const used = new Set<Element>();
  const take = (sel: string): El[] => {
    const out: El[] = [];
    for (const el of all(sel, slide)) {
      if (used.has(el)) continue;
      let p: Element | null = el.parentElement;
      let nested = false;
      while (p && p !== slide) {
        if (used.has(p)) { nested = true; break; }
        p = p.parentElement;
      }
      if (nested) continue;
      used.add(el);
      out.push(el);
    }
    return out;
  };
  return {
    heads: take(SEL.head),
    scripts: take(SEL.script),
    props: take(SEL.prop),
    figures: take(SEL.figure),
    copy: take(SEL.copy),
    chips: take(SEL.chip),
  };
}

const CLIP_HIDDEN = "inset(-25% 100% -25% -8%)";
const CLIP_SHOWN = "inset(-25% -8% -25% -8%)";

/* Masked line-rise. An inline target is promoted to inline-block first so the
   line boxes SplitText injects do not break the flow it sits in. */
function splitLines(els: El[]): El[] {
  const lines: El[] = [];
  for (const el of els) {
    if (getComputedStyle(el).display === "inline") el.style.display = "inline-block";
    const split = SplitText.create(el, {
      type: "lines",
      mask: "lines",
      linesClass: "m-line",
      autoSplit: false,
    });
    lines.push(...(split.lines as El[]));
  }
  return lines;
}

/* ── 1. the stack ────────────────────────────────────────────── */
function stack() {
  const deck = one(".deck");
  if (!deck) return;
  const slides = all(":scope > .slide", deck);
  if (slides.length < 2) return;

  /* below 1000×700 there is no honest way to fit a board without scaling the
     type past readable, so the stack switches off and the deck scrolls as
     ordinary sections */
  gsap.matchMedia().add("(min-width: 1000px) and (min-height: 700px)", () => {
    root.classList.add("stacked");

    const nav = one(".nav");

    /* Every board is the same size and parks in the same frame, so no panel
       is ever half on screen or sliced by the nav. A panel whose content
       still runs past the frame is scaled down to fit (`--fit`) rather than
       clipped — the net, not the budget: panels are authored to fit. */
    const place = () => {
      const vh = window.innerHeight;
      const gap = parseFloat(getComputedStyle(deck).paddingTop) || 12;
      const park = Math.round((nav ? nav.offsetHeight : 0) + gap * 0.5);
      const board = Math.round(vh - park - gap);
      root.style.setProperty("--park", `${park}px`);
      root.style.setProperty("--board", `${board}px`);
      /* the still beat a board gets before the next one climbs over it */
      root.style.setProperty("--hold", `${Math.round(vh * 0.3)}px`);

      for (const s of slides) {
        s.style.setProperty("--fit", "1");
        const cs = getComputedStyle(s);
        const chrome = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
        s.style.height = "auto";
        s.style.justifyContent = "flex-start";
        const natural = s.getBoundingClientRect().height - chrome;
        s.style.height = "";
        s.style.justifyContent = "";
        const room = board - chrome;
        const fit = natural > room ? Math.max(0.76, room / natural) : 1;
        s.style.setProperty("--fit", fit.toFixed(4));
      }
    };
    place();

    /* The board's dim sheet is a real element so the stack tween can animate
       `opacity` on the compositor. Animating `--dim` instead invalidated the
       style of every node in the board on every scroll frame. */
    const dims = slides.map((s) => {
      const d = doc.createElement("div");
      d.className = "slide__dim";
      d.setAttribute("aria-hidden", "true");
      s.appendChild(d);
      return d;
    });

    /* Each board is pushed back by the one arriving on top of it. */
    const tweens = slides.slice(0, -1).map((s, i) =>
      gsap
        .timeline({
          scrollTrigger: {
            trigger: slides[i + 1],
            start: "top bottom",
            end: "top top",
            scrub: 0.25,
            invalidateOnRefresh: true,
          },
        })
        .to(s, { scale: 0.945, yPercent: -1.1, ease: "none", transformOrigin: "50% 30%" }, 0)
        .to(dims[i], { opacity: 0.4, ease: "none" }, 0)
    );

    ScrollTrigger.addEventListener("refreshInit", place);
    return () => {
      ScrollTrigger.removeEventListener("refreshInit", place);
      for (const t of tweens) {
        t.scrollTrigger?.kill();
        t.kill();
      }
      for (const d of dims) d.remove();
      for (const s of slides) {
        s.style.removeProperty("--fit");
        gsap.set(s, { clearProps: "transform" });
      }
      for (const v of ["--park", "--board", "--hold"]) root.style.removeProperty(v);
      root.classList.remove("stacked");
    };
  });
}

/* ── 2. one choreographed entrance per board ─────────────────── */
function revealSlide(slide: El) {
  const g = groups(slide);
  /* a marquee row is a band, not an object on a desk: it slides in flat
     instead of being tossed down at an angle */
  const rows = g.props.filter((p) => p.classList.contains("tk__row"));
  const props = g.props.filter((p) => !p.classList.contains("tk__row"));
  const lines = splitLines(g.heads);
  const marks = all(".mark", slide);
  const no = one(".slide__no", slide);

  gsap.set(lines, { yPercent: 118, rotate: 2.4, opacity: 0 });
  gsap.set(g.scripts, { clipPath: CLIP_HIDDEN, y: 14 });
  gsap.set(props, { y: -38, opacity: 0, scale: 0.94, rotate: "-=8" });
  gsap.set(rows, { y: -26, opacity: 0 });
  gsap.set(g.figures, { yPercent: 46, opacity: 0, scale: 0.88, transformOrigin: "0% 100%" });
  gsap.set(g.copy, { y: 18, opacity: 0 });
  gsap.set(g.chips, { y: 10, opacity: 0, scale: 0.92 });
  gsap.set(marks, { "--swipe": "0%" });
  if (no) gsap.set(no, { opacity: 0, x: -12 });

  (one(".rv", slide) || slide).classList.add("ready");

  const tl = gsap.timeline({
    defaults: { duration: 0.95, ease: "expo.out" },
    scrollTrigger: { trigger: slide, start: "top 82%", once: true },
    onComplete: () => pointerDrift(slide),
  });

  if (no) tl.to(no, { opacity: 0.45, x: 0, duration: 0.6, ease: "power2.out" }, 0);
  tl.to(lines, { yPercent: 0, rotate: 0, opacity: 1, duration: 1.05, stagger: 0.075 }, 0.04);
  tl.to(
    props,
    {
      y: 0,
      opacity: 1,
      scale: 1,
      rotate: "+=8",
      duration: 1.15,
      ease: "back.out(1.3)",
      stagger: { each: 0.07, from: "random" },
    },
    0.1
  );
  tl.to(rows, { y: 0, opacity: 1, duration: 0.95, ease: "power3.out", stagger: 0.08 }, 0.18);
  tl.to(
    g.scripts,
    { clipPath: CLIP_SHOWN, y: 0, duration: 1.15, ease: "power2.inOut", stagger: 0.12 },
    0.2
  );
  tl.to(
    g.figures,
    { yPercent: 0, opacity: 1, scale: 1, duration: 0.85, ease: "back.out(1.7)", stagger: 0.055 },
    0.24
  );
  tl.to(g.copy, { y: 0, opacity: 1, duration: 0.8, stagger: 0.035 }, 0.32);
  tl.to(
    g.chips,
    {
      y: 0,
      opacity: 1,
      scale: 1,
      duration: 0.55,
      ease: "back.out(2)",
      stagger: { amount: Math.min(0.9, g.chips.length * 0.022) },
    },
    0.44
  );
  if (marks.length)
    tl.to(marks, { "--swipe": "100%", duration: 0.85, ease: "power2.inOut" }, 0.55);

  draws(slide);
  parallax(slide, props);
}

/* ── 3. drift: props keep moving while the board is pinned ───── */
function parallax(slide: El, props: El[]) {
  const movers = props.filter((p) => !p.classList.contains("tape"));
  movers.forEach((p, i) => {
    const depth = [-9, 6, -5, 8, -7][i % 5];
    gsap.to(p, {
      yPercent: depth,
      ease: "none",
      scrollTrigger: { trigger: slide, start: "top bottom", end: "bottom top", scrub: 0.7 },
    });
  });
}

/* ── 3b. the page answers the cursor ──────────────────────────

   Purpose (R-19): a collage is physical, so the pieces nearest you should
   shift when you move across the board, the way loose paper does. Depth is
   per element (`data-drift="14"` = 14px of travel), so the board keeps a
   foreground and a background instead of sliding as one plate.          */
function pointerDrift(slide: El) {
  const pieces = all("[data-drift]", slide);
  if (!pieces.length) return;

  const movers = pieces.map((p) => ({
    depth: Number(p.getAttribute("data-drift")) || 8,
    x: gsap.quickTo(p, "x", { duration: 1.1, ease: "power3.out" }),
    y: gsap.quickTo(p, "y", { duration: 1.1, ease: "power3.out" }),
  }));

  slide.addEventListener("pointermove", (e) => {
    const r = slide.getBoundingClientRect();
    const dx = (e.clientX - r.left) / r.width - 0.5;
    const dy = (e.clientY - r.top) / r.height - 0.5;
    for (const m of movers) {
      m.x(dx * m.depth);
      m.y(dy * m.depth);
    }
  });
  slide.addEventListener("pointerleave", () => {
    for (const m of movers) {
      m.x(0);
      m.y(0);
    }
  });
}

/* ── 3c. things that draw themselves while you read them ──────

   Purpose (R-19): a ruled line, a timeline rail or an underline that fills
   as the board is read tells you how far through it you are. `--draw` runs
   0 → 1 on every `[data-draw]` in the board, staggered in document order,
   and finishes while this board is still the one on screen.             */
function draws(slide: El) {
  const items = all("[data-draw]", slide);
  if (!items.length) return;

  gsap.set(items, { "--draw": 0 });
  gsap.to(items, {
    "--draw": 1,
    ease: "none",
    stagger: 0.4,
    scrollTrigger: {
      trigger: slide,
      start: "top 72%",
      endTrigger: (slide.nextElementSibling as El) || slide,
      end: slide.nextElementSibling ? "top 60%" : "bottom bottom",
      scrub: 0.6,
    },
  });
}

/* ── 4. the cover plays on load, not on scroll ─────────────────

   Purpose (R-19): the sheet assembles itself the way someone lays a collage
   down, paper first, then the figure, then the title printed across it,
   then the pen signs and annotates. The order carries the reading order, so
   the motion is doing hierarchy work rather than decorating.               */
function cover() {
  const slide = one(".cover");
  if (!slide) return;

  const rail = all(".rail > *", slide);
  const bot1 = one(".cover__bot1", slide);
  const bot2 = one(".cover__bot2", slide);
  const art = one(".cover__art", slide);
  const word = one(".cover__word", slide);
  const sign = one(".cover__sign", slide);
  const lead = one(".cover__lead", slide);
  const snap = one(".cover__snap", slide);
  const snap2 = one(".cover__snap2", slide);
  const foot = all(".cover__foot > *", slide);
  const cue = one(".cover__cue", slide);
  const notes = all(".cover__note1 path, .cover__note2 path", slide) as unknown as SVGPathElement[];

  const letters = word
    ? (SplitText.create(word, { type: "chars", mask: "chars", charsClass: "m-char" }).chars as El[])
    : [];

  gsap.set(rail, { opacity: 0, y: -8 });
  gsap.set(bot1, { opacity: 0, yPercent: -18 });
  gsap.set(bot2, { opacity: 0, yPercent: 20 });
  gsap.set(art, { opacity: 0, y: 46 });
  gsap.set(letters, { yPercent: 118, opacity: 0 });
  gsap.set(sign, { clipPath: CLIP_HIDDEN, y: 10 });
  gsap.set(lead, { opacity: 0, y: 14 });
  gsap.set([snap, snap2], { opacity: 0, y: -34, scale: 0.92 });
  gsap.set(cue, { opacity: 0 });

  for (const p of notes) {
    const len = p.getTotalLength();
    gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
  }

  (one(".rv", slide) || slide).classList.add("ready");

  const tl = gsap.timeline({ defaults: { duration: 1, ease: "expo.out" }, delay: 0.1 });
  tl.to(rail, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out", stagger: 0.07 }, 0);
  tl.to(bot1, { opacity: 0.9, yPercent: 0, duration: 1.5 }, 0.05);
  tl.to(bot2, { opacity: 0.85, yPercent: 0, duration: 1.5 }, 0.15);
  tl.to(art, { opacity: 1, y: 0, duration: 1.3 }, 0.22);
  tl.to(letters, { yPercent: 0, opacity: 1, duration: 0.95, stagger: 0.035 }, 0.42);
  tl.to(sign, { clipPath: CLIP_SHOWN, y: 0, duration: 1.1, ease: "power2.inOut" }, 0.95);
  tl.to(notes, { strokeDashoffset: 0, duration: 0.5, ease: "power1.inOut", stagger: 0.07 }, 1.0);
  tl.to(snap, { opacity: 1, y: 0, scale: 1, duration: 1, ease: "back.out(2.2)" }, 1.05);
  tl.to(snap2, { opacity: 1, y: 0, scale: 1, duration: 1, ease: "back.out(2.2)" }, 1.18);
  tl.to(foot, { opacity: 1, y: 0, duration: 0.7, stagger: 0.07 }, 1.25);
  tl.to(cue, { opacity: 1, duration: 0.6 }, 1.5);

  tl.eventCallback("onComplete", () => pointerDrift(slide));
  parallax(slide, [bot1, bot2, snap, snap2].filter(Boolean) as El[]);
}

/* ── 5. the tool rows run as marquees ────────────────────────── */
const loops: gsap.core.Tween[] = [];
/* a row holds still when you point at it, and the whole set holds still while
   the toolkit board is off screen — six infinite tweens repainting a board
   nobody is looking at is pure tax on every other board's scroll */
const syncs: (() => void)[] = [];
let tkNear = true;

function toolkit() {
  const rows = all(".tk__row");
  rows.forEach((row, i) => {
    const track = one(".tk__track", row);
    if (!track) return;

    const seed = Array.from(track.children) as El[];
    if (!seed.length) return;

    const copy = () => {
      for (const c of seed) {
        const clone = c.cloneNode(true) as El;
        clone.setAttribute("aria-hidden", "true");
        track.appendChild(clone);
      }
    };
    /* widen the content past the viewport, then mirror it once so a -50%
       shift lands exactly on the seam */
    let guard = 0;
    while (track.scrollWidth < row.offsetWidth * 1.25 && guard++ < 8) copy();
    for (const c of Array.from(track.children) as El[]) {
      const clone = c.cloneNode(true) as El;
      clone.setAttribute("aria-hidden", "true");
      track.appendChild(clone);
    }

    const back = i % 2 === 1;
    gsap.set(track, { xPercent: back ? -50 : 0 });
    const loop = gsap.to(track, {
      xPercent: back ? 0 : -50,
      duration: 30 + i * 5,
      ease: "none",
      repeat: -1,
    });
    loops.push(loop);

    /* a row you are pointing at or reading with the keyboard holds still,
       so a long tool name can actually be read */
    let hovered = false;
    const sync = () => (tkNear && !hovered ? loop.resume() : loop.pause());
    syncs.push(sync);
    const hold = () => {
      hovered = true;
      sync();
    };
    const go = () => {
      hovered = false;
      sync();
    };
    row.addEventListener("pointerenter", hold);
    row.addEventListener("pointerleave", go);
    row.addEventListener("focusin", hold);
    row.addEventListener("focusout", go);
  });

  const board = one(".tk");
  if (!board || !syncs.length) return;
  ScrollTrigger.create({
    trigger: board,
    start: "top bottom",
    end: "bottom top",
    onToggle: (self) => {
      tkNear = self.isActive;
      for (const s of syncs) s();
    },
  });
  tkNear = false;
  for (const s of syncs) s();
}

/* ── 6. scroll velocity feeds the marquees ───────────────────── */
function velocity() {
  let idle = 0;

  ScrollTrigger.create({
    onUpdate: (self) => {
      if (!tkNear) return;
      const v = gsap.utils.clamp(-5, 5, self.getVelocity() / 320);
      /* eased in place rather than with a fresh tween per loop per frame:
         the old version built six tweens every scroll frame and threw them
         away on the next one */
      for (let i = 0; i < loops.length; i++) {
        const t = loops[i];
        const want = 1 + v * (i % 2 === 1 ? -1 : 1);
        t.timeScale(t.timeScale() + (want - t.timeScale()) * 0.2);
      }
      clearTimeout(idle);
      idle = window.setTimeout(() => {
        for (const t of loops) gsap.to(t, { timeScale: 1, duration: 0.9, overwrite: true });
      }, 170);
    },
  });
}

/* ── 7. the figures count up like an odometer ────────────────── */
function counters() {
  for (const el of all(".num__fig")) {
    const raw = (el.textContent || "").trim();
    const m = raw.match(/^(\D*)([\d.,]+)(.*)$/);
    if (!m) continue;
    const [, pre, digits, post] = m;
    const target = parseFloat(digits.replace(/,/g, ""));
    if (!isFinite(target)) continue;

    /* start at the same digit count so the row never reflows mid-count */
    const places = digits.replace(/\D/g, "").length;
    const o = { v: places > 1 ? Math.pow(10, places - 1) : 0 };

    gsap.to(o, {
      v: target,
      duration: 1.5,
      ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 90%", once: true },
      onUpdate: () => {
        el.textContent = pre + Math.round(o.v) + post;
      },
      onComplete: () => {
        el.textContent = raw;
      },
    });
  }
}

/* ── 7b. the day draws itself, hour by hour ──────────────────── */
function dayRail() {
  const slide = one(".day");
  if (!slide) return;
  const rows = all(".day__row", slide);
  if (!rows.length) return;

  /* one time unit per row, scrubbed across the panel. The range ends as the
     next board starts climbing, so the last hour is always lit while this
     one is still the board you are looking at. */
  const next = slide.nextElementSibling;
  gsap
    .timeline({
      scrollTrigger: {
        trigger: slide,
        start: "top 75%",
        endTrigger: next || slide,
        end: next ? "top 55%" : "bottom 20%",
        scrub: 0.5,
      },
    })
    .fromTo(rows, { "--draw": 0 }, { "--draw": 1, ease: "none", duration: 1, stagger: 1 }, 0);
}

/* ── 8. the deck HUD: which board you are on ─────────────────── */
function hud(slides: El[]) {
  const box = one(".hud");
  if (!box) return;
  const n = one(".hud__n", box);
  const label = one(".hud__name", box);
  const fill = one(".hud__fill", box);
  const total = one(".hud__total", box);
  if (total) total.textContent = String(slides.length).padStart(2, "0");

  slides.forEach((s, i) => {
    /* the rail carries the board index now, so the HUD reads it from there */
    const tab = (one(".rail > *", s) || one(".slide__no", s))?.textContent || "";
    const name = (tab.split("/")[1] || "").trim();
    ScrollTrigger.create({
      trigger: s,
      start: "top 60%",
      end: "bottom 40%",
      onToggle: (self) => {
        if (!self.isActive) return;
        if (n) n.textContent = String(i + 1).padStart(2, "0");
        if (label) label.textContent = name;
      },
    });
  });

  const deck = one(".deck");
  if (deck && fill)
    ScrollTrigger.create({
      trigger: deck,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => gsap.set(fill, { scaleY: self.progress }),
    });

  box.classList.add("is-on");
}

/* ── 9. nav marks the section you are reading ────────────────── */
function navState() {
  for (const a of all(".nav__links a")) {
    const id = a.getAttribute("href") || "";
    const sec = id.startsWith("#") ? one(id) : null;
    if (!sec) continue;
    ScrollTrigger.create({
      trigger: sec,
      start: "top 55%",
      end: "bottom 45%",
      onToggle: (self) => a.classList.toggle("is-on", self.isActive),
    });
  }
}


/* ── 0. smooth scroll ────────────────────────────────────────────

   Lenis in its default mode animates the real scroll position — it does
   NOT transform a wrapper — so `position: sticky` keeps working and the
   stack survives. (ScrollSmoother and wrapper-transform smooth-scrollers
   do not: they are the reason this file does its own stacking.)        */
function smooth() {
  /* `lerp: 0.085` read as lag rather than weight: the page needed roughly
     half a second to finish catching up with the wheel, and every scrubbed
     tween then trailed that already-trailing position. 0.14 still glides,
     but the board is where your hand put it. */
  const lenis = new Lenis({ lerp: 0.14, wheelMultiplier: 1 });
  root.style.scrollBehavior = "auto";
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  /* Lenis owns the scroll position from here, so a deep link has to be
     replayed through it or it springs back to the top */
  const park = () => parseFloat(getComputedStyle(root).getPropertyValue("--park")) || 0;
  const landed = location.hash.length > 1 ? one(location.hash) : null;
  if (landed) requestAnimationFrame(() => lenis.scrollTo(landed, { offset: -park(), immediate: true }));

  /* in-page links have to go through Lenis or they fight it */
  doc.addEventListener("click", (e) => {
    const link = (e.target as Element | null)?.closest?.('a[href^="#"]') as HTMLAnchorElement | null;
    if (!link) return;
    const id = link.getAttribute("href") || "";
    const target = id.length > 1 ? one(id) : null;
    if (!target && id !== "#top") return;
    e.preventDefault();
    lenis.scrollTo(target || 0, { offset: -park() });
  });
}

/* ── boot ────────────────────────────────────────────────────── */
function boot() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    root.classList.remove("motion");
    return;
  }

  try {
    const slides = all(".deck > .slide");

    smooth();
    stack();
    cover();
    toolkit();
    for (const s of slides) if (!s.classList.contains("cover")) revealSlide(s);
    counters();
    dayRail();
    hud(slides);
    navState();
    velocity();

    ScrollTrigger.refresh();
    window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
  } catch (err) {
    /* never trade a readable page for a broken animation */
    console.error("[motion]", err);
    root.classList.remove("motion");
  }
}

const settled = Promise.withResolvers<void>();
window.setTimeout(settled.resolve, 2500);
const fonts = doc.fonts
  ? Promise.race([doc.fonts.ready, settled.promise])
  : Promise.resolve();
fonts.then(() => requestAnimationFrame(boot));
