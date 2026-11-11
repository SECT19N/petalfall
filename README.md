# petalfall

[![npm version](https://img.shields.io/npm/v/petalfall)](https://www.npmjs.com/package/petalfall)
[![CI](https://github.com/SECT19N/petalfall/actions/workflows/ci.yml/badge.svg)](https://github.com/SECT19N/petalfall/actions/workflows/ci.yml)
[![bundle size](https://img.shields.io/bundlephobia/minzip/petalfall)](https://bundlephobia.com/package/petalfall)
[![types](https://img.shields.io/npm/types/petalfall)](https://www.npmjs.com/package/petalfall)
[![license](https://img.shields.io/npm/l/petalfall)](./LICENSE)

Customizable falling petals, leaves, snow and emoji for any website. Zero
dependencies, framework-agnostic, with a grab-and-fling interaction.

**[Live demo and playground →](https://sect19n.github.io/petalfall/)**

- **Tiny.** About 5 kB gzipped, no runtime dependencies.
- **Cheap to run.** Animations are CSS only; JS runs only for a particle someone is holding or has flung.
- **Yours to style.** Ten built-in shapes, four presets, plus emoji, text glyphs, images and inline SVG.
- **Considerate.** Respects `prefers-reduced-motion`, ignores pointer events outside grabbing, safe in SSR.

## Quick start

### npm

```sh
npm install petalfall
# or: pnpm add petalfall / yarn add petalfall
```

### Vanilla JS / TypeScript

```ts
import { mount } from "petalfall";

const pf = mount(document.body, { preset: "sakura" });

pf.update({ count: 30 }); // change options, particles are rebuilt
pf.pause();
pf.resume();
pf.destroy(); // removes the particles and every listener
```

### Plain HTML (no build step)

```html
<script type="module">
  import { mount } from "https://esm.sh/petalfall";

  mount(document.body, { preset: "snow" });
</script>
```

### React

`react` (18 or newer) is an optional peer dependency, needed only for `petalfall/react`.

```tsx
import { Petalfall } from "petalfall/react";

export function App() {
  return (
    <>
      <Petalfall
        preset="autumn"
        count={20}
        grab={{ onGrab: () => console.log("caught") }}
      />
      {/* the rest of your app */}
    </>
  );
}
```

`<Petalfall>` renders nothing. Changing its props updates the running instance
instead of restarting it, and `onGrab` / `isCovered` can be new functions on
every render.

Prefer a hook? Use `usePetalfall(options, target?)`.

To keep the particles inside one element, pass a ref as `target`:

```tsx
import { useRef } from "react";
import { Petalfall } from "petalfall/react";

export function Hero() {
  const hero = useRef<HTMLElement>(null);
  return (
    <section ref={hero}>
      <Petalfall preset="sakura" target={hero} />
      <h1>Hello</h1>
    </section>
  );
}
```

### Next.js / SSR

Nothing special is needed. The `petalfall/react` entry ships with a
`"use client"` directive, and `mount` returns a no-op on the server.

## Presets

Pick one with `preset`. Any other option you pass overrides it.

| Preset     | What you get                                               | Highlights                                    |
| ---------- | ---------------------------------------------------------- | --------------------------------------------- |
| `sakura`   | Pink cherry-blossom petals, hearts and slivers             | 16 particles, soft pink `#f2a7bd`             |
| `autumn`   | Maple and plain leaves in orange, amber, rust and olive    | 18 larger particles (14–26 px), more opaque   |
| `snow`     | Mostly round dots with the occasional snowflake            | 40 icy-blue particles, slow fall              |
| `confetti` | Almonds and slivers in red, yellow, green, blue and purple | 36 particles, fast fall, strong sideways wind |

```ts
mount(document.body, { preset: "autumn", count: 40, wind: 12 });
```

The presets are exported as `PRESETS` if you want to read or extend them:

```ts
import { PRESETS, mount } from "petalfall";

mount(document.body, { ...PRESETS.snow, layer: "front" });
```

## Shapes

Built-in shapes are drawn as small SVGs and follow the `color` option.

| Shape       | Used by presets  |
| ----------- | ---------------- |
| `sakura`    | sakura           |
| `almond`    | sakura, confetti |
| `heart`     | sakura           |
| `drop`      | sakura           |
| `sliver`    | sakura, confetti |
| `leaf`      | autumn           |
| `maple`     | autumn           |
| `feather`   |                  |
| `dot`       | snow             |
| `snowflake` | snow             |

Use a shape by name, or give it its own colour and weight:

```ts
particles: ["sakura", { shape: "maple", color: "#c8642a", weight: 3 }];
```

The raw definitions are exported as `SHAPES`.

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

**Text glyphs vs emoji.** Text glyphs (❀ ✿ ☘ ❄ ✦) follow `color`. Emoji are
multicolour and drawn by the OS, so they look different on Apple, Google and
Microsoft systems and can't be recoloured. Some characters can be either;
`asText("❄")` and `asEmoji("❄")` pick one. Glyphs the system can't draw (new
emoji on an old OS) are skipped automatically.

`glyphs` has ready-made sets: `glyphs.text.florals`, `glyphs.emoji.nature`, `glyphs.emoji.seeds`, and so on.

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

## Recipes

### Emoji rain

```ts
mount(document.body, {
  particles: ["🍂", "🍁", "🍃"],
  count: 24,
  opacity: 0.8,
  size: [16, 28],
});
```

### Use a ready-made glyph set

```ts
import { glyphs, mount } from "petalfall";

mount(document.body, {
  particles: glyphs.text.florals,
  color: "#c0507a",
});
```

### Your own SVG petal

```ts
mount(document.body, {
  particles: [
    {
      svg: "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'><path d='M5 0C9 3 9 8 5 10 1 8 1 3 5 0Z' fill='#f2a7bd'/></svg>",
    },
  ],
});
```

### Snow in front of the page

```ts
mount(document.body, { preset: "snow", layer: "front" });
```

In front, particles can be grabbed anywhere, since nothing is drawn over them.

### Snow only inside a card

```ts
mount(document.querySelector(".card")!, { preset: "snow", count: 20 });
```

### Count how many petals were caught

```ts
let caught = 0;

mount(document.body, {
  preset: "sakura",
  grab: {
    onGrab: () => {
      caught++;
      counter.textContent = String(caught);
    },
  },
});
```

### Keep buttons and links clickable

Links, buttons and form fields already keep their own clicks. Add more with a
selector:

```ts
mount(document.body, {
  grab: { interactive: "a, button, input, textarea, select, .my-widget" },
});
```

### Turn grabbing off

```ts
mount(document.body, { preset: "sakura", grab: false });
```

### Identical layout every time

```ts
mount(document.body, { preset: "sakura", seed: 42 });
```

Handy for screenshots and visual tests.

### Always show it, even with reduced motion

```ts
mount(document.body, { preset: "snow", respectReducedMotion: false });
```

Only do this if the animation is essential. By default visitors who ask for
less motion see nothing.

### Switch presets at runtime

```ts
const pf = mount(document.body, { preset: "sakura" });

document.querySelector("#season")!.addEventListener("change", (e) => {
  pf.update({ preset: (e.target as HTMLSelectElement).value as "snow" });
});
```

### Pause when the tab content is busy

```ts
const pf = mount(document.body, { preset: "autumn" });

document.addEventListener("visibilitychange", () => {
  document.hidden ? pf.pause() : pf.resume();
});
```

## Notes

- Animations are CSS only; JS runs only for a held or flying particle.
- Particles are `aria-hidden` and ignore pointer events outside grabbing.
- Calling `mount` on the server returns a no-op, so it's safe in SSR code.
- Styles are added through a constructed stylesheet when supported, so a strict
  `style-src` CSP doesn't block them.
- The `http://www.w3.org/2000/svg` string in the source is the SVG XML
  namespace identifier. It is never fetched.

MIT
