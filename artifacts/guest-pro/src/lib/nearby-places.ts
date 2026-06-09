import { customFetch } from "@workspace/api-client-react";
import type { NearbyPlace, PlaceCoords } from "@/lib/welcoming/types";

export type NearbyPlaceType = NearbyPlace["type"];

export interface HotelNearbyPlaceEntry {
  id: number;
  hotelId: number;
  name: string;
  address: string | null;
  type: NearbyPlaceType;
  description: string | null;
  lat: number;
  lng: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GuestNearbyPlaceEntry {
  id: number;
  name: string;
  address: string | null;
  type: NearbyPlaceType;
  description: string | null;
  lat: number;
  lng: number;
  sortOrder: number;
}

export interface GuestHotelCenter extends PlaceCoords {
  label?: string | null;
}

export interface GuestNearbyPlacesResponse {
  places: GuestNearbyPlaceEntry[];
  hotelCenter: GuestHotelCenter | null;
}

export function mapApiPlaceToNearby(row: GuestNearbyPlaceEntry | HotelNearbyPlaceEntry): NearbyPlace {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    address: row.address ?? undefined,
    description: row.description ?? undefined,
    distance: "—",
    coords: { lat: row.lat, lng: row.lng },
  };
}

export async function listNearbyPlaces(): Promise<HotelNearbyPlaceEntry[]> {
  const data = await customFetch<{ places: HotelNearbyPlaceEntry[] }>("/api/hotel/nearby-places");
  return data.places;
}

export async function saveNearbyPlaces(
  places: Array<{
    name: string;
    address?: string | null;
    type: NearbyPlaceType;
    description?: string | null;
    lat: number;
    lng: number;
    sortOrder?: number;
    isActive?: boolean;
  }>,
): Promise<HotelNearbyPlaceEntry[]> {
  const data = await customFetch<{ places: HotelNearbyPlaceEntry[] }>("/api/hotel/nearby-places", {
    method: "PUT",
    body: JSON.stringify({ places }),
  });
  return data.places;
}

export async function fetchGuestNearbyPlaces(): Promise<GuestNearbyPlacesResponse> {
  return customFetch<GuestNearbyPlacesResponse>("/api/guest/nearby-places");
}
