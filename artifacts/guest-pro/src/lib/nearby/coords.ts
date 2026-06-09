/**
 * Nearby coordinate parsing & normalization — pure domain logic.
 */

import { haversineMeters } from "@/lib/nearby/nearby-distance";

export interface CoordPair {
  lat: number;
  lng: number;
}

export interface NormalizedCoords {
  coords: CoordPair;
  swapped: boolean;
}

const MAX_DISTANCE_FROM_HOTEL_M = 50_000;

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

/** Heuristic for Turkey / Eastern Med when lat/lng columns are reversed. */
export function isLikelyLatLngSwap(lat: number, lng: number): boolean {
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

/**
 * Pick the most plausible coordinate pair, optionally using hotel anchor distance.
 */
export function normalizePlaceCoords(
  lat: number,
  lng: number,
  anchor?: CoordPair | null,
): NormalizedCoords {
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

export function distanceFromAnchorMeters(coords: CoordPair, anchor: CoordPair): number {
  return haversineMeters(anchor.lat, anchor.lng, coords.lat, coords.lng);
}

export function isWithinHotelRadius(coords: CoordPair, anchor: CoordPair): boolean {
  return distanceFromAnchorMeters(coords, anchor) <= MAX_DISTANCE_FROM_HOTEL_M;
}

/** Parse "41.07, 28.73" or Google Maps URLs pasted into a field. */
export function parseCoordinateInput(latInput: string, lngInput: string): CoordPair | null {
  const latTrim = latInput.trim();
  const lngTrim = lngInput.trim();

  if (!lngTrim && latTrim) {
    const fromUrl = parseGoogleMapsCoordString(latTrim);
    if (fromUrl) return fromUrl;

    const parts = latTrim.split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const lat = Number.parseFloat(parts[0]!);
      const lng = Number.parseFloat(parts[1]!);
      if (isValidCoordPair(lat, lng)) return { lat, lng };
    }
  }

  if (latTrim && !lngTrim) {
    const fromUrl = parseGoogleMapsCoordString(latTrim);
    if (fromUrl) return fromUrl;
  }

  const lat = Number.parseFloat(latTrim);
  const lng = Number.parseFloat(lngTrim);
  if (!isValidCoordPair(lat, lng)) return null;
  return { lat, lng };
}

export function parseGoogleMapsCoordString(input: string): CoordPair | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const atMatch = trimmed.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (atMatch) {
    const lat = Number.parseFloat(atMatch[1]!);
    const lng = Number.parseFloat(atMatch[2]!);
    if (isValidCoordPair(lat, lng)) return { lat, lng };
  }

  const qMatch = trimmed.match(/[?&]q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (qMatch) {
    const lat = Number.parseFloat(qMatch[1]!);
    const lng = Number.parseFloat(qMatch[2]!);
    if (isValidCoordPair(lat, lng)) return { lat, lng };
  }

  const bareMatch = trimmed.match(/^(-?\d+(?:\.\d+)?)\s*[,;]\s*(-?\d+(?:\.\d+)?)$/);
  if (bareMatch) {
    const lat = Number.parseFloat(bareMatch[1]!);
    const lng = Number.parseFloat(bareMatch[2]!);
    if (isValidCoordPair(lat, lng)) return { lat, lng };
  }

  return null;
}
