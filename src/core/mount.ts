import { type ResolvedOptions, needsRebuild, resolveOptions } from "../options";
import { createRng, pickWeighted } from "./rng";
import { isGlyphSupported } from "../support";
import type { Petalfall, PetalfallOptions } from "../types";
import { type GrabControl, createGrab } from "./grab";
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
  let current = resolveOptions(input);
  let userPaused = false;
  let hiddenPaused = doc.hidden;
  let offscreen = false;
  let grab: GrabControl | undefined;

  const syncPause = () => {
    const paused = userPaused || hiddenPaused || offscreen;
    root.toggleAttribute("data-paused", paused);
    // Particles that were grabbed are driven by JS, so they need freezing too.
    grab?.setPaused(paused);
  };
  const onVisibility = () => {
    hiddenPaused = doc.hidden;
    syncPause();
  };
  doc.addEventListener("visibilitychange", onVisibility);

  // A contained instance has nothing to show once its element is scrolled away.
  const win = doc.defaultView;
  const watcher =
    contained && win && "IntersectionObserver" in win
      ? new win.IntersectionObserver((entries) => {
          offscreen = !entries[entries.length - 1]!.isIntersecting;
          syncPause();
        })
      : undefined;
  watcher?.observe(host);

  /** The parts of the look that live on the root, so they change without a rebuild. */
  function applyLook(o: ResolvedOptions) {
    root.style.setProperty("--pf-color", o.color);
    root.style.setProperty("--pf-opacity", String(o.opacity));
  }

  function build(o: ResolvedOptions) {
    grab?.destroy();
    grab = undefined;
    root.replaceChildren();

    applyLook(o);
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
      frag.appendChild(createParticleEl(doc, particle, layout));
    }
    root.appendChild(frag);

    if (o.grab) grab = createGrab(root, o.grab, o.layer);
    syncPause();
  }

  build(current);

  return {
    update(next) {
      input = { ...input, ...next };
      const o = resolveOptions(input);
      if (needsRebuild(current, o)) build(o);
      else applyLook(o);
      current = o;
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
      watcher?.disconnect();
      grab?.destroy();
      grab = undefined;
      root.remove();
      if (contained) host.style.position = hostPosition;
    },
  };
}
