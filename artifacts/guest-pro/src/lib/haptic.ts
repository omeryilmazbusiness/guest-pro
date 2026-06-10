export type HapticStyle = "light" | "medium" | "heavy" | "open" | "success";

const PATTERNS: Record<HapticStyle, number | number[]> = {
  light: 8,
  medium: 18,
  heavy: [12, 28, 14],
  open: [10, 35, 12],
  success: [8, 45, 10],
};

let lastAt = 0;
/** True while a pointer/touch sequence is in progress (capture phase). */
let inPointerGesture = false;
/** True after the user has interacted with the top-level frame at least once. */
let frameEngaged = false;

if (typeof window !== "undefined") {
  const armGesture = () => {
    frameEngaged = true;
    inPointerGesture = true;
  };
  const disarmGesture = () => {
    queueMicrotask(() => {
      inPointerGesture = false;
    });
  };

  window.addEventListener("pointerdown", armGesture, { capture: true, passive: true });
  window.addEventListener("pointerup", disarmGesture, { capture: true, passive: true });
  window.addEventListener("pointercancel", disarmGesture, { capture: true, passive: true });
  // click fires after pointerup; keep gesture armed for onClick handlers (e.g. bill card)
  window.addEventListener("click", armGesture, { capture: true, passive: true });
  window.addEventListener(
    "keydown",
    () => {
      armGesture();
      disarmGesture();
    },
    { capture: true, passive: true },
  );
}

type NavigatorWithActivation = Navigator & {
  userActivation?: { isActive: boolean; hasBeenActive: boolean };
};

/**
 * Chrome blocks navigator.vibrate without a user gesture and logs [Intervention].
 * Gate on capture-tracked pointer state instead of calling vibrate speculatively.
 */
function canVibrateNow(): boolean {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") {
    return false;
  }
  if (!frameEngaged || !inPointerGesture) {
    return false;
  }
  const activation = (navigator as NavigatorWithActivation).userActivation;
  if (activation && !activation.isActive) {
    return false;
  }
  return true;
}

/** Best-effort tactile feedback during a user gesture only. Silent no-op otherwise. */
export function triggerHaptic(style: HapticStyle): void {
  if (!canVibrateNow()) return;

  const now = Date.now();
  if (now - lastAt < 40) return;
  lastAt = now;

  try {
    const ok = navigator.vibrate(PATTERNS[style]);
    if (ok === false) return;
  } catch {
    // Blocked or unsupported — ignore.
  }
}
