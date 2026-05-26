import type { WelcomingLocale } from "./types";
import { DEFAULT_WELCOMING_LOCALE } from "./languages";
import { getHotelSlugFromPath } from "@/lib/hotel-slug-from-path";

const VALID_LOCALES: WelcomingLocale[] = ["tr", "en", "ru", "hi", "ur", "ja"];

function storageKeys(hotelSlug: string) {
  const s = hotelSlug.trim().toLowerCase() || "default";
  return {
    locale: `guestpro_welcoming_locale_${s}`,
    seen: `guestpro_welcoming_seen_${s}`,
  };
}

/** Active tenant slug for kiosk storage (from URL). */
export function getWelcomingHotelSlug(): string {
  return getHotelSlugFromPath() ?? "default";
}

/** Read the persisted welcoming locale for this hotel. */
export function getPersistedWelcomingLocale(hotelSlug = getWelcomingHotelSlug()): WelcomingLocale {
  const stored = localStorage.getItem(storageKeys(hotelSlug).locale);
  if (stored && (VALID_LOCALES as string[]).includes(stored)) {
    return stored as WelcomingLocale;
  }
  return DEFAULT_WELCOMING_LOCALE;
}

export function getRawPersistedWelcomingLocale(
  hotelSlug = getWelcomingHotelSlug(),
): string | null {
  return localStorage.getItem(storageKeys(hotelSlug).locale);
}

export function persistWelcomingLocale(
  locale: WelcomingLocale,
  hotelSlug = getWelcomingHotelSlug(),
): void {
  localStorage.setItem(storageKeys(hotelSlug).locale, locale);
}

export function markWelcomingAsSeen(hotelSlug = getWelcomingHotelSlug()): void {
  localStorage.setItem(storageKeys(hotelSlug).seen, "1");
}

export function hasSeenWelcoming(hotelSlug = getWelcomingHotelSlug()): boolean {
  return localStorage.getItem(storageKeys(hotelSlug).seen) === "1";
}

export function resetWelcoming(hotelSlug = getWelcomingHotelSlug()): void {
  const keys = storageKeys(hotelSlug);
  localStorage.removeItem(keys.seen);
  localStorage.removeItem(keys.locale);
}
