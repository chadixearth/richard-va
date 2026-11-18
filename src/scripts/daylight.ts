/* ── daylight: a working day passing over the desk ─────────────

   The deck is a stack of printed boards lying on a desk, so the thing that
   moves behind the reading is light, not ornament. The cover opens at 6am
   ("before the inbox") and every board you read moves the sun: palm shadows
   from the window lie long across the paper at dawn, shorten to noon and
   stretch the other way into an amber late afternoon, and after dark the
   last board is lit by a desk lamp. The HUD clock tells the same story, so
   the change reads as time passing rather than a colour effect.

   The breeze in the fronds is the only motion on its own clock, and it is
   slow and periodic. Everything is a composited layer moved by transform
   and opacity; the shadows are baked bitmaps (src/assets/light: drawn
   fronds, blurred once offline), so scrolling never repaints them.     */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import near from "../assets/light/palm-near.webp?url";
import far from "../assets/light/palm-far.webp?url";

type El = HTMLElement;

/* the hour at which each board is read, cover to footer. The Day board's
   own timeline (07:00 to 17:00) lands mid-morning, where it belongs. */
const HOURS = [6, 7, 8, 9.5, 11, 13, 14, 15.5, 17, 18.5, 21];
const LAST = HOURS.length - 1;

/* deck progress → hour, and back */
const hourAt = (p: number) => {
  const x = gsap.utils.clamp(0, 1, p) * LAST;
  const k = Math.min(LAST - 1, Math.floor(x));
  return HOURS[k] + (HOURS[k + 1] - HOURS[k]) * (x - k);
};
const at = (h: number) => {
  let k = 0;
  while (k < LAST - 1 && h > HOURS[k + 1]) k++;
  return (k + (h - HOURS[k]) / (HOURS[k + 1] - HOURS[k])) / LAST;
};

const SCENE = `
  <div class="daylight__sun"></div>
  <div class="daylight__gold"></div>
  <div class="daylight__leaves daylight__leaves--far"><i></i></div>
  <div class="daylight__leaves daylight__leaves--near"><i></i></div>
  <div class="daylight__dusk"></div>
  <div class="daylight__lamp"></div>`;

export function daylight(deck: El) {
  const scene = document.createElement("div");
  scene.className = "daylight";
  scene.setAttribute("aria-hidden", "true");
  scene.innerHTML = SCENE;
  document.body.appendChild(scene);

  const pick = (sel: string) => scene.querySelector(sel) as El;
  const sun = pick(".daylight__sun");
  const gold = pick(".daylight__gold");
  const dusk = pick(".daylight__dusk");
  const lamp = pick(".daylight__lamp");
  const fronds = [
    { el: pick(".daylight__leaves--far"), src: far, depth: 0.6, peak: 0.17 },
    { el: pick(".daylight__leaves--near"), src: near, depth: 1, peak: 0.23 },
  ];

  /* The sun's day, laid out on the deck's own scroll. A low sun throws long
     shadows (stretched and sheared away from it), a high one short, crisp
     ones; the nearer frond travels further than the far one, which is the
     only depth cue the flat paper needs. */
  const day = gsap.timeline({ defaults: { ease: "sine.inOut" } });
  const span = (a: number, b: number) => at(b) - at(a);
  for (const f of fronds) {
    (f.el.firstElementChild as El).style.backgroundImage = `url(${f.src})`;
    day
      .fromTo(
        f.el,
        { xPercent: 7 * f.depth, yPercent: -2 * f.depth, skewX: -16, scaleY: 1.2, opacity: f.peak * 0.95 },
        { xPercent: 0, yPercent: 0, skewX: 0, scaleY: 1, opacity: f.peak, duration: span(6, 12.5) },
        0
      )
      .to(f.el, { xPercent: -6 * f.depth, skewX: 14, scaleY: 1.18, opacity: f.peak * 0.85, duration: span(12.5, 18.5) }, at(12.5))
      .to(f.el, { xPercent: -9 * f.depth, skewX: 22, scaleY: 1.3, opacity: 0, duration: span(18.5, 19.6) }, at(18.5));
  }
  day
    .fromTo(sun, { opacity: 1 }, { opacity: 0.15, duration: span(6, 12.5) }, 0)
    .to(sun, { opacity: 0, duration: span(12.5, 15) }, at(12.5))
    .fromTo(gold, { opacity: 0 }, { opacity: 1, duration: span(15, 18.5) }, at(15))
    .to(gold, { opacity: 0, duration: span(18.5, 20.5) }, at(18.5))
    .fromTo(dusk, { opacity: 0 }, { opacity: 1, duration: span(18.8, 21) }, at(18.8))
    .fromTo(lamp, { opacity: 0 }, { opacity: 1, duration: span(19.8, 21) }, at(19.8));

  const face = document.querySelector<El>(".hud__clock");
  let shown = "";
  const clock = (p: number) => {
    if (!face) return;
    const m = Math.floor((hourAt(p) * 60) / 10) * 10;
    const s = `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
    if (s !== shown) face.textContent = shown = s;
  };

  ScrollTrigger.create({
    trigger: deck,
    start: "top top",
    end: "bottom bottom",
    animation: day,
    scrub: 0.8,
    onUpdate: (self) => clock(self.progress),
    onRefresh: (self) => clock(self.progress),
  });

  /* a breeze through the fronds: two slow swings out of step with each
     other, pivoting where each branch enters the frame */
  const [farLeaf, nearLeaf] = fronds.map((f) => f.el.firstElementChild as El);
  const sway = { ease: "sine.inOut", yoyo: true, repeat: -1 } as const;
  gsap.to(nearLeaf, { rotation: 1.5, xPercent: 0.8, yPercent: -0.5, duration: 6.2, transformOrigin: "8% 6%", ...sway });
  gsap.to(nearLeaf, { scale: 1.015, duration: 3.7, ...sway });
  gsap.to(farLeaf, { rotation: -1.1, xPercent: -0.6, duration: 8.1, transformOrigin: "92% 4%", ...sway });

  /* the light comes up as the page opens */
  gsap.fromTo(scene, { opacity: 0 }, { opacity: 1, duration: 1.8, ease: "power1.out", delay: 0.2 });
}
