/**
 * Guest geolocation helpers — permission-aware, desktop-safe reads.
 *
 * Desktop browsers (especially Safari on macOS) often lack GPS hardware.
 * watchPosition + enableHighAccuracy triggers repeated CoreLocation failures
 * (kCLErrorLocationUnknown). We use one-shot getCurrentPosition instead.
 */

export type GeoPermission = PermissionState | "unsupported";

export type GeolocationFailureReason =
  | "unsupported"
  | "denied"
  | "unavailable"
  | "timeout";

export type PositionReadOutcome =
  | { ok: true; position: PositionReadResult }
  | { ok: false; reason: GeolocationFailureReason };

/** True on desktop / non-touch devices where coarse location is preferred. */
export function prefersCoarseLocation(): boolean {
  if (typeof window === "undefined") return true;
  const touch = window.matchMedia("(pointer: coarse)").matches;
  const mobileUa = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  return !touch && !mobileUa;
}

export function isGeolocationSupported(): boolean {
  return typeof navigator !== "undefined" && "geolocation" in navigator;
}

export async function queryGeolocationPermission(): Promise<GeoPermission> {
  if (!navigator.permissions?.query) return "unsupported";
  try {
    const result = await navigator.permissions.query({ name: "geolocation" });
    return result.state;
  } catch {
    return "unsupported";
  }
}

export interface PositionReadResult {
  lat: number;
  lng: number;
  accuracy: number;
}

const DEFAULT_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 10_000,
  maximumAge: 60_000,
};

function mapGeolocationError(error: GeolocationPositionError): GeolocationFailureReason {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "denied";
    case error.TIMEOUT:
      return "timeout";
    case error.POSITION_UNAVAILABLE:
    default:
      return "unavailable";
  }
}

/**
 * Single geolocation read. Never throws.
 * Tries low accuracy first on desktop; optional high-accuracy retry on mobile.
 */
export function readPositionOnce(
  preferHighAccuracy = !prefersCoarseLocation(),
): Promise<PositionReadOutcome> {
  if (!isGeolocationSupported()) {
    return Promise.resolve({ ok: false, reason: "unsupported" });
  }

  const attempt = (enableHighAccuracy: boolean) =>
    new Promise<PositionReadOutcome>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            ok: true,
            position: {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
            },
          });
        },
        (err) => resolve({ ok: false, reason: mapGeolocationError(err) }),
        { ...DEFAULT_OPTIONS, enableHighAccuracy },
      );
    });

  return attempt(preferHighAccuracy).then((result) => {
    if (result.ok || !preferHighAccuracy) return result;
    return attempt(false);
  });
}

/** @deprecated Prefer readPositionOnce — kept for simple null-on-failure callers. */
export async function readPositionOrNull(): Promise<PositionReadResult | null> {
  const outcome = await readPositionOnce();
  return outcome.ok ? outcome.position : null;
}
