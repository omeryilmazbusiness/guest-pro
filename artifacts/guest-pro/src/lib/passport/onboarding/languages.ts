import type { PassportLanguageCycleEntry, PassportOnboardingLocale } from "./types";

/** Cycling order on the welcome screen */
export const PASSPORT_WELCOME_LANGUAGES: PassportLanguageCycleEntry[] = [
  {
    locale: "tr",
    label: "Türkçe",
    dir: "ltr",
    welcomeTemplate: "{hotel} oteline hoş geldiniz",
  },
  {
    locale: "en",
    label: "English",
    dir: "ltr",
    welcomeTemplate: "Welcome to {hotel}",
  },
  {
    locale: "ar",
    label: "العربية",
    dir: "rtl",
    welcomeTemplate: "مرحبًا بكم في {hotel}",
  },
  {
    locale: "ur",
    label: "اردو",
    dir: "rtl",
    welcomeTemplate: "{hotel} میں خوش آمدید",
  },
];

export const PASSPORT_ONBOARDING_CYCLE_MS = 3_200;

export function formatWelcome(template: string, hotelName: string): string {
  return template.replace(/\{hotel\}/g, hotelName);
}

export function getPassportLanguageEntry(
  locale: PassportOnboardingLocale,
): PassportLanguageCycleEntry {
  return (
    PASSPORT_WELCOME_LANGUAGES.find((l) => l.locale === locale) ??
    PASSPORT_WELCOME_LANGUAGES[1]
  );
}
