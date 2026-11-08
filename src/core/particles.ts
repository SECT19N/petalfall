import { SHAPES, isShapeName } from "../shapes";
import type { ParticleSpec, ShapeName } from "../types";

export type ResolvedParticle = {
  color?: string;
  weight: number;
} & (
  | { kind: "shape"; shape: ShapeName }
  | { kind: "glyph"; glyph: string }
  | { kind: "image"; image: string }
);

/** Per-particle layout, decided by mount() from the seeded RNG. */
export interface Layout {
  size: number;
  left: number;
  drift: number;
  spin: 1 | -1;
  duration: number;
  delay: number;
}

const GLYPH_SCALE = 1.4;

export function resolveParticle(spec: ParticleSpec): ResolvedParticle {
  if (typeof spec === "string") {
    return isShapeName(spec)
      ? { kind: "shape", shape: spec, weight: 1 }
      : { kind: "glyph", glyph: spec, weight: 1 };
  }
  const weight =
    "weight" in spec && Number.isFinite(spec.weight) && spec.weight! > 0
      ? spec.weight!
      : 1;
  const color = spec.color;
  if ("shape" in spec) {
    return isShapeName(spec.shape)
      ? { kind: "shape", shape: spec.shape, color, weight }
      : { kind: "shape", shape: "almond", color, weight };
  }
  if ("glyph" in spec)
    return { kind: "glyph", glyph: spec.glyph, color, weight };
  if ("image" in spec)
    return { kind: "image", image: spec.image, color, weight };
  // Inline SVG goes through an image URL, never innerHTML, so scripts can't run.
  return {
    kind: "image",
    image: `data:image/svg+xml,${encodeURIComponent(spec.svg)}`,
    color,
    weight,
  };
}

export function createParticleEl(
  doc: Document,
  p: ResolvedParticle,
  layout: Layout,
): HTMLElement {
  const el = doc.createElement("span");
  el.setAttribute("data-petalfall", "");
  const { size } = layout;

  if (p.kind === "shape") {
    el.className = `pf pf-shape pf-s-${p.shape}`;
    el.style.width = `${size}px`;
    el.style.height = `${Math.round(size * SHAPES[p.shape].ratio)}px`;
  } else if (p.kind === "glyph") {
    el.className = "pf pf-glyph";
    el.textContent = p.glyph;
    el.style.fontSize = `${Math.round(size * GLYPH_SCALE)}px`;
  } else {
    el.className = "pf pf-image";
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.style.backgroundImage = `url(${JSON.stringify(p.image)})`;
  }

  el.style.left = `${layout.left}%`;
  const set = (name: string, value: string) =>
    el.style.setProperty(name, value);
  // Opacity and the default colour are inherited from the root, so changing
  // them never has to rebuild the particles.
  if (p.color) set("--pf-color", p.color);
  set("--pf-drift", `${layout.drift}cqw`);
  set("--pf-spin", String(layout.spin));
  set("--pf-duration", `${layout.duration}s`);
  set("--pf-delay", `${layout.delay}s`);
  return el;
}
