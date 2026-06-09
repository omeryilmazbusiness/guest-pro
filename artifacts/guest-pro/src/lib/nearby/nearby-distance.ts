/**
 * Nearby place distance utilities — pure domain logic (no UI, no network).
 */

import type { NearbyPlace, PlaceCoords } from "@/lib/welcoming/types";

const EARTH_RADIUS_M = 6_371_000;

export function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lng2 - lng1);
  const a =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Human-readable walking distance label for guest UI. */
export function formatNearbyDistance(meters: number, locale = "en"): string {
  if (meters < 1000) {
    const rounded = Math.max(10, Math.round(meters / 10) * 10);
    return `${rounded} m`;
  }
  const km = meters / 1000;
  const formatted =
    km < 10
      ? km.toLocaleString(locale, { maximumFractionDigits: 1 })
      : Math.round(km).toLocaleString(locale);
  return `${formatted} km`;
}

export function withComputedDistance(
  place: NearbyPlace,
  origin: PlaceCoords | null | undefined,
  locale = "en",
): NearbyPlace {
  if (!origin?.lat || !origin?.lng || !place.coords) return place;
  const meters = haversineMeters(origin.lat, origin.lng, place.coords.lat, place.coords.lng);
  return {
    ...place,
    distanceMeters: meters,
    distance: formatNearbyDistance(meters, locale),
  };
}

export function sortPlacesByProximity(
  places: NearbyPlace[],
  origin: PlaceCoords | null | undefined,
  locale = "en",
): NearbyPlace[] {
  const enriched = places.map((p) => withComputedDistance(p, origin, locale));
  if (!origin) return enriched;
  return [...enriched].sort((a, b) => {
    const da = a.distanceMeters ?? Number.POSITIVE_INFINITY;
    const db = b.distanceMeters ?? Number.POSITIVE_INFINITY;
    if (da !== db) return da - db;
    return a.name.localeCompare(b.name);
  });
}

function isValidCoord(c: PlaceCoords): boolean {
  return (
    Number.isFinite(c.lat) &&
    Number.isFinite(c.lng) &&
    !(c.lat === 0 && c.lng === 0)
  );
}

/** Hotel map pin: tracking center, else centroid of configured places. */
export function resolveHotelCenter(
  trackingCenter: PlaceCoords | null | undefined,
  places: NearbyPlace[],
): PlaceCoords | null {
  if (trackingCenter && isValidCoord(trackingCenter)) return trackingCenter;

  const withCoords = places.filter((p) => p.coords && isValidCoord(p.coords));
  if (withCoords.length === 0) return null;

  if (withCoords.length === 1) return withCoords[0]!.coords!;

  const lat =
    withCoords.reduce((sum, p) => sum + p.coords!.lat, 0) / withCoords.length;
  const lng =
    withCoords.reduce((sum, p) => sum + p.coords!.lng, 0) / withCoords.length;
  return { lat, lng };
}
