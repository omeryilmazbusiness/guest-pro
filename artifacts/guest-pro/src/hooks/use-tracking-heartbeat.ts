/**
 * useTrackingHeartbeat — Guest presence heartbeat hook.
 *
 * Requests geolocation and sends a heartbeat to the backend so the server
 * can resolve the guest's tracking status (IN_HOTEL_AND_ON_WIFI, etc.).
 *
 * ── Rate-limit design ──────────────────────────────────────────────────────
 * The hook does NOT send a null "UNKNOWN" heartbeat on mount.
 * Reason: doing so stamps lastSentAt and then the rate limiter blocks the
 * real GPS position that arrives 1-5 s later via watchPosition, leaving the
 * guest permanently at UNKNOWN until the full 60 s interval expires.
 *
 * Instead:
 *  - The first heartbeat with real coordinates is ALWAYS sent immediately
 *    (rate limit is bypassed for the very first successful position).
 *  - Subsequent positions are rate-limited to at most once per 60 s.
 *  - If geolocation is unsupported or denied, a single null heartbeat is
 *    sent so the backend records UNKNOWN — but this only happens AFTER the
 *    real attempt has failed, so it never clobbers a pending GPS fix.
 *
 * ── Accuracy filtering ─────────────────────────────────────────────────────
 * Positions with accuracy > MAX_ACCURACY_METERS (500 m) are skipped.
 * The backend will keep the previous snapshot until a better fix arrives.
 * This prevents a coarse IP-only geolocation blob from overriding a good
 * GPS fix that placed the guest inside the hotel.
 *
 * ── Privacy ────────────────────────────────────────────────────────────────
 * Location is only sent to this app's own backend.
 * Permission denied / unsupported is handled cleanly — no errors surfaced.
 */

import { useEffect, useRef, useCallback } from "react";
import { sendPresenceHeartbeat } from "@/lib/tracking";

const HEARTBEAT_INTERVAL_MS = 60_000;   // min time between heartbeats
const FALLBACK_TIMEOUT_MS   = 12_000;   // send null if no position in 12 s
const MAX_ACCURACY_METERS   = 500;      // skip positions coarser than this

export function useTrackingHeartbeat() {
  const lastSentAt       = useRef<number>(0);
  const hasSentFirst     = useRef<boolean>(false);  // true after first real send
  const watchIdRef       = useRef<number | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dispatchHeartbeat = useCallback(
    (lat: number | null, lng: number | null, accuracy: number | null) => {
      sendPresenceHeartbeat({ lat, lng, accuracy }).catch(() => {
        // Heartbeat failures must not affect the guest UX.
      });
      lastSentAt.current = Date.now();
      hasSentFirst.current = true;
    },
    []
  );

  const tryHeartbeat = useCallback(
    (lat: number | null, lng: number | null, accuracy: number | null) => {
      const isFirstEver = !hasSentFirst.current;

      // Always send the very first real position — do not rate-limit it.
      if (isFirstEver) {
        dispatchHeartbeat(lat, lng, accuracy);
        return;
      }

      // Subsequent: respect the rate limit.
      if (Date.now() - lastSentAt.current >= HEARTBEAT_INTERVAL_MS) {
        dispatchHeartbeat(lat, lng, accuracy);
      }
    },
    [dispatchHeartbeat]
  );

  useEffect(() => {
    // ── No geolocation support ───────────────────────────────────────────
    if (!("geolocation" in navigator)) {
      dispatchHeartbeat(null, null, null);
      return;
    }

    // ── Fallback: if no position arrives in FALLBACK_TIMEOUT_MS, send null
    // This handles the case where the user dismisses the permission prompt or
    // the device takes too long to get a fix.
    fallbackTimerRef.current = setTimeout(() => {
      if (!hasSentFirst.current) {
        dispatchHeartbeat(null, null, null);
      }
    }, FALLBACK_TIMEOUT_MS);

    // ── watchPosition ────────────────────────────────────────────────────
    const onPosition = (pos: GeolocationPosition) => {
      // Clear the fallback timer — we got a real position.
      if (fallbackTimerRef.current !== null) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }

      const { latitude, longitude, accuracy } = pos.coords;

      // Skip coarse positions to avoid geofence false-positives.
      // Still send null so backend knows we're alive but can't place us.
      if (accuracy > MAX_ACCURACY_METERS) {
        tryHeartbeat(null, null, accuracy);
        return;
      }

      tryHeartbeat(latitude, longitude, accuracy);
    };

    const onError = () => {
      // Clear the fallback timer — we got a definitive error.
      if (fallbackTimerRef.current !== null) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
      // Send one null heartbeat so backend records UNKNOWN.
      if (!hasSentFirst.current) {
        dispatchHeartbeat(null, null, null);
      }
    };

    const geoOptions: PositionOptions = {
      enableHighAccuracy: true,   // GPS-grade accuracy for indoor geofencing
      timeout: 15_000,
      maximumAge: 30_000,
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      onPosition,
      onError,
      geoOptions,
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (fallbackTimerRef.current !== null) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
    };
  }, [dispatchHeartbeat, tryHeartbeat]);
}
