/** Nearby coordinate normalization — server-side mirror of guest-pro lib/nearby/coords.ts */

export interface CoordPair {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_M = 6_371_000;
const MAX_DISTANCE_FROM_HOTEL_M = 50_000;

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lng2 - lng1);
  const a =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isValidCoordPair(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !(lat === 0 && lng === 0)
  );
}

function isLikelyLatLngSwap(lat: number, lng: number): boolean {
  const latLooksLikeLng = lat >= 25 && lat <= 46;
  const lngLooksLikeLat = lng >= 34 && lng <= 43;
  return latLooksLikeLng && lngLooksLikeLat;
}

function coordCandidates(lat: number, lng: number): CoordPair[] {
  const direct = { lat, lng };
  const swapped = { lat: lng, lng: lat };
  if (swapped.lat === direct.lat && swapped.lng === direct.lng) return [direct];
  return [direct, swapped];
}

export function normalizePlaceCoords(
  lat: number,
  lng: number,
  anchor?: CoordPair | null,
): { coords: CoordPair; swapped: boolean } {
  if (!isValidCoordPair(lat, lng)) {
    return { coords: { lat, lng }, swapped: false };
  }

  const candidates = coordCandidates(lat, lng);

  if (anchor && isValidCoordPair(anchor.lat, anchor.lng)) {
    let best = candidates[0]!;
    let bestDist = haversineMeters(anchor.lat, anchor.lng, best.lat, best.lng);

    for (const c of candidates.slice(1)) {
      const d = haversineMeters(anchor.lat, anchor.lng, c.lat, c.lng);
      if (d < bestDist) {
        best = c;
        bestDist = d;
      }
    }

    return {
      coords: best,
      swapped: best.lat !== lat || best.lng !== lng,
    };
  }

  if (isLikelyLatLngSwap(lat, lng)) {
    return { coords: { lat: lng, lng: lat }, swapped: true };
  }

  return { coords: { lat, lng }, swapped: false };
}

export function isWithinHotelRadius(coords: CoordPair, anchor: CoordPair): boolean {
  return haversineMeters(anchor.lat, anchor.lng, coords.lat, coords.lng) <= MAX_DISTANCE_FROM_HOTEL_M;
}
