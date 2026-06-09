/**
 * Maps link builder — clean abstraction over Google Maps deep-link format.
 *
 * Keeps all URL construction out of UI components.
 * No API key required — uses standard deep links that open in the Maps app.
 */

export interface PlaceCoords {
  lat: number;
  lng: number;
}

/**
 * Returns a Google Maps URL that opens the place and prompts for walking directions.
 * Works on desktop (opens google.com/maps) and mobile (deep-links to the Maps app).
 */
export function buildGoogleMapsLink(coords: PlaceCoords, placeName: string): string {
  const query = encodeURIComponent(placeName);
  return `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}&query_place_name=${query}`;
}

/**
 * Returns a Google Maps directions URL from the hotel to the place.
 * Uses lat,lng destination only — never a free-text place_id (causes wrong routing).
 */
export function buildGoogleMapsDirectionsLink(
  coords: PlaceCoords,
  _placeName?: string,
  origin?: PlaceCoords,
): string {
  const params = new URLSearchParams({
    api: "1",
    travelmode: "walking",
    destination: `${coords.lat},${coords.lng}`,
  });
  if (origin && Number.isFinite(origin.lat) && Number.isFinite(origin.lng)) {
    params.set("origin", `${origin.lat},${origin.lng}`);
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/**
 * Returns the URL that the QR code should encode.
 * Scanning the QR on a phone opens Google Maps ready for navigation.
 */
export function buildQrPayload(
  coords: PlaceCoords,
  placeName: string,
  origin?: PlaceCoords,
): string {
  return buildGoogleMapsDirectionsLink(coords, placeName, origin);
}

/**
 * Returns an OpenStreetMap embed URL for the place.
 * No API key required.
 */
export function buildOsmEmbedUrl(coords: PlaceCoords): string {
  const margin = 0.003;
  const bbox = [
    coords.lng - margin,
    coords.lat - margin,
    coords.lng + margin,
    coords.lat + margin,
  ].join(",");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${coords.lat},${coords.lng}`;
}

/**
 * Google Maps iframe embed for a single point — no JS API key required.
 * The q= parameter pins the hotel location on the embedded map.
 */
export function buildGoogleMapsHotelEmbedUrl(
  center: PlaceCoords,
  zoom = 15,
  label?: string | null,
): string {
  const coords = `${center.lat},${center.lng}`;
  const trimmedLabel = label?.trim();
  const q = trimmedLabel
    ? `${coords}(${trimmedLabel.replace(/\s+/g, "+")})`
    : coords;
  return `https://maps.google.com/maps?q=${q}&hl=en&z=${zoom}&output=embed`;
}

/**
 * OpenStreetMap embed framing hotel + optional nearby place (hotel marker always shown).
 */
export function buildOsmBoundsEmbedUrl(
  hotel: PlaceCoords,
  place?: PlaceCoords | null,
  padding = 0.006,
  marker?: PlaceCoords | null,
): string {
  const points = place ? [hotel, place] : [hotel];
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const bbox = [
    Math.min(...lngs) - padding,
    Math.min(...lats) - padding,
    Math.max(...lngs) + padding,
    Math.max(...lats) + padding,
  ].join(",");
  const pin = marker ?? place ?? hotel;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${pin.lat},${pin.lng}`;
}

/** Degree span between two coords (cheap pre-check before map framing). */
export function coordSpanDegrees(a: PlaceCoords, b: PlaceCoords): number {
  return Math.max(Math.abs(a.lat - b.lat), Math.abs(a.lng - b.lng));
}

/** Zoom level for Google hotel embed when a place is selected nearby. */
export function computeNearbyMapZoom(hotel: PlaceCoords, place: PlaceCoords): number {
  const span = coordSpanDegrees(hotel, place);
  if (span > 0.08) return 12;
  if (span > 0.04) return 13;
  if (span > 0.02) return 14;
  return 15;
}

/**
 * Guest nearby map — always anchors on the GM-configured hotel pin.
 * Never uses route/directions embed (unreliable without API key, hides hotel pin).
 */
export function buildGuestNearbyMapEmbedUrl(
  hotel: PlaceCoords,
  options?: {
    selectedPlace?: PlaceCoords | null;
    hotelLabel?: string | null;
  },
): string | null {
  if (!Number.isFinite(hotel.lat) || !Number.isFinite(hotel.lng)) return null;

  const selectedPlace = options?.selectedPlace;
  if (!selectedPlace) {
    return buildGoogleMapsHotelEmbedUrl(hotel, 15, options?.hotelLabel);
  }

  const span = coordSpanDegrees(hotel, selectedPlace);
  // Different region / bad coordinates — keep hotel map stable.
  if (span > 2) {
    return buildGoogleMapsHotelEmbedUrl(hotel, 15, options?.hotelLabel);
  }
  if (span > 0.003) {
    return buildOsmBoundsEmbedUrl(hotel, selectedPlace, 0.006, selectedPlace);
  }
  return buildGoogleMapsHotelEmbedUrl(hotel, 16, options?.hotelLabel);
}

/**
 * @deprecated Route iframe embed is unreliable without Maps Embed API key.
 * Use buildGuestNearbyMapEmbedUrl for previews; deep links for directions.
 */
export function buildGoogleMapsRouteEmbedUrl(
  origin: PlaceCoords,
  destination: PlaceCoords,
): string {
  return (
    `https://maps.google.com/maps?saddr=${origin.lat},${origin.lng}` +
    `&daddr=${destination.lat},${destination.lng}&hl=en&z=14&output=embed`
  );
}
