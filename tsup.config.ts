import { defineConfig } from "tsup";

const shared = {
  format: ["esm", "cjs"] as ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  target: "es2020",
  clean: false, // the build script empties dist first (two configs build in parallel)
};

export default defineConfig([
  { ...shared, entry: { index: "src/index.ts" } },
  {
    ...shared,
    entry: { react: "src/react.tsx" },
    // The React wrapper imports the core by name so the two entries share one copy.
    external: ["react", "petalfall"],
    banner: { js: '"use client";' },
  },
]);
