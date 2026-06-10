import { useQuery } from "@tanstack/react-query";
import { fetchGuestWifi } from "@/lib/hotel-wifi";

export function useGuestWifi(enabled = true) {
  return useQuery({
    queryKey: ["guest-wifi"],
    queryFn: fetchGuestWifi,
    staleTime: 5 * 60_000,
    enabled,
    retry: (failureCount, error) => {
      const status = (error as { status?: number })?.status;
      if (status === 404 || status === 401 || status === 403) return false;
      return failureCount < 2;
    },
  });
}
