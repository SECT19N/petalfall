import type { ParticleSpec, PresetName, PetalfallOptions } from "./types";

const confettiColors = ["#f25f5c", "#ffe066", "#50c878", "#4ea8de", "#b388eb"];

export const PRESETS: Record<PresetName, PetalfallOptions> = {
  sakura: {
    count: 16,
    color: "#f2a7bd",
    particles: ["sakura", "heart", "almond", "drop", "sliver"],
  },
  autumn: {
    count: 18,
    size: [14, 26],
    opacity: 0.75,
    wind: 8,
    particles: [
      { shape: "maple", color: "#c8642a" },
      { shape: "maple", color: "#d99a2b" },
      { shape: "leaf", color: "#a3441f" },
      { shape: "leaf", color: "#8a6d1f" },
    ],
  },
  snow: {
    count: 40,
    size: [4, 12],
    opacity: 0.85,
    wind: 3,
    speed: 0.8,
    color: "#ffffff",
    particles: [
      { shape: "dot", weight: 4 },
      { shape: "snowflake", weight: 1 },
    ],
  },
  confetti: {
    count: 36,
    size: [6, 12],
    opacity: 0.9,
    speed: 1.4,
    wind: 10,
    particles: confettiColors.flatMap<ParticleSpec>((color) => [
      { shape: "almond", color },
      { shape: "sliver", color },
    ]),
  },
};
