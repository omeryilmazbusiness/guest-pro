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
 * "daddr" = destination address. Origin is left to the user's device.
 */
export function buildGoogleMapsDirectionsLink(coords: PlaceCoords, placeName: string): string {
  const dest = encodeURIComponent(`${coords.lat},${coords.lng}`);
  const label = encodeURIComponent(placeName);
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}&destination_place_id=${label}&travelmode=walking`;
}

/**
 * Returns the URL that the QR code should encode.
 * Scanning the QR on a phone opens Google Maps ready for navigation.
 */
export function buildQrPayload(coords: PlaceCoords, placeName: string): string {
  return buildGoogleMapsDirectionsLink(coords, placeName);
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
