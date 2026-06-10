import { customFetch } from "@workspace/api-client-react";

export interface HotelWifiNetwork {
  id: number;
  hotelId: number;
  name: string;
  wifiPassword: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface GuestWifiResponse {
  configured: boolean;
  name?: string;
  wifiPassword?: string;
}

export async function listWifiNetworks(): Promise<HotelWifiNetwork[]> {
  const data = await customFetch<{ networks: HotelWifiNetwork[] }>("/api/hotel/wifi-networks");
  return data.networks;
}

export async function saveWifiNetworks(
  networks: Array<{
    id?: number;
    name: string;
    password: string;
    sortOrder?: number;
  }>,
): Promise<HotelWifiNetwork[]> {
  const data = await customFetch<{ networks: HotelWifiNetwork[] }>("/api/hotel/wifi-networks", {
    method: "PUT",
    body: JSON.stringify({ networks }),
  });
  return data.networks;
}

export async function fetchGuestWifi(): Promise<GuestWifiResponse> {
  return customFetch<GuestWifiResponse>("/api/guest/wifi");
}
