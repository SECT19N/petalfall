/** Names of the built-in shapes (see shapes.ts). */
export type ShapeName =
  | "almond"
  | "sakura"
  | "drop"
  | "heart"
  | "sliver"
  | "dot"
  | "leaf"
  | "maple"
  | "snowflake";

interface ParticleBase {
  /** CSS colour. Shapes and text glyphs use it; emoji and images ignore it. */
  color?: string;
  /** Relative chance of being picked (default 1). */
  weight?: number;
}

export type ParticleObject =
  | (ParticleBase & { shape: ShapeName })
  | (ParticleBase & { glyph: string })
  | (ParticleBase & { image: string })
  | (ParticleBase & { svg: string });

/**
 * A bare string is a shape name when it matches one ("sakura"), otherwise a
 * glyph: an emoji ("🍂") or any text character ("❀").
 */
export type ParticleSpec = ShapeName | (string & {}) | ParticleObject;

export type PresetName = "sakura" | "autumn" | "snow" | "confetti";

export interface GrabOptions {
  /** Turn grab-and-fling on (default true). */
  enabled?: boolean;
  /** Extra reach around a particle, in px (default 14). */
  reach?: number;
  /** Fastest fling, in px/s (default 1800). */
  maxFling?: number;
  /** Elements that keep their own clicks. Default: links, buttons, form fields... */
  interactive?: string;
  /**
   * Whether something opaque is drawn over this point, so the particle behind
   * it can't be grabbed. Default: checks computed backgrounds for
   * `layer: "behind"`, always false for `layer: "front"`.
   */
  isCovered?: (x: number, y: number) => boolean;
  /** Called each time a particle is picked up. */
  onGrab?: (el: HTMLElement) => void;
}

export interface PetalfallOptions {
  /** Start from a preset; your other options override it. */
  preset?: PresetName;
  /** How many particles (default 14). */
  count?: number;
  /** Fall speed multiplier (default 1). Higher is faster. */
  speed?: number;
  /** Sideways drift as a percentage of the width (default 6). */
  wind?: number;
  /** [min, max] size in px (default [9, 20]). */
  size?: [number, number];
  /** 0-1 (default 0.35). */
  opacity?: number;
  /** Default colour for particles that don't set their own (default pink). */
  color?: string;
  /** Same seed, same layout (default 1). */
  seed?: number;
  /** What falls (default: the five original petal shapes). */
  particles?: ParticleSpec[];
  /** "behind" the page (default) or "front" of it. */
  layer?: "behind" | "front";
  /** Hide everything for visitors who ask for less motion (default true). */
  respectReducedMotion?: boolean;
  /** Grab-and-fling. Pass `false` to turn it off. */
  grab?: GrabOptions | boolean;
}

export interface Petalfall {
  /** Change options; rebuilds the particles. */
  update(options: PetalfallOptions): void;
  pause(): void;
  resume(): void;
  /** Remove the particles and every listener. */
  destroy(): void;
}
