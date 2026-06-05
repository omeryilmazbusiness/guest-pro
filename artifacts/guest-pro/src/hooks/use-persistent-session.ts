import { useCallback, useEffect, useRef } from "react";
import {
  customFetch,
  getGetMeQueryKey,
  type LoginResponse,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  SESSION_REFRESH_INTERVAL_MS,
  shouldRefreshSessionToken,
} from "@/lib/session-token";

type UsePersistentSessionOptions = {
  token: string | null;
  setToken: (token: string | null) => void;
  onSessionInvalid: () => void;
};

/**
 * Keeps guest and manager sessions alive until explicit logout.
 * Silently refreshes the HMAC token on an interval and when the tab regains focus.
 */
export function usePersistentSession({
  token,
  setToken,
  onSessionInvalid,
}: UsePersistentSessionOptions) {
  const queryClient = useQueryClient();
  const refreshingRef = useRef(false);

  const refreshIfNeeded = useCallback(async () => {
    if (!token || refreshingRef.current) return;
    if (!shouldRefreshSessionToken(token)) return;

    refreshingRef.current = true;
    try {
      const result = await customFetch<LoginResponse>("/api/auth/refresh", {
        method: "POST",
      });
      setToken(result.token);
      queryClient.setQueryData(getGetMeQueryKey(), result.user);
    } catch (error: unknown) {
      const status =
        typeof error === "object" &&
        error !== null &&
        "status" in error &&
        typeof (error as { status: unknown }).status === "number"
          ? (error as { status: number }).status
          : undefined;
      if (status === 401 || status === 403) {
        onSessionInvalid();
      }
    } finally {
      refreshingRef.current = false;
    }
  }, [token, setToken, queryClient, onSessionInvalid]);

  useEffect(() => {
    if (!token) return;

    void refreshIfNeeded();

    const intervalId = window.setInterval(() => {
      void refreshIfNeeded();
    }, SESSION_REFRESH_INTERVAL_MS);

    const onFocus = () => {
      void refreshIfNeeded();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void refreshIfNeeded();
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [token, refreshIfNeeded]);
}
