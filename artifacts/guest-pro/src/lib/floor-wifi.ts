import { customFetch } from "@workspace/api-client-react";

export interface HotelFloorWifiEntry {
  id: number;
  hotelId: number;
  floorKey: string;
  floorLabel: string;
  wifiPassword: string;
  wifiSsid: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface GuestFloorWifiResponse {
  configured: boolean;
  roomNumber: string | null;
  floorKey: string | null;
  floorLabel?: string;
  wifiPassword?: string;
  wifiSsid?: string | null;
}

export async function listFloorWifi(): Promise<HotelFloorWifiEntry[]> {
  const data = await customFetch<{ floors: HotelFloorWifiEntry[] }>("/api/hotel/floor-wifi");
  return data.floors;
}

export async function saveFloorWifi(
  floors: Array<{
    floorKey: string;
    floorLabel: string;
    wifiPassword: string;
    wifiSsid?: string | null;
    sortOrder?: number;
  }>,
): Promise<HotelFloorWifiEntry[]> {
  const data = await customFetch<{ floors: HotelFloorWifiEntry[] }>("/api/hotel/floor-wifi", {
    method: "PUT",
    body: JSON.stringify({ floors }),
  });
  return data.floors;
}

export async function fetchGuestFloorWifi(): Promise<GuestFloorWifiResponse> {
  return customFetch<GuestFloorWifiResponse>("/api/guest/floor-wifi");
}
