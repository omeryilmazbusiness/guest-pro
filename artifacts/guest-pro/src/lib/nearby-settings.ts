import { customFetch } from "@workspace/api-client-react";
import type { PlaceCoords } from "@/lib/welcoming/types";

export interface HotelNearbyAnchor {
  lat: number;
  lng: number;
  label: string | null;
}

export async function fetchHotelNearbyAnchor(): Promise<HotelNearbyAnchor | null> {
  const data = await customFetch<{ hotelAnchor: HotelNearbyAnchor | null }>(
    "/api/hotel/nearby-settings",
  );
  return data.hotelAnchor;
}

export async function saveHotelNearbyAnchor(payload: {
  hotelLat: number;
  hotelLng: number;
  hotelLabel?: string | null;
}): Promise<HotelNearbyAnchor> {
  const data = await customFetch<{ hotelAnchor: HotelNearbyAnchor }>("/api/hotel/nearby-settings", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return data.hotelAnchor;
}

/** Client-side mirror of API hotel center resolution. */
export function resolveGuestHotelCenter(
  apiCenter: PlaceCoords | null | undefined,
  places: Array<{ coords?: PlaceCoords }>,
): PlaceCoords | null {
  if (
    apiCenter &&
    Number.isFinite(apiCenter.lat) &&
    Number.isFinite(apiCenter.lng) &&
    !(apiCenter.lat === 0 && apiCenter.lng === 0)
  ) {
    return apiCenter;
  }
  const withCoords = places.filter((p) => p.coords);
  if (withCoords.length === 0) return null;
  if (withCoords.length === 1) return withCoords[0]!.coords!;
  const lat = withCoords.reduce((s, p) => s + p.coords!.lat, 0) / withCoords.length;
  const lng = withCoords.reduce((s, p) => s + p.coords!.lng, 0) / withCoords.length;
  return { lat, lng };
}
