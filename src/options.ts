import { PRESETS } from "./presets";
import type { GrabOptions, ParticleSpec, PetalfallOptions } from "./types";

export const DEFAULT_PARTICLES: ParticleSpec[] = [
  "almond",
  "sakura",
  "drop",
  "heart",
  "sliver",
];

export interface ResolvedOptions {
  count: number;
  speed: number;
  wind: number;
  size: [number, number];
  opacity: number;
  color: string;
  seed: number;
  particles: ParticleSpec[];
  layer: "behind" | "front";
  respectReducedMotion: boolean;
  grab: false | GrabOptions;
}

const num = (v: unknown, fallback: number) =>
  typeof v === "number" && Number.isFinite(v) ? v : fallback;

/** Merges defaults, the preset and your options, and clamps the numbers. */
export function resolveOptions(input: PetalfallOptions = {}): ResolvedOptions {
  const preset = input.preset ? PRESETS[input.preset] : undefined;
  const merged: PetalfallOptions = { ...preset };
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) (merged as Record<string, unknown>)[key] = value;
  }

  const [a, b] = merged.size ?? [9, 20];
  const lo = Math.max(1, Math.min(num(a, 9), num(b, 20)));
  const hi = Math.max(lo, num(a, 9), num(b, 20));

  const grab = merged.grab;
  return {
    count: Math.min(500, Math.max(0, Math.floor(num(merged.count, 14)))),
    speed: Math.max(0.1, num(merged.speed, 1)),
    wind: num(merged.wind, 6),
    size: [lo, hi],
    opacity: Math.min(1, Math.max(0, num(merged.opacity, 0.35))),
    color: merged.color ?? "#f2a7bd",
    seed: Math.floor(num(merged.seed, 1)),
    particles: merged.particles?.length ? merged.particles : DEFAULT_PARTICLES,
    layer: merged.layer === "front" ? "front" : "behind",
    respectReducedMotion: merged.respectReducedMotion !== false,
    grab:
      grab === false || (typeof grab === "object" && grab.enabled === false)
        ? false
        : typeof grab === "object"
          ? grab
          : {},
  };
}

const sameGrab = (a: false | GrabOptions, b: false | GrabOptions) => {
  if (a === false || b === false) return a === b;
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    if (a[k as keyof GrabOptions] !== b[k as keyof GrabOptions]) return false;
  }
  return true;
};

/**
 * Whether going from `a` to `b` means rebuilding the particles. Opacity and the
 * default colour are CSS variables on the root, so they can change in place.
 */
export function needsRebuild(a: ResolvedOptions, b: ResolvedOptions): boolean {
  return (
    a.count !== b.count ||
    a.speed !== b.speed ||
    a.wind !== b.wind ||
    a.seed !== b.seed ||
    a.layer !== b.layer ||
    a.respectReducedMotion !== b.respectReducedMotion ||
    a.size[0] !== b.size[0] ||
    a.size[1] !== b.size[1] ||
    JSON.stringify(a.particles) !== JSON.stringify(b.particles) ||
    !sameGrab(a.grab, b.grab)
  );
}
