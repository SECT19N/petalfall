import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createRng, pickWeighted } from "./rng";

describe("createRng", () => {
  it("repeats for the same seed and differs between seeds", () => {
    const a = createRng(7);
    const b = createRng(7);
    const c = createRng(8);
    const seqA = [a(), a(), a()];
    assert.deepEqual(seqA, [b(), b(), b()]);
    assert.notDeepEqual(seqA, [c(), c(), c()]);
  });
  it("stays in [0, 1)", () => {
    const r = createRng(1);
    for (let i = 0; i < 1000; i++) {
      const v = r();
      assert.ok(v >= 0 && v < 1);
    }
  });
});

describe("pickWeighted", () => {
  it("honours weights", () => {
    assert.equal(pickWeighted([1, 3], 0.1), 0);
    assert.equal(pickWeighted([1, 3], 0.3), 1);
    assert.equal(pickWeighted([1, 3], 0.999), 1);
  });
});
