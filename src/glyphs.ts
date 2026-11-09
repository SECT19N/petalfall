/**
 * Unicode characters that look good falling. Two kinds:
 *
 * - `text` glyphs take the CSS colour, so they follow a theme.
 * - `emoji` are multicolour and drawn by the OS, so they look different on
 *   Apple, Google and Microsoft systems, and can't be recoloured.
 */
export const glyphs = {
  text: {
    florals: ["❀", "✿", "❁", "✾", "❃", "❋", "⚘", "✻", "✼"],
    leaves: ["☘", "❦", "❧", "☙"],
    snow: ["❄︎", "❅", "❆", "✶", "✺"],
    stars: ["✦", "✧", "⋆", "★", "☆"],
  },
  emoji: {
    leaves: ["🍂", "🍁", "🍃", "🌿", "🌾", "🍀", "🌱"],
    flowers: ["🌸", "💮", "🏵️", "🌺", "🌼", "🌷", "🌹", "🥀", "🪻", "🪷"],
    winter: ["❄️", "⛄", "☃️", "✨", "⭐"],
    nature: ["🦋", "🐝", "🐞", "🪶", "🍄", "🌻"],
    seeds: ["🌾", "🌰", "🫘", "🥜"],
    other: ["🫧", "💧", "🎃"],
  },
} as const;

const TEXT = "︎";
const EMOJI = "️";
const SELECTORS = /[︎️]/g;

/** Force text presentation (colourable), e.g. ❄ instead of ❄️. */
export const asText = (glyph: string): string =>
  glyph.replace(SELECTORS, "") + TEXT;

/** Force emoji presentation (multicolour). */
export const asEmoji = (glyph: string): string =>
  glyph.replace(SELECTORS, "") + EMOJI;
