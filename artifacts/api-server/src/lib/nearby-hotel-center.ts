/** Resolve guest nearby map hotel pin — priority: GM anchor → tracking → places centroid. */

export interface MapCoord {
  lat: number;
  lng: number;
}

function isValidCoord(c: MapCoord | null | undefined): c is MapCoord {
  if (!c) return false;
  return (
    Number.isFinite(c.lat) &&
    Number.isFinite(c.lng) &&
    !(c.lat === 0 && c.lng === 0)
  );
}

export function resolveNearbyHotelCenter(
  gmAnchor: MapCoord | null | undefined,
  trackingCenter: MapCoord | null | undefined,
  places: Array<{ lat: number; lng: number }>,
): MapCoord | null {
  if (isValidCoord(gmAnchor)) return gmAnchor;
  if (isValidCoord(trackingCenter)) return trackingCenter;
  if (places.length === 0) return null;
  if (places.length === 1) return { lat: places[0]!.lat, lng: places[0]!.lng };
  const lat = places.reduce((sum, p) => sum + p.lat, 0) / places.length;
  const lng = places.reduce((sum, p) => sum + p.lng, 0) / places.length;
  return { lat, lng };
}
