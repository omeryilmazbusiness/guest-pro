import { useQuery } from "@tanstack/react-query";
import { fetchGuestFloorWifi } from "@/lib/floor-wifi";

export function useGuestFloorWifi(enabled = true) {
  return useQuery({
    queryKey: ["guest-floor-wifi"],
    queryFn: fetchGuestFloorWifi,
    staleTime: 5 * 60_000,
    enabled,
    retry: (failureCount, error) => {
      const status = (error as { status?: number })?.status;
      if (status === 404 || status === 401 || status === 403) return false;
      return failureCount < 2;
    },
  });
}
