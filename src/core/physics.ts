/** Pure fling maths, so it can be tested without a DOM. Units: px, px/s, degrees. */

export interface Body {
  x: number;
  y: number;
  rot: number;
  vx: number;
  vy: number;
}

/** Resting fall speed (px/s) once a flung particle has lost its momentum. */
export const FALL = 70;

export const clamp = (v: number, max: number) =>
  Math.max(-max, Math.min(max, v));

/** Smooths the pointer velocity while dragging; `dt` is in seconds. */
export function trackPointer(b: Body, dx: number, dy: number, dt: number) {
  b.vx = b.vx * 0.5 + (dx / dt) * 0.5;
  b.vy = b.vy * 0.5 + (dy / dt) * 0.5;
  b.rot += b.vx * 0.004;
}

/** A stopped pointer means a drop, not a fling. */
export function releaseVelocity(b: Body, sinceLastMoveMs: number, max: number) {
  if (sinceLastMoveMs > 80) {
    b.vx = 0;
    b.vy = 0;
  }
  b.vx = clamp(b.vx, max);
  b.vy = clamp(b.vy, max);
}

/** One frame of flight: momentum fades into a slow, swaying fall. */
export function stepFlight(b: Body, dt: number, nowMs: number, phase: number) {
  b.vx *= Math.exp(-2.2 * dt);
  b.vy += (FALL - b.vy) * (1 - Math.exp(-1.4 * dt));
  b.x += (b.vx + Math.sin(nowMs / 700 + phase) * 22) * dt;
  b.y += b.vy * dt;
  b.rot += (b.vx * 0.2 + 25) * dt;
}

export function isGone(b: Body, width: number, height: number) {
  return b.y > height + 40 || b.x < -200 || b.x > width + 200;
}
