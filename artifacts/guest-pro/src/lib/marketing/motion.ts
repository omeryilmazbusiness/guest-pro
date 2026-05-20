/** Slow, heavy luxury motion tokens for marketing pages. */

export const HEAVY_EASE = [0.22, 1, 0.36, 1] as const;

export const SLOW_ENTER = {
  duration: 1.15,
  ease: HEAVY_EASE,
} as const;

export const SLOW_STAGGER = 0.14;
