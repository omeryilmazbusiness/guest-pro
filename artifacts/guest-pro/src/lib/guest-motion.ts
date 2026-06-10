/**
 * Apple-style motion tokens for the guest experience.
 */

export { IOS_EASE, PANEL_SPRING, PANEL_FADE } from "@/components/login/login-motion";

/** Minimum time the home skeleton stays visible (ms). */
export const GUEST_MIN_SKELETON_MS = 850;

/** Guest route push / pop (home ↔ chat ↔ flow). */
export const GUEST_PAGE_SPRING = {
  type: "spring" as const,
  stiffness: 300,
  damping: 32,
  mass: 1,
};

export const GUEST_PAGE_FADE = {
  duration: 0.42,
  ease: [0.32, 0.72, 0, 1] as const,
};

/** Dashboard content reveal after skeleton. */
export const GUEST_CONTENT_ENTER = {
  duration: 0.58,
  ease: [0.25, 0.82, 0.35, 1] as const,
};

/** Bottom sheets & modals. */
export const GUEST_SHEET_SPRING = {
  type: "spring" as const,
  stiffness: 360,
  damping: 34,
  mass: 0.92,
};

/** Centered modals (concierge quick actions, etc.). */
export const GUEST_MODAL_SPRING = {
  type: "spring" as const,
  stiffness: 400,
  damping: 32,
  mass: 0.88,
};

export const GUEST_OVERLAY_FADE = {
  duration: 0.32,
  ease: [0.32, 0.72, 0, 1] as const,
};

/** In-flow wizard step transitions. */
export const GUEST_STEP_SPRING = {
  type: "spring" as const,
  stiffness: 340,
  damping: 30,
  mass: 0.85,
};

/** Tactile tile press. */
export const GUEST_TAP_SPRING = {
  type: "spring" as const,
  stiffness: 520,
  damping: 28,
  mass: 0.65,
};

export type GuestNavDirection = "forward" | "back";

const GUEST_ROUTE_DEPTH: Record<string, number> = {
  home: 0,
  chat: 1,
  flow: 1,
  scan: 1,
  auto: 0,
};

export function guestRouteSegment(path: string): keyof typeof GUEST_ROUTE_DEPTH {
  if (path.includes("/guest/flow")) return "flow";
  if (path.includes("/guest/chat")) return "chat";
  if (path.includes("/guest/passport-scan")) return "scan";
  if (path.includes("/guest/auto-login")) return "auto";
  if (/\/guest\/?$/.test(path) || path.endsWith("/guest")) return "home";
  return "home";
}

export function guestNavDirection(prevPath: string, nextPath: string): GuestNavDirection {
  const prev = GUEST_ROUTE_DEPTH[guestRouteSegment(prevPath)] ?? 0;
  const next = GUEST_ROUTE_DEPTH[guestRouteSegment(nextPath)] ?? 0;
  return next >= prev ? "forward" : "back";
}
