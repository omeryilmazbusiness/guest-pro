import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { fetchRememberMeActive, type RememberMeActiveSchedule } from "@/lib/tracking";

const POLL_MS = 15_000;
export const REMEMBER_ME_CHANGED_EVENT = "remember-me-changed";

export function useRememberMeSchedule() {
  const { isAuthenticated, user } = useAuth();
  const enabled = isAuthenticated && user?.role === "guest";
  const [active, setActive] = useState<RememberMeActiveSchedule | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setActive(null);
      return;
    }
    try {
      const next = await fetchRememberMeActive();
      setActive(next);
    } catch {
      /* keep last known state */
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
    if (!enabled) return;

    const onChanged = () => void refresh();
    window.addEventListener(REMEMBER_ME_CHANGED_EVENT, onChanged);

    const pollMs = active ? 5_000 : POLL_MS;
    const id = setInterval(() => void refresh(), pollMs);
    return () => {
      clearInterval(id);
      window.removeEventListener(REMEMBER_ME_CHANGED_EVENT, onChanged);
    };
  }, [enabled, refresh, active?.scheduleId]);

  const progress = active?.awaitingAck
    ? Math.max(0, 1 - (active.secondsUntilEscalation ?? 0) / 30)
    : (active?.progress ?? 0);

  return {
    active,
    progress,
    urgent: !!active?.awaitingAck,
    refresh,
  };
}

export function notifyRememberMeChanged(): void {
  window.dispatchEvent(new Event(REMEMBER_ME_CHANGED_EVENT));
}
