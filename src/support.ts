const cache = new Map<string, boolean>();
let ctx: CanvasRenderingContext2D | null | undefined;

const SIZE = 24;

function context(): CanvasRenderingContext2D | null {
  if (ctx !== undefined) return ctx;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = SIZE * 2;
    canvas.height = SIZE;
    ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (ctx) {
      ctx.font = `${SIZE - 6}px system-ui, sans-serif`;
      ctx.textBaseline = "top";
      ctx.fillStyle = "#000";
    }
  } catch {
    ctx = null;
  }
  return ctx ?? null;
}

/** The pixels a string draws, as a string, so two renderings can be compared. */
function ink(c: CanvasRenderingContext2D, text: string): string {
  c.clearRect(0, 0, SIZE * 2, SIZE);
  c.fillText(text, 2, 2);
  const data = c.getImageData(0, 0, SIZE * 2, SIZE).data;
  let out = "";
  let any = false;
  for (let i = 3; i < data.length; i += 4) {
    const a = data[i]!;
    if (a) any = true;
    out += a > 127 ? "1" : "0";
  }
  return any ? out : "";
}

/**
 * Whether this system can draw the glyph. Newer emoji show up as an empty box
 * (or nothing) on older systems; we compare against a character that no font
 * has. Returns true when it can't tell (no canvas).
 */
export function isGlyphSupported(glyph: string): boolean {
  const known = cache.get(glyph);
  if (known !== undefined) return known;
  const c = context();
  let ok = true;
  if (c) {
    const drawn = ink(c, glyph);
    ok = drawn !== "" && drawn !== ink(c, "￿");
  }
  cache.set(glyph, ok);
  return ok;
}
