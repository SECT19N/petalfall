// Run: pnpm test (tsx --test)
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  type Body,
  FALL,
  isGone,
  releaseVelocity,
  stepFlight,
  trackPointer,
} from "./physics";

const body = (over: Partial<Body> = {}): Body => ({
  x: 0,
  y: 0,
  rot: 0,
  vx: 0,
  vy: 0,
  ...over,
});

describe("trackPointer", () => {
  it("smooths velocity towards the pointer speed", () => {
    const b = body();
    trackPointer(b, 100, 0, 1);
    assert.equal(b.vx, 50);
    trackPointer(b, 100, 0, 1);
    assert.equal(b.vx, 75);
  });
  it("tilts with sideways speed", () => {
    const b = body();
    trackPointer(b, 1000, 0, 1);
    assert.ok(b.rot > 0);
  });
});

describe("releaseVelocity", () => {
  it("clamps a hard fling", () => {
    const b = body({ vx: 5000, vy: -5000 });
    releaseVelocity(b, 10, 1800);
    assert.equal(b.vx, 1800);
    assert.equal(b.vy, -1800);
  });
  it("drops instead of flinging when the pointer stopped", () => {
    const b = body({ vx: 900, vy: 900 });
    releaseVelocity(b, 200, 1800);
    assert.equal(b.vx, 0);
    assert.equal(b.vy, 0);
  });
});

describe("stepFlight", () => {
  it("fades sideways momentum and settles to the resting fall speed", () => {
    const b = body({ vx: 1000, vy: -1000 });
    for (let i = 0; i < 600; i++) stepFlight(b, 1 / 60, i * 16, 0);
    assert.ok(Math.abs(b.vx) < 1);
    assert.ok(Math.abs(b.vy - FALL) < 1);
  });
});

describe("isGone", () => {
  it("is true only well off-screen", () => {
    assert.equal(isGone(body({ x: 100, y: 100 }), 800, 600), false);
    assert.equal(isGone(body({ x: 100, y: 700 }), 800, 600), true);
    assert.equal(isGone(body({ x: -300, y: 100 }), 800, 600), true);
    assert.equal(isGone(body({ x: 1100, y: 100 }), 800, 600), true);
  });
});
