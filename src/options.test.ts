import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { needsRebuild, resolveOptions } from "./options";
import { resolveParticle } from "./core/particles";
import { asEmoji, asText } from "./glyphs";

describe("resolveOptions", () => {
  it("fills defaults", () => {
    const o = resolveOptions();
    assert.equal(o.count, 14);
    assert.deepEqual(o.size, [9, 20]);
    assert.equal(o.layer, "behind");
    assert.deepEqual(o.grab, {});
  });
  it("lets your options override a preset", () => {
    const o = resolveOptions({ preset: "snow", count: 5 });
    assert.equal(o.count, 5);
    assert.equal(o.color, "#b4d0ee");
  });
  it("ignores undefined values and unknown presets", () => {
    const o = resolveOptions({ count: undefined, preset: "nope" as never });
    assert.equal(o.count, 14);
  });
  it("clamps nonsense", () => {
    const o = resolveOptions({
      count: -3,
      speed: 0,
      opacity: 4,
      size: [30, 10],
    });
    assert.equal(o.count, 0);
    assert.equal(o.speed, 0.1);
    assert.equal(o.opacity, 1);
    assert.deepEqual(o.size, [10, 30]);
  });
  it("turns grab off", () => {
    assert.equal(resolveOptions({ grab: false }).grab, false);
    assert.equal(resolveOptions({ grab: { enabled: false } }).grab, false);
  });
});

describe("resolveParticle", () => {
  it("reads a bare string as a shape or a glyph", () => {
    assert.deepEqual(resolveParticle("sakura"), {
      kind: "shape",
      shape: "sakura",
      weight: 1,
    });
    assert.deepEqual(resolveParticle("🍂"), {
      kind: "glyph",
      glyph: "🍂",
      weight: 1,
    });
  });
  it("turns inline SVG into an image URL, never markup", () => {
    const p = resolveParticle({ svg: "<svg onload='x()'/>" });
    assert.equal(p.kind, "image");
    assert.ok(p.kind === "image" && p.image.startsWith("data:image/svg+xml,"));
  });
  it("falls back to a safe weight", () => {
    assert.equal(resolveParticle({ shape: "dot", weight: -2 }).weight, 1);
  });
});

describe("glyph helpers", () => {
  it("forces text or emoji presentation", () => {
    assert.equal(asText("❄️"), "❄︎");
    assert.equal(asEmoji("❄"), "❄️");
  });
});

describe("needsRebuild", () => {
  const base = resolveOptions({ preset: "sakura" });
  it("applies opacity and colour in place", () => {
    const next = resolveOptions({
      preset: "sakura",
      opacity: 0.8,
      color: "red",
    });
    assert.equal(needsRebuild(base, next), false);
  });
  it("rebuilds when the layout changes", () => {
    assert.equal(
      needsRebuild(base, resolveOptions({ preset: "sakura", count: 3 })),
      true,
    );
    assert.equal(
      needsRebuild(base, resolveOptions({ preset: "sakura", seed: 9 })),
      true,
    );
    assert.equal(needsRebuild(base, resolveOptions({ preset: "snow" })), true);
  });
  it("rebuilds when a grab callback is swapped", () => {
    const a = resolveOptions({ grab: { onGrab: () => {} } });
    const b = resolveOptions({ grab: { onGrab: () => {} } });
    assert.equal(needsRebuild(a, b), true);
    assert.equal(needsRebuild(a, a), false);
  });
});
