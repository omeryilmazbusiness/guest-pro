import { useQuery } from "@tanstack/react-query";
import { listWifiNetworks } from "@/lib/hotel-wifi";

export function useHotelWifiNetworks(enabled = true) {
  return useQuery({
    queryKey: ["hotel-wifi-networks"],
    queryFn: listWifiNetworks,
    staleTime: 60_000,
    enabled,
    retry: 1,
  });
}
