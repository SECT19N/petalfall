# petalfall

Customizable falling petals, leaves, snow and emoji for any website. Zero
dependencies, framework-agnostic, with a grab-and-fling interaction.

```ts
import { mount } from "petalfall";

const pf = mount(document.body, { preset: "sakura" });
// pf.update({ count: 30 }); pf.pause(); pf.resume(); pf.destroy();
```

React:

```tsx
import { Petalfall } from "petalfall/react";

<Petalfall
  preset="autumn"
  count={20}
  grab={{ onGrab: () => console.log("caught") }}
/>;
```

## Options

| Option                 | Default               |                                                                                 |
| ---------------------- | --------------------- | ------------------------------------------------------------------------------- |
| `preset`               |                       | `"sakura"`, `"autumn"`, `"snow"`, `"confetti"`. Your other options override it. |
| `count`                | `14`                  | Number of particles.                                                            |
| `speed`                | `1`                   | Fall speed multiplier.                                                          |
| `wind`                 | `6`                   | Sideways drift, as a percentage of the width.                                   |
| `size`                 | `[9, 20]`             | `[min, max]` px.                                                                |
| `opacity`              | `0.35`                | 0 to 1.                                                                         |
| `color`                | pink                  | Default colour for shapes and text glyphs.                                      |
| `seed`                 | `1`                   | Same seed, same layout.                                                         |
| `particles`            | the five petal shapes | See below.                                                                      |
| `layer`                | `"behind"`            | `"behind"` the page or in `"front"` of it.                                      |
| `respectReducedMotion` | `true`                | Hide everything for visitors who ask for less motion.                           |
| `grab`                 | `{}`                  | Grab-and-fling options, or `false` to turn it off.                              |

### Particles

```ts
particles: [
  "sakura", // a built-in shape
  "🍂", // an emoji
  "❀", // a text glyph (takes `color`)
  { shape: "maple", color: "#c8642a" }, // shape with its own colour
  { glyph: "✿", color: "#c0507a", weight: 3 }, // weight = how often it appears
  { image: "/leaf.png" }, // an image URL
  { svg: "<svg viewBox='0 0 10 10'>...</svg>" }, // inline SVG (rendered as an image, scripts never run)
];
```

Shapes: `almond`, `sakura`, `drop`, `heart`, `sliver`, `dot`, `leaf`, `maple`,
`snowflake`.

**Text glyphs vs emoji.** Text glyphs (❀ ✿ ☘ ❄ ✦) follow `color`. Emoji are
multicolour and drawn by the OS, so they look different on Apple, Google and
Microsoft systems and can't be recoloured. Some characters can be either;
`asText("❄")` and `asEmoji("❄")` pick one. Glyphs the system can't draw (new
emoji on an old OS) are skipped automatically.

`glyphs` has ready-made sets: `glyphs.text.florals`, `glyphs.emoji.leaves`, and so on.

### Grab and fling

Visitors can pick a particle up and throw it. `grab` takes:

- `onGrab(el)`: called on each pick-up (count them, play a sound...).
- `reach`: extra hit area in px (default 14).
- `maxFling`: fastest throw in px/s (default 1800).
- `interactive`: CSS selector of elements that keep their own clicks.
- `isCovered(x, y)`: return true where an opaque element hides a particle. The
  default checks backgrounds for `layer: "behind"`.

### Fall inside an element

`mount(element, ...)` keeps the particles inside that element. It is made
`position: relative` if it was static.

## Notes

- Animations are CSS only; JS runs only for a held or flying particle.
- Particles are `aria-hidden` and ignore pointer events outside grabbing.
- Calling `mount` on the server returns a no-op, so it's safe in SSR code.
- Styles are added through a constructed stylesheet when supported, so a strict
  `style-src` CSP doesn't block them.

MIT
