/**
 * useTrackingHeartbeat — Guest presence heartbeat hook.
 *
 * Requests geolocation permission professionally and sends a heartbeat to the
 * backend whenever the guest's position updates. The backend determines the
 * final tracking status using both the location data and the request source IP.
 *
 * Privacy rules:
 *   - Location is only ever sent to this app's own backend.
 *   - Permission denied / unsupported is handled cleanly with no errors shown.
 *   - A heartbeat is also sent without location (lat/lng = null) so the
 *     backend can record UNKNOWN status when permission is denied.
 *
 * Rate limiting:
 *   - Minimum 60 s between heartbeats to avoid backend spam.
 *   - watchPosition provides accurate updates without polling.
 */

import { useEffect, useRef, useCallback } from "react";
import { sendPresenceHeartbeat } from "@/lib/tracking";

const HEARTBEAT_INTERVAL_MS = 60_000; // minimum 60 s between sends

export function useTrackingHeartbeat() {
  const lastSentAt = useRef<number>(0);
  const watchIdRef = useRef<number | null>(null);

  const sendHeartbeat = useCallback(
    (lat: number | null, lng: number | null, accuracy: number | null) => {
      const now = Date.now();
      if (now - lastSentAt.current < HEARTBEAT_INTERVAL_MS) return;
      lastSentAt.current = now;

      sendPresenceHeartbeat({ lat, lng, accuracy }).catch(() => {
        // Silently ignore — heartbeat failures must not affect the guest UX.
      });
    },
    []
  );

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      // Browser does not support geolocation — send a no-location heartbeat
      // so the backend records UNKNOWN status.
      sendHeartbeat(null, null, null);
      return;
    }

    const onPosition = (pos: GeolocationPosition) => {
      sendHeartbeat(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
    };

    const onError = () => {
      // Permission denied or unavailable — send a no-location heartbeat.
      sendHeartbeat(null, null, null);
    };

    const options: PositionOptions = {
      enableHighAccuracy: false,
      timeout: 15_000,
      maximumAge: 30_000,
    };

    // Start watching; watchPosition fires on every meaningful position change.
    watchIdRef.current = navigator.geolocation.watchPosition(
      onPosition,
      onError,
      options
    );

    // Also send an immediate heartbeat on mount (no location yet — UNKNOWN).
    // The watchPosition callback will fire shortly after with actual data.
    sendHeartbeat(null, null, null);

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [sendHeartbeat]);
}
