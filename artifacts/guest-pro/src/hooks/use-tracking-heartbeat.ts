/**
 * useTrackingHeartbeat — Guest presence heartbeat hook.
 *
 * Sends periodic heartbeats (coordinates + server-seen IP) when hotel tracking
 * is enabled. Does NOT call geolocation when tracking is off or permission is
 * denied — avoids CoreLocation console noise on desktop Safari.
 */

import { useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { sendPresenceHeartbeat, fetchGuestTrackingSettings } from "@/lib/tracking";
import {
  isGeolocationSupported,
  queryGeolocationPermission,
  readPositionOnce,
} from "@/lib/geolocation";

const HEARTBEAT_INTERVAL_MS = 60_000;
const MAX_ACCURACY_METERS = 500;
const GUEST_SETTINGS_KEY = ["tracking", "guest-settings"] as const;

export function useTrackingHeartbeat() {
  const lastSentAt = useRef(0);
  const geoBlockedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: settings } = useQuery({
    queryKey: GUEST_SETTINGS_KEY,
    queryFn: fetchGuestTrackingSettings,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const dispatchHeartbeat = useCallback(
    (lat: number | null, lng: number | null, accuracy: number | null) => {
      sendPresenceHeartbeat({ lat, lng, accuracy }).catch(() => {
        // Heartbeat failures must not affect the guest UX.
      });
      lastSentAt.current = Date.now();
    },
    [],
  );

  const runCycle = useCallback(async () => {
    if (geoBlockedRef.current || !isGeolocationSupported()) {
      dispatchHeartbeat(null, null, null);
      return;
    }

    const permission = await queryGeolocationPermission();
    if (permission === "denied") {
      geoBlockedRef.current = true;
      dispatchHeartbeat(null, null, null);
      return;
    }

    const position = await readPositionOnce();
    if (!position) {
      dispatchHeartbeat(null, null, null);
      return;
    }

    if (position.accuracy > MAX_ACCURACY_METERS) {
      dispatchHeartbeat(null, null, position.accuracy);
      return;
    }

    dispatchHeartbeat(position.lat, position.lng, position.accuracy);
  }, [dispatchHeartbeat]);

  useEffect(() => {
    if (settings === undefined) return;
    if (!settings.enabled) return;

    void runCycle();

    intervalRef.current = setInterval(() => {
      if (Date.now() - lastSentAt.current < HEARTBEAT_INTERVAL_MS - 2_000) return;
      void runCycle();
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [settings, runCycle]);
}
