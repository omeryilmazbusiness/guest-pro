import { GUEST_SECTION_IDS } from "@/lib/guest-dashboard-nav";

const RESTORE_SCROLL_KEY = "guestpro:restore-dashboard-scroll";

/** Remember dashboard scroll (quick-actions anchor) before leaving for flow/chat. */
export function markGuestDashboardScrollRestore(): void {
  try {
    const el = document.getElementById(GUEST_SECTION_IDS.quickActions);
    const y = el
      ? el.getBoundingClientRect().top + window.scrollY - 72
      : window.scrollY;
    sessionStorage.setItem(RESTORE_SCROLL_KEY, String(Math.max(0, Math.round(y))));
  } catch {
    /* ignore */
  }
}

/** Restore scroll after returning to guest home; returns pixels or null. */
export function consumeGuestDashboardScrollRestore(): number | null {
  try {
    const raw = sessionStorage.getItem(RESTORE_SCROLL_KEY);
    sessionStorage.removeItem(RESTORE_SCROLL_KEY);
    if (raw == null) return null;
    const y = parseInt(raw, 10);
    return Number.isFinite(y) ? y : null;
  } catch {
    return null;
  }
}
