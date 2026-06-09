/**
 * Guest-facing language picker options (subset of full i18n support).
 */

export const GUEST_SELECTABLE_UI_LOCALES = ["en", "tr", "ar", "ru"] as const;
export type GuestSelectableUiLocale = (typeof GUEST_SELECTABLE_UI_LOCALES)[number];

const UI_TO_VOICE: Record<GuestSelectableUiLocale, string> = {
  en: "en-US",
  tr: "tr-TR",
  ar: "ar-SA",
  ru: "ru-RU",
};

export function isGuestSelectableUiLocale(value: string): value is GuestSelectableUiLocale {
  return (GUEST_SELECTABLE_UI_LOCALES as readonly string[]).includes(value);
}

export function voiceLocaleFromGuestUi(uiLocale: GuestSelectableUiLocale): string {
  return UI_TO_VOICE[uiLocale];
}
