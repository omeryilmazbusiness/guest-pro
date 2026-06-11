import type { HotelAmenityConfig } from "./types";

export const AMENITY_CATALOG: { id: string; label: string }[] = [
  { id: "spa", label: "Spa" },
  { id: "pool", label: "Swimming pool" },
  { id: "aquapark", label: "Aquapark" },
  { id: "gym", label: "Fitness / gym" },
  { id: "restaurant", label: "Restaurant" },
  { id: "beach", label: "Beach / sea access" },
  { id: "kids_club", label: "Kids club" },
  { id: "garden", label: "Garden / terrace" },
  { id: "tennis", label: "Tennis courts" },
  { id: "golf", label: "Golf" },
];

export function defaultAmenities(): HotelAmenityConfig[] {
  return AMENITY_CATALOG.map((a) => ({ id: a.id, enabled: false }));
}

export function mergeAmenities(stored: HotelAmenityConfig[] | null | undefined): HotelAmenityConfig[] {
  const byId = new Map((stored ?? []).map((a) => [a.id, a]));
  return AMENITY_CATALOG.map((cat) => {
    const existing = byId.get(cat.id);
    return existing
      ? { id: cat.id, enabled: Boolean(existing.enabled), ...pickAmenityFields(existing) }
      : { id: cat.id, enabled: false };
  });
}

function pickAmenityFields(a: HotelAmenityConfig): Partial<HotelAmenityConfig> {
  const out: Partial<HotelAmenityConfig> = {};
  if (a.openTime?.trim()) out.openTime = a.openTime.trim();
  if (a.closeTime?.trim()) out.closeTime = a.closeTime.trim();
  if (a.reservationPhone?.trim()) out.reservationPhone = a.reservationPhone.trim();
  if (a.notes?.trim()) out.notes = a.notes.trim();
  return out;
}
