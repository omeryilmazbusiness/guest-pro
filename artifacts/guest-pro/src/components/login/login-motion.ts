/** Shared iOS-style motion tokens for the login screen. */

export const IOS_EASE = [0.32, 0.72, 0, 1] as const;

/** Segmented pill — snappy with subtle settle. */
export const PILL_SPRING = {
  type: "spring" as const,
  stiffness: 520,
  damping: 38,
  mass: 0.72,
};

/** Tab label weight / opacity. */
export const LABEL_SPRING = {
  type: "spring" as const,
  stiffness: 480,
  damping: 34,
};

/** Panel slide + scale. */
export const PANEL_SPRING = {
  type: "spring" as const,
  stiffness: 400,
  damping: 36,
  mass: 0.88,
};

export const PANEL_FADE = {
  duration: 0.28,
  ease: IOS_EASE,
};

export const PAGE_ENTER = {
  duration: 0.65,
  ease: IOS_EASE,
};
