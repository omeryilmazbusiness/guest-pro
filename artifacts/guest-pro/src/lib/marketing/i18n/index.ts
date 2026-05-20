import type { MarketingLocale, MarketingTranslations } from "./types";
import { ar } from "./ar";
import { en } from "./en";
import { ku } from "./ku";
import { tr } from "./tr";

export type { MarketingLocale, MarketingTranslations, MarketingWelcomePhrase } from "./types";

export const MARKETING_LOCALE_STORAGE_KEY = "guest-pro-marketing-locale";

export const MARKETING_LOCALES: {
  code: MarketingLocale;
  flagCode: string;
  labelKey: keyof MarketingTranslations["lang"];
}[] = [
  { code: "en", flagCode: "gb", labelKey: "en" },
  { code: "tr", flagCode: "tr", labelKey: "tr" },
  { code: "ar", flagCode: "sa", labelKey: "ar" },
  { code: "ku", flagCode: "iq", labelKey: "ku" },
];

const TRANSLATIONS: Record<MarketingLocale, MarketingTranslations> = {
  en,
  tr,
  ar,
  ku,
};

export function isMarketingLocale(value: string): value is MarketingLocale {
  return value === "en" || value === "tr" || value === "ar" || value === "ku";
}

export function marketingDir(locale: MarketingLocale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

export function getMarketingTranslations(locale: MarketingLocale): MarketingTranslations {
  return TRANSLATIONS[locale] ?? TRANSLATIONS.en;
}

export function readStoredMarketingLocale(): MarketingLocale {
  try {
    const raw = localStorage.getItem(MARKETING_LOCALE_STORAGE_KEY);
    if (raw && isMarketingLocale(raw)) return raw;
  } catch {
    /* ignore */
  }
  return "en";
}

export function persistMarketingLocale(locale: MarketingLocale): void {
  try {
    localStorage.setItem(MARKETING_LOCALE_STORAGE_KEY, locale);
  } catch {
    /* ignore */
  }
}
