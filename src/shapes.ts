import type { ShapeName } from "./types";

export interface ShapeDef {
  /** Height as a share of width. */
  ratio: number;
  /** Simple shapes are just a border radius... */
  radius?: string;
  /** ...the notched ones are an SVG path used as a mask, so they keep the colour. */
  viewBox?: string;
  path?: string;
  stroke?: boolean;
}

export const SHAPES: Record<ShapeName, ShapeDef> = {
  almond: { ratio: 0.7, radius: "50% 0 50% 0" },
  drop: { ratio: 1, radius: "0 50% 50% 50%" },
  sliver: { ratio: 0.4, radius: "50%" },
  dot: { ratio: 1, radius: "50%" },
  // Cherry blossom: narrow at the base, a notch at the tip.
  sakura: {
    ratio: 1.2,
    viewBox: "0 0 20 24",
    path: "M10 24C3 19 0 12 2 5c1-3 4-5 6-4l2 3 2-3c2-1 5 1 6 4 2 7-1 14-8 19z",
  },
  // Rose petal: wide and cupped, with a shallow dip.
  heart: {
    ratio: 1.1,
    viewBox: "0 0 20 22",
    path: "M1 7C1 2 7 0 10 4c3-4 9-2 9 3 0 7-4 12-9 15C5 19 1 14 1 7z",
  },
  leaf: {
    ratio: 1.3,
    viewBox: "0 0 20 26",
    path: "M10 1C16 6 19 12 16 18c-1.5 3-4 5-6 7-2-2-4.5-4-6-7C1 12 4 6 10 1z",
  },
  maple: {
    ratio: 1,
    viewBox: "0 0 24 24",
    path: "M12 1l2.2 4.6 3.3-1.6-.8 5 4.3-.7-2.3 3.8 3.3 2.3-4.6.9.900 1.900-5.1-.6.100 4.9h-2.6l.1-4.9-5.1.6.9-1.900-4.6-.9 3.3-2.3-2.3-3.8 4.3.7-.8-5 3.3 1.6z",
  },
  snowflake: {
    ratio: 1,
    viewBox: "0 0 24 24",
    path: "M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7",
    stroke: true,
  },
};

export const isShapeName = (name: string): name is ShapeName =>
  Object.prototype.hasOwnProperty.call(SHAPES, name);

/** An SVG shape as a `url("data:...")` value for CSS mask/background. */
export function svgDataUrl(viewBox: string, path: string, stroke = false) {
  const body = stroke
    ? `<path d='${path}' stroke='black' stroke-width='2' stroke-linecap='round' fill='none'/>`
    : `<path d='${path}'/>`;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='${viewBox}'>${body}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
