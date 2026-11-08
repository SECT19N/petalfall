import { SHAPES, svgDataUrl } from "../shapes";

const STYLE_ID = "petalfall-css";
const done = new WeakSet<Document>();

function buildCss(): string {
  const shapes = Object.entries(SHAPES)
    .map(([name, def]) => {
      if (def.radius) return `.pf-s-${name}{border-radius:${def.radius}}`;
      const mask = `${svgDataUrl(def.viewBox!, def.path!, def.stroke)} center/contain no-repeat`;
      return `.pf-s-${name}{-webkit-mask:${mask};mask:${mask}}`;
    })
    .join("");

  return (
    "@keyframes pf-fall{" +
    "0%{transform:translate3d(0,-8cqh,0) rotate(0deg)}" +
    "50%{transform:translate3d(var(--pf-drift),55cqh,0) rotate(calc(var(--pf-spin,1)*200deg))}" +
    "100%{transform:translate3d(0,112cqh,0) rotate(calc(var(--pf-spin,1)*380deg))}}" +
    ".pf-root{position:fixed;inset:0;overflow:hidden;pointer-events:none;container-type:size}" +
    ".pf-root[data-contained]{position:absolute}" +
    ".pf-root[data-layer=behind]{z-index:0}" +
    ".pf-root[data-layer=front]{z-index:9999}" +
    ".pf-root[data-paused] .pf{animation-play-state:paused}" +
    ".pf{position:absolute;top:0;left:0;opacity:var(--pf-opacity,.35);" +
    "animation:pf-fall var(--pf-duration,24s) linear var(--pf-delay,0s) infinite}" +
    ".pf-shape{background:var(--pf-color,currentColor)}" +
    ".pf-glyph{color:var(--pf-color,inherit);line-height:1;white-space:nowrap;user-select:none}" +
    ".pf-image{background:center/contain no-repeat}" +
    ".pf-held{opacity:var(--pf-held-opacity,.85)}" +
    shapes +
    "@media (prefers-reduced-motion:reduce){.pf-root[data-rm]{display:none}}"
  );
}

/**
 * Adds the stylesheet once per document. A constructed stylesheet is used when
 * available (it isn't blocked by a strict `style-src` CSP); otherwise a <style>.
 */
export function ensureStyle(doc: Document): void {
  if (done.has(doc) || doc.getElementById(STYLE_ID)) return;
  const css = buildCss();
  try {
    if (typeof CSSStyleSheet !== "undefined" && "adoptedStyleSheets" in doc) {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(css);
      doc.adoptedStyleSheets = [...doc.adoptedStyleSheets, sheet];
      done.add(doc);
      return;
    }
  } catch {
    // fall through to a <style> tag
  }
  const el = doc.createElement("style");
  el.id = STYLE_ID;
  el.textContent = css;
  doc.head.appendChild(el);
  done.add(doc);
}
