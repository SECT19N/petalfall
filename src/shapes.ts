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
  /** Cut-outs inside the path (a quill slit) need the even-odd fill rule. */
  evenodd?: boolean;
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
  // Feather: a swept vane with split barbs, a quill slit and a short stem.
  feather: {
    ratio: 2.86,
    evenodd: true,
    viewBox: "0 0 14 40",
    path: "M10.6 0.4L11.5 3.0L11.4 3.9L12.2 7.4L11.7 8.2L12.3 11.5L11.5 12.3L11.9 15.6L11.0 16.5L11.1 19.9L10.2 20.9L10.0 24.4L9.2 25.4L8.6 29.1L8.0 30.2L6.3 32.2L6.7 40.0L6.1 40.0L6.0 35.0L4.6 30.3L4.0 29.1L3.6 25.3L2.9 24.1L3.0 20.3L2.4 19.2L3.2 15.5L2.7 14.4L4.0 11.0L3.7 9.8L5.6 6.7L5.6 5.7L7.9 2.9L8.4 2.0ZM7.1 30.5C7.6 21 8.7 11 10.3 3.6L10.8 4C9.3 11.8 8.2 21.5 7.6 30.5Z",
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
export function svgDataUrl(
  viewBox: string,
  path: string,
  stroke = false,
  evenodd = false,
) {
  const body = stroke
    ? `<path d='${path}' stroke='black' stroke-width='3' stroke-linecap='round' fill='none'/>`
    : `<path d='${path}'${evenodd ? " fill-rule='evenodd'" : ""}/>`;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='${viewBox}'>${body}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
