import { useQuery } from "@tanstack/react-query";
import { fetchGuestNearbyPlaces, mapApiPlaceToNearby } from "@/lib/nearby-places";
import { normalizePlaceCoords } from "@/lib/nearby/coords";

export function useGuestNearbyPlaces(enabled = true) {
  return useQuery({
    queryKey: ["guest-nearby-places"],
    queryFn: async () => {
      const data = await fetchGuestNearbyPlaces();
      const anchor = data.hotelCenter;
      return {
        places: data.places.map((row) => {
          const place = mapApiPlaceToNearby(row);
          if (place.coords && anchor) {
            const { coords } = normalizePlaceCoords(place.coords.lat, place.coords.lng, anchor);
            return { ...place, coords };
          }
          return place;
        }),
        hotelCenter: data.hotelCenter,
      };
    },
    staleTime: 5 * 60_000,
    enabled,
    retry: (failureCount, error) => {
      const status = (error as { status?: number })?.status;
      if (status === 404 || status === 401 || status === 403) return false;
      return failureCount < 2;
    },
  });
}
