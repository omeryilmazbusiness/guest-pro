/**
 * Guest-selectable UI locales — single source of truth for the language picker.
 */

export type GuestUiLocale =
  | "en"
  | "tr"
  | "ar"
  | "ru"
  | "fr"
  | "it"
  | "ur"
  | "fa"
  | "he"
  | "ku";

export interface GuestLanguageOption {
  code: GuestUiLocale;
  /** Native name shown in the picker */
  label: string;
  flag: string;
  voiceLocale: string;
  dir: "ltr" | "rtl";
}

export const GUEST_LANGUAGE_OPTIONS: GuestLanguageOption[] = [
  { code: "tr", label: "Türkçe", flag: "🇹🇷", voiceLocale: "tr-TR", dir: "ltr" },
  { code: "en", label: "English", flag: "🇬🇧", voiceLocale: "en-US", dir: "ltr" },
  { code: "ar", label: "العربية", flag: "🇸🇦", voiceLocale: "ar-SA", dir: "rtl" },
  { code: "ru", label: "Русский", flag: "🇷🇺", voiceLocale: "ru-RU", dir: "ltr" },
  { code: "fr", label: "Français", flag: "🇫🇷", voiceLocale: "fr-FR", dir: "ltr" },
  { code: "it", label: "Italiano", flag: "🇮🇹", voiceLocale: "it-IT", dir: "ltr" },
  { code: "ur", label: "اردو", flag: "🇵🇰", voiceLocale: "ur-PK", dir: "rtl" },
  { code: "fa", label: "فارسی", flag: "🇮🇷", voiceLocale: "fa-IR", dir: "rtl" },
  { code: "he", label: "עברית", flag: "🇮🇱", voiceLocale: "he-IL", dir: "rtl" },
  { code: "ku", label: "Kurdî", flag: "☀️", voiceLocale: "ku-TR", dir: "ltr" },
];

export const GUEST_UI_LOCALES = GUEST_LANGUAGE_OPTIONS.map((o) => o.code);

const RTL_UI_LOCALES = new Set<GuestUiLocale>(["ar", "ur", "fa", "he"]);

const LS_PREFIX = "guestpro_guest_locale";
export const GUEST_LOCALE_CHANGE_EVENT = "guest-locale-change";

export function isGuestUiLocale(value: string): value is GuestUiLocale {
  return GUEST_UI_LOCALES.includes(value as GuestUiLocale);
}

export function normalizeGuestUiLocale(uiLocale: string): GuestUiLocale {
  const base = uiLocale?.split("-")[0]?.toLowerCase() ?? "en";
  return isGuestUiLocale(base) ? base : "en";
}

export function guestVoiceLocaleFromUi(uiLocale: GuestUiLocale): string {
  return GUEST_LANGUAGE_OPTIONS.find((o) => o.code === uiLocale)?.voiceLocale ?? "en-US";
}

export function guestDirFromUi(uiLocale: GuestUiLocale): "ltr" | "rtl" {
  return RTL_UI_LOCALES.has(uiLocale) ? "rtl" : "ltr";
}

function storageKey(guestId?: number | null): string {
  return guestId != null ? `${LS_PREFIX}_${guestId}` : LS_PREFIX;
}

export function readGuestLocalePreference(guestId?: number | null): GuestUiLocale | null {
  try {
    const scoped = guestId != null ? localStorage.getItem(storageKey(guestId)) : null;
    const raw = scoped ?? localStorage.getItem(storageKey());
    if (raw && isGuestUiLocale(raw)) return raw;
  } catch {
    // restricted storage
  }
  return null;
}

export function writeGuestLocalePreference(locale: GuestUiLocale, guestId?: number | null): void {
  try {
    localStorage.setItem(storageKey(guestId), locale);
    if (guestId != null) {
      localStorage.setItem(storageKey(), locale);
    }
  } catch {
    // ignore
  }
}

export function clearGuestLocalePreference(guestId?: number | null): void {
  try {
    localStorage.removeItem(storageKey());
    if (guestId != null) {
      localStorage.removeItem(storageKey(guestId));
    }
  } catch {
    // ignore
  }
}
