/**
 * Centralized country-to-locale mapping.
 *
 * Maps ISO 3166-1 alpha-2 country codes to locale metadata.
 * voiceLocale  → BCP 47 tag used for TTS + STT + Gemini language routing
 * uiLocale     → short locale code used for frontend i18n dictionary lookup
 * dir          → text direction
 */

export interface LocaleInfo {
  uiLocale: string;
  voiceLocale: string;
  dir: "ltr" | "rtl";
}

export const COUNTRY_LOCALE_MAP: Record<string, LocaleInfo> = {
  // ── Turkish ──────────────────────────────────────────────────────────────
  TR: { uiLocale: "tr", voiceLocale: "tr-TR", dir: "ltr" },
  CY: { uiLocale: "tr", voiceLocale: "tr-TR", dir: "ltr" },

  // ── Arabic ────────────────────────────────────────────────────────────────
  SA: { uiLocale: "ar", voiceLocale: "ar-SA", dir: "rtl" },
  AE: { uiLocale: "ar", voiceLocale: "ar-AE", dir: "rtl" },
  EG: { uiLocale: "ar", voiceLocale: "ar-EG", dir: "rtl" },
  KW: { uiLocale: "ar", voiceLocale: "ar-KW", dir: "rtl" },
  QA: { uiLocale: "ar", voiceLocale: "ar-QA", dir: "rtl" },
  BH: { uiLocale: "ar", voiceLocale: "ar-BH", dir: "rtl" },
  OM: { uiLocale: "ar", voiceLocale: "ar-OM", dir: "rtl" },
  JO: { uiLocale: "ar", voiceLocale: "ar-JO", dir: "rtl" },
  IQ: { uiLocale: "ar", voiceLocale: "ar-IQ", dir: "rtl" },
  LB: { uiLocale: "ar", voiceLocale: "ar-LB", dir: "rtl" },
  MA: { uiLocale: "ar", voiceLocale: "ar-MA", dir: "rtl" },
  DZ: { uiLocale: "ar", voiceLocale: "ar-DZ", dir: "rtl" },
  TN: { uiLocale: "ar", voiceLocale: "ar-TN", dir: "rtl" },
  LY: { uiLocale: "ar", voiceLocale: "ar-LY", dir: "rtl" },
  YE: { uiLocale: "ar", voiceLocale: "ar-YE", dir: "rtl" },
  SY: { uiLocale: "ar", voiceLocale: "ar-SY", dir: "rtl" },
  SD: { uiLocale: "ar", voiceLocale: "ar-SD", dir: "rtl" },
  PS: { uiLocale: "ar", voiceLocale: "ar-PS", dir: "rtl" },

  // ── Russian ───────────────────────────────────────────────────────────────
  RU: { uiLocale: "ru", voiceLocale: "ru-RU", dir: "ltr" },
  BY: { uiLocale: "ru", voiceLocale: "ru-RU", dir: "ltr" },
  KZ: { uiLocale: "ru", voiceLocale: "ru-RU", dir: "ltr" },
  KG: { uiLocale: "ru", voiceLocale: "ru-RU", dir: "ltr" },
  TJ: { uiLocale: "ru", voiceLocale: "ru-RU", dir: "ltr" },
  UA: { uiLocale: "ru", voiceLocale: "ru-RU", dir: "ltr" },

  // ── English ───────────────────────────────────────────────────────────────
  GB: { uiLocale: "en", voiceLocale: "en-GB", dir: "ltr" },
  US: { uiLocale: "en", voiceLocale: "en-US", dir: "ltr" },
  CA: { uiLocale: "en", voiceLocale: "en-CA", dir: "ltr" },
  AU: { uiLocale: "en", voiceLocale: "en-AU", dir: "ltr" },
  NZ: { uiLocale: "en", voiceLocale: "en-NZ", dir: "ltr" },
  IE: { uiLocale: "en", voiceLocale: "en-IE", dir: "ltr" },
  ZA: { uiLocale: "en", voiceLocale: "en-ZA", dir: "ltr" },
  IN: { uiLocale: "en", voiceLocale: "en-IN", dir: "ltr" },
  SG: { uiLocale: "en", voiceLocale: "en-SG", dir: "ltr" },
  PH: { uiLocale: "en", voiceLocale: "en-PH", dir: "ltr" },
  PK: { uiLocale: "en", voiceLocale: "en-PK", dir: "ltr" },
  NG: { uiLocale: "en", voiceLocale: "en-NG", dir: "ltr" },

  // ── German ────────────────────────────────────────────────────────────────
  DE: { uiLocale: "de", voiceLocale: "de-DE", dir: "ltr" },
  AT: { uiLocale: "de", voiceLocale: "de-AT", dir: "ltr" },
  CH: { uiLocale: "de", voiceLocale: "de-CH", dir: "ltr" },

  // ── French ────────────────────────────────────────────────────────────────
  FR: { uiLocale: "fr", voiceLocale: "fr-FR", dir: "ltr" },
  BE: { uiLocale: "fr", voiceLocale: "fr-BE", dir: "ltr" },
  LU: { uiLocale: "fr", voiceLocale: "fr-LU", dir: "ltr" },
  MC: { uiLocale: "fr", voiceLocale: "fr-FR", dir: "ltr" },

  // ── Spanish ───────────────────────────────────────────────────────────────
  ES: { uiLocale: "es", voiceLocale: "es-ES", dir: "ltr" },
  MX: { uiLocale: "es", voiceLocale: "es-MX", dir: "ltr" },
  AR: { uiLocale: "es", voiceLocale: "es-AR", dir: "ltr" },
  CO: { uiLocale: "es", voiceLocale: "es-CO", dir: "ltr" },
  PE: { uiLocale: "es", voiceLocale: "es-PE", dir: "ltr" },
  CL: { uiLocale: "es", voiceLocale: "es-CL", dir: "ltr" },
  VE: { uiLocale: "es", voiceLocale: "es-VE", dir: "ltr" },
  EC: { uiLocale: "es", voiceLocale: "es-EC", dir: "ltr" },

  // ── Chinese ───────────────────────────────────────────────────────────────
  CN: { uiLocale: "zh", voiceLocale: "zh-CN", dir: "ltr" },
  TW: { uiLocale: "zh", voiceLocale: "zh-TW", dir: "ltr" },
  HK: { uiLocale: "zh", voiceLocale: "zh-HK", dir: "ltr" },
  MO: { uiLocale: "zh", voiceLocale: "zh-MO", dir: "ltr" },

  // ── Japanese ──────────────────────────────────────────────────────────────
  JP: { uiLocale: "ja", voiceLocale: "ja-JP", dir: "ltr" },

  // ── Korean ────────────────────────────────────────────────────────────────
  KR: { uiLocale: "ko", voiceLocale: "ko-KR", dir: "ltr" },

  // ── Italian ───────────────────────────────────────────────────────────────
  IT: { uiLocale: "it", voiceLocale: "it-IT", dir: "ltr" },

  // ── Portuguese ────────────────────────────────────────────────────────────
  PT: { uiLocale: "pt", voiceLocale: "pt-PT", dir: "ltr" },
  BR: { uiLocale: "pt", voiceLocale: "pt-BR", dir: "ltr" },

  // ── Dutch ─────────────────────────────────────────────────────────────────
  NL: { uiLocale: "nl", voiceLocale: "nl-NL", dir: "ltr" },

  // ── Polish ────────────────────────────────────────────────────────────────
  PL: { uiLocale: "pl", voiceLocale: "pl-PL", dir: "ltr" },

  // ── Greek ─────────────────────────────────────────────────────────────────
  GR: { uiLocale: "el", voiceLocale: "el-GR", dir: "ltr" },

  // ── Hebrew ────────────────────────────────────────────────────────────────
  IL: { uiLocale: "he", voiceLocale: "he-IL", dir: "rtl" },

  // ── Persian / Farsi ───────────────────────────────────────────────────────
  IR: { uiLocale: "fa", voiceLocale: "fa-IR", dir: "rtl" },
  AF: { uiLocale: "fa", voiceLocale: "fa-AF", dir: "rtl" },

  // ── Nordic ────────────────────────────────────────────────────────────────
  SE: { uiLocale: "sv", voiceLocale: "sv-SE", dir: "ltr" },
  NO: { uiLocale: "no", voiceLocale: "nb-NO", dir: "ltr" },
  DK: { uiLocale: "da", voiceLocale: "da-DK", dir: "ltr" },
  FI: { uiLocale: "fi", voiceLocale: "fi-FI", dir: "ltr" },

  // ── Central/Eastern Europe ────────────────────────────────────────────────
  CZ: { uiLocale: "cs", voiceLocale: "cs-CZ", dir: "ltr" },
  SK: { uiLocale: "sk", voiceLocale: "sk-SK", dir: "ltr" },
  RO: { uiLocale: "ro", voiceLocale: "ro-RO", dir: "ltr" },
  HU: { uiLocale: "hu", voiceLocale: "hu-HU", dir: "ltr" },
  HR: { uiLocale: "hr", voiceLocale: "hr-HR", dir: "ltr" },
  RS: { uiLocale: "sr", voiceLocale: "sr-RS", dir: "ltr" },
  BG: { uiLocale: "bg", voiceLocale: "bg-BG", dir: "ltr" },

  // ── South/Southeast Asia ──────────────────────────────────────────────────
  TH: { uiLocale: "th", voiceLocale: "th-TH", dir: "ltr" },
  ID: { uiLocale: "id", voiceLocale: "id-ID", dir: "ltr" },
  MY: { uiLocale: "ms", voiceLocale: "ms-MY", dir: "ltr" },
  VN: { uiLocale: "vi", voiceLocale: "vi-VN", dir: "ltr" },
};

const FALLBACK: LocaleInfo = { uiLocale: "en", voiceLocale: "en-US", dir: "ltr" };

/**
 * Derive locale info from an ISO 3166-1 alpha-2 country code.
 * Falls back gracefully to English if the country is unknown.
 */
export function deriveLocaleFromCountry(countryCode: string): LocaleInfo {
  return COUNTRY_LOCALE_MAP[countryCode?.toUpperCase()] ?? FALLBACK;
}
