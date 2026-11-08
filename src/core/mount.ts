import { resolveOptions } from "../options";
import { createRng, pickWeighted } from "./rng";
import { isGlyphSupported } from "../support";
import type { Petalfall, PetalfallOptions } from "../types";
import { createGrab } from "./grab";
import { type Layout, createParticleEl, resolveParticle } from "./particles";
import { ensureStyle } from "./style";

const noop: Petalfall = {
  update() {},
  pause() {},
  resume() {},
  destroy() {},
};

/**
 * Starts the falling particles inside `target` (default: the whole page).
 * Safe to call on the server: it does nothing there and returns a no-op.
 */
export function mount(
  target?: HTMLElement | null,
  options: PetalfallOptions = {},
): Petalfall {
  if (typeof document === "undefined") return noop;
  const host = target ?? document.body;
  const doc = host.ownerDocument;
  const contained = host !== doc.body && host !== doc.documentElement;
  ensureStyle(doc);

  // A contained root is absolutely positioned, so its host needs to be a containing block.
  const hostPosition = host.style.position;
  if (contained && getComputedStyle(host).position === "static") {
    host.style.position = "relative";
  }

  const root = doc.createElement("div");
  root.className = "pf-root";
  root.setAttribute("aria-hidden", "true");
  if (contained) root.setAttribute("data-contained", "");
  host.appendChild(root);

  let input = options;
  let userPaused = false;
  let hiddenPaused = doc.hidden;
  let stopGrab: (() => void) | undefined;

  const syncPause = () =>
    root.toggleAttribute("data-paused", userPaused || hiddenPaused);
  const onVisibility = () => {
    hiddenPaused = doc.hidden;
    syncPause();
  };
  doc.addEventListener("visibilitychange", onVisibility);

  function build() {
    stopGrab?.();
    stopGrab = undefined;
    root.replaceChildren();

    const o = resolveOptions(input);
    root.setAttribute("data-layer", o.layer);
    root.toggleAttribute("data-rm", o.respectReducedMotion);
    syncPause();

    let pool = o.particles
      .map(resolveParticle)
      .filter((p) => p.kind !== "glyph" || isGlyphSupported(p.glyph));
    // Every glyph unsupported: fall back to the plain shapes rather than nothing.
    if (pool.length === 0)
      pool = resolveOptions({}).particles.map(resolveParticle);
    const weights = pool.map((p) => p.weight);

    const rng = createRng(o.seed);
    const frag = doc.createDocumentFragment();
    for (let i = 0; i < o.count; i++) {
      const particle = pool[pickWeighted(weights, rng())]!;
      const duration = Math.round(((20 + rng() * 14) / o.speed) * 10) / 10;
      const layout: Layout = {
        size: Math.round(o.size[0] + rng() * (o.size[1] - o.size[0])),
        left: Math.round(rng() * 1000) / 10,
        drift:
          Math.round(
            (rng() < 0.5 ? -1 : 1) * o.wind * (0.6 + rng() * 0.4) * 10,
          ) / 10,
        spin: rng() < 0.66 ? 1 : -1,
        duration,
        delay: -Math.round(rng() * duration * 10) / 10,
      };
      frag.appendChild(
        createParticleEl(doc, particle, layout, o.color, o.opacity),
      );
    }
    root.appendChild(frag);

    if (o.grab) stopGrab = createGrab(root, o.grab, o.layer);
  }

  build();

  return {
    update(next) {
      input = { ...input, ...next };
      build();
    },
    pause() {
      userPaused = true;
      syncPause();
    },
    resume() {
      userPaused = false;
      syncPause();
    },
    destroy() {
      doc.removeEventListener("visibilitychange", onVisibility);
      stopGrab?.();
      stopGrab = undefined;
      root.remove();
      if (contained) host.style.position = hostPosition;
    },
  };
}
