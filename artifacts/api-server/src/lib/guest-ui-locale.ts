/**
 * Guest-facing language picker options — keep in sync with guest-pro guest-locale.ts.
 */

export const GUEST_SELECTABLE_UI_LOCALES = [
  "en",
  "tr",
  "ar",
  "ru",
  "fr",
  "it",
  "ur",
  "fa",
  "he",
  "ku",
] as const;

export type GuestSelectableUiLocale = (typeof GUEST_SELECTABLE_UI_LOCALES)[number];

const UI_TO_VOICE: Record<GuestSelectableUiLocale, string> = {
  en: "en-US",
  tr: "tr-TR",
  ar: "ar-SA",
  ru: "ru-RU",
  fr: "fr-FR",
  it: "it-IT",
  ur: "ur-PK",
  fa: "fa-IR",
  he: "he-IL",
  ku: "ku-TR",
};

export function isGuestSelectableUiLocale(value: string): value is GuestSelectableUiLocale {
  return (GUEST_SELECTABLE_UI_LOCALES as readonly string[]).includes(value);
}

export function voiceLocaleFromGuestUi(uiLocale: GuestSelectableUiLocale): string {
  return UI_TO_VOICE[uiLocale];
}
