/** Small seeded PRNG (mulberry32): same seed, same layout, no hydration drift. */
export function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Picks an index by weight. `r` is a number in [0, 1). */
export function pickWeighted(weights: number[], r: number): number {
  const total = weights.reduce((sum, w) => sum + w, 0);
  let at = r * total;
  for (let i = 0; i < weights.length; i++) {
    at -= weights[i]!;
    if (at < 0) return i;
  }
  return weights.length - 1;
}
