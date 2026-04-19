/**
 * Welcome-area support alert — public API caller.
 *
 * Sends a "Guest calling from welcome area" alert to the hotel reception
 * without requiring any authentication.
 *
 * An anonymous sessionId is generated once per browser session and reused
 * so that repeated taps don't flood the system with duplicate alerts.
 */

const SESSION_KEY = "guestpro_welcome_session";

/** Returns a stable anonymous session ID for this browser tab/session. */
function getOrCreateSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `wlc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export interface WelcomeSupportResult {
  ok: boolean;
  alertId?: number;
}

/**
 * Creates a public welcome-area support alert.
 *
 * @param selectedLanguage  The locale the guest is currently viewing (e.g. "tr")
 */
export async function callForWelcomeSupport(
  selectedLanguage: string,
): Promise<WelcomeSupportResult> {
  try {
    const sessionId = getOrCreateSessionId();
    const res = await fetch("/api/public/welcome-support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selectedLanguage, sessionId }),
    });
    if (!res.ok) return { ok: false };
    const data = (await res.json()) as { id: number };
    return { ok: true, alertId: data.id };
  } catch {
    return { ok: false };
  }
}
