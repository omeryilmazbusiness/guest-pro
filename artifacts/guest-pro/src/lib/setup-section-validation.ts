import { parseCoordinateInput } from "@/lib/nearby/coords";
import type { HotelAmenityConfig } from "@/lib/hotel-assistant-config";
import { ABOUT_HOTEL_MIN_CHARS } from "@/lib/hotel-setup";

export function hasText(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
}

export function validateAboutHotel(text: string, minChars = ABOUT_HOTEL_MIN_CHARS): boolean {
  return text.trim().length >= minChars;
}

export function validateFacilities(amenities: HotelAmenityConfig[]): boolean {
  return amenities.some((a) => a.enabled);
}

export function validateWifiRow(name: string, password: string): "empty" | "complete" | "partial" {
  const n = name.trim();
  const p = password.trim();
  if (!n && !p) return "empty";
  if (n && p) return "complete";
  return "partial";
}

export function validateNearbyRow(
  name: string,
  lat: string,
  lng: string,
  address: string,
  description: string,
): "empty" | "complete" | "partial-name" | "partial-coords" | "invalid-coords" {
  const n = name.trim();
  const hasCoords = Boolean(lat.trim() || lng.trim());
  const hasOther = Boolean(address.trim() || description.trim());
  if (!n && !hasCoords && !hasOther) return "empty";
  if (!n) return "partial-name";
  if (!hasCoords) return "partial-coords";
  if (!parseCoordinateInput(lat, lng)) return "invalid-coords";
  return "complete";
}

export function validateEnabledServiceFields(...fields: Array<string | null | undefined>): boolean {
  return fields.some((f) => hasText(f));
}
