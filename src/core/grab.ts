import type { GrabOptions } from "../types";
import {
  type Body,
  isGone,
  releaseVelocity,
  stepFlight,
  trackPointer,
} from "./physics";

const INTERACTIVE =
  "a,button,input,textarea,select,label,summary,dialog,[contenteditable]," +
  '[role="button"],[role="combobox"],[role="option"],[role="listbox"],[tabindex]';

/** Inline styles the grab overrides, put back on release. */
const OVERRIDDEN = ["animation", "left", "top", "transform", "will-change"];

export interface GrabControl {
  setPaused(paused: boolean): void;
  destroy(): void;
}

type Held = Body & {
  el: HTMLElement;
  w: number;
  h: number;
  grabDx: number;
  grabDy: number;
  lastT: number;
  lastX: number;
  lastY: number;
  pointerId: number;
  saved: Map<string, string>;
  /** Sway offset, so flung particles don't drift in step. */
  phase: number;
};

/** Whether something opaque (a card, a navbar, a form) is drawn over this point. */
export function isOpaqueAt(x: number, y: number, doc: Document): boolean {
  for (
    let el = doc.elementFromPoint(x, y);
    el && el !== doc.body && el !== doc.documentElement;
    el = el.parentElement
  ) {
    const bg = getComputedStyle(el).backgroundColor;
    // Fully transparent computes to "rgba(0, 0, 0, 0)" or "transparent".
    if (bg !== "transparent" && !/,\s*0\)$/.test(bg)) return true;
  }
  return false;
}

const place = (h: Held) =>
  (h.el.style.transform = `translate3d(${h.x}px,${h.y}px,0) rotate(${h.rot}deg)`);

/**
 * Lets visitors pick up the drifting particles inside `root` and fling them.
 * Only the held particle is driven by JS. Pointer-move listeners exist only
 * while one is held, and a single requestAnimationFrame loop runs only while
 * something is flying; on release a particle eases into a slow fall and, once
 * off-screen, hands back to the CSS drift. Particles can sit behind the
 * page, so they are hit-tested by position on pointerdown, not by event target.
 * `setPaused` freezes the flying particles along with the CSS-driven ones.
 */
export function createGrab(
  root: HTMLElement,
  options: GrabOptions,
  layer: "behind" | "front",
): GrabControl {
  const doc = root.ownerDocument;
  const win = doc.defaultView!;
  const reach = options.reach ?? 14;
  const maxFling = options.maxFling ?? 1800;
  const interactive = options.interactive ?? INTERACTIVE;
  const isCovered =
    options.isCovered ??
    (layer === "behind"
      ? (x: number, y: number) => isOpaqueAt(x, y, doc)
      : () => false);

  const contained = root.hasAttribute("data-contained");
  let held: Held | null = null;
  // Measured on pick-up, so mounting costs no layout read.
  let rootRect: { left: number; top: number } = { left: 0, top: 0 };
  const flying = new Set<Held>();
  let raf = 0;
  let lastFrame = 0;
  let paused = false;

  function release(h: Held) {
    for (const prop of OVERRIDDEN) {
      const before = h.saved.get(prop);
      if (before) h.el.style.setProperty(prop, before);
      else h.el.style.removeProperty(prop);
    }
    h.el.classList.remove("pf-held");
  }

  /** One frame for every flying particle. */
  function tick(now: number) {
    const dt = Math.min(0.05, (now - lastFrame) / 1000);
    lastFrame = now;
    // Particles live in the root, so it's the root's edges that count.
    const width = root.clientWidth;
    const height = root.clientHeight;
    for (const h of flying) {
      stepFlight(h, dt, now, h.phase);
      place(h);
      if (isGone(h, width, height)) {
        release(h);
        flying.delete(h);
      }
    }
    raf = flying.size ? win.requestAnimationFrame(tick) : 0;
  }

  function fly(h: Held) {
    h.phase = Math.random() * Math.PI * 2;
    flying.add(h);
    run();
  }

  function run() {
    if (raf || paused || flying.size === 0) return;
    lastFrame = performance.now();
    raf = win.requestAnimationFrame(tick);
  }

  function pick(e: PointerEvent) {
    let best: { el: HTMLElement; rect: DOMRect; d: number } | null = null;
    for (const el of root.querySelectorAll<HTMLElement>("[data-petalfall]")) {
      const r = el.getBoundingClientRect();
      if (r.width === 0) continue; // hidden (reduced motion)
      const dx = Math.max(
        r.left - reach - e.clientX,
        0,
        e.clientX - r.right - reach,
      );
      const dy = Math.max(
        r.top - reach - e.clientY,
        0,
        e.clientY - r.bottom - reach,
      );
      if (dx > 0 || dy > 0) continue;
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const d = Math.hypot(e.clientX - cx, e.clientY - cy);
      if (isCovered(cx, cy)) continue;
      if (!best || d < best.d) best = { el, rect: r, d };
    }
    return best;
  }

  function onDown(e: PointerEvent) {
    if (held || e.button !== 0) return;
    if ((e.target as Element | null)?.closest(interactive)) return;
    const best = pick(e);
    if (!best) return;

    // A particle already in flight can't be hit again: hand it back first.
    for (const f of flying) {
      if (f.el === best.el) {
        flying.delete(f);
        release(f);
      }
    }

    const { el, rect } = best;
    const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    rootRect = root.getBoundingClientRect();
    const saved = new Map(
      OVERRIDDEN.map((p) => [p, el.style.getPropertyValue(p)]),
    );
    held = {
      el,
      w,
      h,
      // Positions are relative to the root, which is the viewport when fixed.
      x: cx - w / 2 - rootRect.left,
      y: cy - h / 2 - rootRect.top,
      rot: (Math.atan2(m.b, m.a) * 180) / Math.PI,
      vx: 0,
      vy: 0,
      grabDx: e.clientX - cx,
      grabDy: e.clientY - cy,
      lastT: e.timeStamp,
      lastX: e.clientX,
      lastY: e.clientY,
      pointerId: e.pointerId,
      saved,
      phase: 0,
    };
    el.style.animation = "none";
    el.style.left = "0px";
    el.style.top = "0px";
    el.style.willChange = "transform";
    el.classList.add("pf-held");
    place(held);
    doc.body.style.userSelect = "none";
    doc.addEventListener("pointermove", onMove);
    doc.addEventListener("pointerup", onUp);
    doc.addEventListener("pointercancel", onUp);
    e.preventDefault();
    options.onGrab?.(el);
  }

  function onMove(e: PointerEvent) {
    if (!held || e.pointerId !== held.pointerId) return;
    const h = held;
    const dt = Math.max(1, e.timeStamp - h.lastT) / 1000;
    trackPointer(h, e.clientX - h.lastX, e.clientY - h.lastY, dt);
    // A fixed root never moves; a contained one can scroll under the pointer.
    if (contained) rootRect = root.getBoundingClientRect();
    h.lastT = e.timeStamp;
    h.lastX = e.clientX;
    h.lastY = e.clientY;
    h.x = e.clientX - h.grabDx - h.w / 2 - rootRect.left;
    h.y = e.clientY - h.grabDy - h.h / 2 - rootRect.top;
    place(h);
  }

  function stopTracking() {
    doc.removeEventListener("pointermove", onMove);
    doc.removeEventListener("pointerup", onUp);
    doc.removeEventListener("pointercancel", onUp);
    doc.body.style.removeProperty("user-select");
  }

  function onUp(e: PointerEvent) {
    if (!held || e.pointerId !== held.pointerId) return;
    stopTracking();
    const h = held;
    held = null;
    releaseVelocity(h, e.timeStamp - h.lastT, maxFling);
    fly(h);
  }

  doc.addEventListener("pointerdown", onDown);

  return {
    setPaused(value) {
      paused = value;
      if (paused) {
        win.cancelAnimationFrame(raf);
        raf = 0;
      } else run();
    },
    destroy() {
      doc.removeEventListener("pointerdown", onDown);
      stopTracking();
      win.cancelAnimationFrame(raf);
      raf = 0;
      for (const h of flying) release(h);
      flying.clear();
      if (held) release(held);
      held = null;
    },
  };
}
