import type { WelcomingLocale } from "./types";
import { DEFAULT_WELCOMING_LOCALE } from "./languages";

const LOCALE_KEY = "guestpro_welcoming_locale";
const SEEN_KEY   = "guestpro_welcoming_seen";

const VALID_LOCALES: WelcomingLocale[] = ["tr", "en", "ru", "hi", "ur", "ja"];

/** Read the persisted welcoming locale. Returns DEFAULT_WELCOMING_LOCALE if not set. */
export function getPersistedWelcomingLocale(): WelcomingLocale {
  const stored = localStorage.getItem(LOCALE_KEY);
  if (stored && (VALID_LOCALES as string[]).includes(stored)) {
    return stored as WelcomingLocale;
  }
  return DEFAULT_WELCOMING_LOCALE;
}

/** Returns null when no locale has been explicitly chosen (haven't done welcoming). */
export function getRawPersistedWelcomingLocale(): string | null {
  return localStorage.getItem(LOCALE_KEY);
}

/** Persist the guest's chosen welcoming locale. */
export function persistWelcomingLocale(locale: WelcomingLocale): void {
  localStorage.setItem(LOCALE_KEY, locale);
}

/** Mark welcoming as seen — home.tsx will no longer redirect to /welcoming. */
export function markWelcomingAsSeen(): void {
  localStorage.setItem(SEEN_KEY, "1");
}

/** Has the guest already completed the welcoming flow on this device? */
export function hasSeenWelcoming(): boolean {
  return localStorage.getItem(SEEN_KEY) === "1";
}

/** Reset welcoming state (useful for testing or "change language" flows). */
export function resetWelcoming(): void {
  localStorage.removeItem(SEEN_KEY);
  localStorage.removeItem(LOCALE_KEY);
}
