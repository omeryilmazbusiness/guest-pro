/**
 * Guest geolocation helpers — permission-aware, desktop-safe reads.
 *
 * Desktop browsers (especially Safari on macOS) often lack GPS hardware.
 * watchPosition + enableHighAccuracy triggers repeated CoreLocation failures
 * (kCLErrorLocationUnknown). We use one-shot getCurrentPosition instead.
 */

export type GeoPermission = PermissionState | "unsupported";

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

/**
 * Single geolocation read. Resolves null on any failure — never throws.
 * Tries low accuracy first on desktop; optional high-accuracy retry on mobile.
 */
export function readPositionOnce(
  preferHighAccuracy = !prefersCoarseLocation(),
): Promise<PositionReadResult | null> {
  if (!isGeolocationSupported()) return Promise.resolve(null);

  const attempt = (enableHighAccuracy: boolean) =>
    new Promise<PositionReadResult | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
        },
        () => resolve(null),
        { ...DEFAULT_OPTIONS, enableHighAccuracy },
      );
    });

  return attempt(preferHighAccuracy).then((result) => {
    if (result || !preferHighAccuracy) return result;
    return attempt(false);
  });
}
