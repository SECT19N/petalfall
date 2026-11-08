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
 * Only the held particle is driven by JS, and a requestAnimationFrame loop runs
 * only while one is held or flying; on release it eases into a slow fall and,
 * once off-screen, hands back to the CSS drift. Particles can sit behind the
 * page, so they are hit-tested by position on pointerdown, not by event target.
 * Returns a cleanup function.
 */
export function createGrab(
  root: HTMLElement,
  options: GrabOptions,
  layer: "behind" | "front",
): () => void {
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

  let held: Held | null = null;
  const flying = new Map<Held, number>();

  function release(h: Held) {
    for (const prop of OVERRIDDEN) {
      const before = h.saved.get(prop);
      if (before) h.el.style.setProperty(prop, before);
      else h.el.style.removeProperty(prop);
    }
    h.el.classList.remove("pf-held");
  }

  function fly(h: Held) {
    let last = performance.now();
    const phase = Math.random() * Math.PI * 2;
    const step = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      stepFlight(h, dt, now, phase);
      place(h);
      if (isGone(h, win.innerWidth, win.innerHeight)) {
        release(h);
        flying.delete(h);
      } else {
        flying.set(h, win.requestAnimationFrame(step));
      }
    };
    flying.set(h, win.requestAnimationFrame(step));
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
    for (const [f, id] of flying) {
      if (f.el === best.el) {
        win.cancelAnimationFrame(id);
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
    const rootRect = root.getBoundingClientRect();
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
    };
    el.style.animation = "none";
    el.style.left = "0px";
    el.style.top = "0px";
    el.style.willChange = "transform";
    el.classList.add("pf-held");
    place(held);
    doc.body.style.userSelect = "none";
    e.preventDefault();
    options.onGrab?.(el);
  }

  function onMove(e: PointerEvent) {
    if (!held || e.pointerId !== held.pointerId) return;
    const h = held;
    const dt = Math.max(1, e.timeStamp - h.lastT) / 1000;
    trackPointer(h, e.clientX - h.lastX, e.clientY - h.lastY, dt);
    const rootRect = root.getBoundingClientRect();
    h.lastT = e.timeStamp;
    h.lastX = e.clientX;
    h.lastY = e.clientY;
    h.x = e.clientX - h.grabDx - h.w / 2 - rootRect.left;
    h.y = e.clientY - h.grabDy - h.h / 2 - rootRect.top;
    place(h);
  }

  function onUp(e: PointerEvent) {
    if (!held || e.pointerId !== held.pointerId) return;
    doc.body.style.removeProperty("user-select");
    const h = held;
    held = null;
    releaseVelocity(h, e.timeStamp - h.lastT, maxFling);
    fly(h);
  }

  doc.addEventListener("pointerdown", onDown);
  doc.addEventListener("pointermove", onMove);
  doc.addEventListener("pointerup", onUp);
  doc.addEventListener("pointercancel", onUp);

  return () => {
    doc.removeEventListener("pointerdown", onDown);
    doc.removeEventListener("pointermove", onMove);
    doc.removeEventListener("pointerup", onUp);
    doc.removeEventListener("pointercancel", onUp);
    for (const [h, id] of flying) {
      win.cancelAnimationFrame(id);
      release(h);
    }
    flying.clear();
    if (held) release(held);
    held = null;
    doc.body.style.removeProperty("user-select");
  };
}
