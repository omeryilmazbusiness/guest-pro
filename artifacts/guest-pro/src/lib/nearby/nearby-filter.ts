import type { NearbyPlace } from "@/lib/welcoming/types";
import type { NearbyPlaceType } from "@/lib/welcoming/nearby-place-meta";

export type NearbyFilterKey = "all" | NearbyPlaceType;

export function filterNearbyPlaces(
  places: NearbyPlace[],
  filter: NearbyFilterKey,
  query: string,
  typeLabelFn: (type: NearbyPlaceType) => string,
): NearbyPlace[] {
  let list = places;
  if (filter !== "all") {
    list = list.filter((p) => p.type === filter);
  }
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter((p) => {
    const typeLabel = typeLabelFn(p.type).toLowerCase();
    const address = (p.address ?? "").toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      typeLabel.includes(q) ||
      address.includes(q)
    );
  });
}
