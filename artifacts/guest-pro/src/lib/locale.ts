/**
 * Client-side locale utilities.
 *
 * Mirrors the server-side mapping so the frontend can work with locale data
 * it receives from the API without needing to re-fetch.
 */

export interface LocaleInfo {
  uiLocale: string;
  voiceLocale: string;
  dir: "ltr" | "rtl";
}

export const COUNTRY_LOCALE_MAP: Record<string, LocaleInfo> = {
  TR: { uiLocale: "tr", voiceLocale: "tr-TR", dir: "ltr" },
  CY: { uiLocale: "tr", voiceLocale: "tr-TR", dir: "ltr" },
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
  RU: { uiLocale: "ru", voiceLocale: "ru-RU", dir: "ltr" },
  BY: { uiLocale: "ru", voiceLocale: "ru-RU", dir: "ltr" },
  KZ: { uiLocale: "ru", voiceLocale: "ru-RU", dir: "ltr" },
  KG: { uiLocale: "ru", voiceLocale: "ru-RU", dir: "ltr" },
  TJ: { uiLocale: "ru", voiceLocale: "ru-RU", dir: "ltr" },
  UA: { uiLocale: "ru", voiceLocale: "ru-RU", dir: "ltr" },
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
  DE: { uiLocale: "de", voiceLocale: "de-DE", dir: "ltr" },
  AT: { uiLocale: "de", voiceLocale: "de-AT", dir: "ltr" },
  CH: { uiLocale: "de", voiceLocale: "de-CH", dir: "ltr" },
  FR: { uiLocale: "fr", voiceLocale: "fr-FR", dir: "ltr" },
  BE: { uiLocale: "fr", voiceLocale: "fr-BE", dir: "ltr" },
  LU: { uiLocale: "fr", voiceLocale: "fr-LU", dir: "ltr" },
  MC: { uiLocale: "fr", voiceLocale: "fr-FR", dir: "ltr" },
  ES: { uiLocale: "es", voiceLocale: "es-ES", dir: "ltr" },
  MX: { uiLocale: "es", voiceLocale: "es-MX", dir: "ltr" },
  AR: { uiLocale: "es", voiceLocale: "es-AR", dir: "ltr" },
  CO: { uiLocale: "es", voiceLocale: "es-CO", dir: "ltr" },
  PE: { uiLocale: "es", voiceLocale: "es-PE", dir: "ltr" },
  CL: { uiLocale: "es", voiceLocale: "es-CL", dir: "ltr" },
  VE: { uiLocale: "es", voiceLocale: "es-VE", dir: "ltr" },
  CN: { uiLocale: "zh", voiceLocale: "zh-CN", dir: "ltr" },
  TW: { uiLocale: "zh", voiceLocale: "zh-TW", dir: "ltr" },
  HK: { uiLocale: "zh", voiceLocale: "zh-HK", dir: "ltr" },
  MO: { uiLocale: "zh", voiceLocale: "zh-MO", dir: "ltr" },
  JP: { uiLocale: "ja", voiceLocale: "ja-JP", dir: "ltr" },
  KR: { uiLocale: "ko", voiceLocale: "ko-KR", dir: "ltr" },
  IT: { uiLocale: "it", voiceLocale: "it-IT", dir: "ltr" },
  PT: { uiLocale: "pt", voiceLocale: "pt-PT", dir: "ltr" },
  BR: { uiLocale: "pt", voiceLocale: "pt-BR", dir: "ltr" },
  NL: { uiLocale: "nl", voiceLocale: "nl-NL", dir: "ltr" },
  PL: { uiLocale: "pl", voiceLocale: "pl-PL", dir: "ltr" },
  GR: { uiLocale: "el", voiceLocale: "el-GR", dir: "ltr" },
  IL: { uiLocale: "he", voiceLocale: "he-IL", dir: "rtl" },
  IR: { uiLocale: "fa", voiceLocale: "fa-IR", dir: "rtl" },
  AF: { uiLocale: "fa", voiceLocale: "fa-AF", dir: "rtl" },
  SE: { uiLocale: "sv", voiceLocale: "sv-SE", dir: "ltr" },
  NO: { uiLocale: "no", voiceLocale: "nb-NO", dir: "ltr" },
  DK: { uiLocale: "da", voiceLocale: "da-DK", dir: "ltr" },
  FI: { uiLocale: "fi", voiceLocale: "fi-FI", dir: "ltr" },
  CZ: { uiLocale: "cs", voiceLocale: "cs-CZ", dir: "ltr" },
  SK: { uiLocale: "sk", voiceLocale: "sk-SK", dir: "ltr" },
  RO: { uiLocale: "ro", voiceLocale: "ro-RO", dir: "ltr" },
  HU: { uiLocale: "hu", voiceLocale: "hu-HU", dir: "ltr" },
  HR: { uiLocale: "hr", voiceLocale: "hr-HR", dir: "ltr" },
  BG: { uiLocale: "bg", voiceLocale: "bg-BG", dir: "ltr" },
  TH: { uiLocale: "th", voiceLocale: "th-TH", dir: "ltr" },
  ID: { uiLocale: "id", voiceLocale: "id-ID", dir: "ltr" },
  MY: { uiLocale: "ms", voiceLocale: "ms-MY", dir: "ltr" },
  VN: { uiLocale: "vi", voiceLocale: "vi-VN", dir: "ltr" },
};

const FALLBACK: LocaleInfo = { uiLocale: "en", voiceLocale: "en-US", dir: "ltr" };

/** Derive locale info from an ISO 3166-1 alpha-2 country code. Falls back to English. */
export function deriveLocaleFromCountry(countryCode: string): LocaleInfo {
  return COUNTRY_LOCALE_MAP[countryCode?.toUpperCase()] ?? FALLBACK;
}

/** Derive locale from a stored voice locale tag (e.g. "tr-TR" → "tr"). Falls back to "en". */
export function uiLocaleFromVoiceLocale(voiceLocale: string): string {
  if (!voiceLocale) return "en";
  const base = voiceLocale.split("-")[0].toLowerCase();
  return base;
}

/** Compute the text-direction for a given ui locale. */
export function dirFromUiLocale(uiLocale: string): "ltr" | "rtl" {
  return ["ar", "he", "fa", "ur"].includes(uiLocale) ? "rtl" : "ltr";
}

/** Country list for the manager country selector, sorted with Turkey first. */
export const COUNTRIES: { code: string; name: string }[] = [
  { code: "TR", name: "Türkiye" },
  { code: "AB", name: "──────────────" }, // visual separator (filtered out on submit)
  { code: "AF", name: "Afghanistan" },
  { code: "AL", name: "Albania" },
  { code: "DZ", name: "Algeria" },
  { code: "AR", name: "Argentina" },
  { code: "AM", name: "Armenia" },
  { code: "AU", name: "Australia" },
  { code: "AT", name: "Austria" },
  { code: "AZ", name: "Azerbaijan" },
  { code: "BH", name: "Bahrain" },
  { code: "BD", name: "Bangladesh" },
  { code: "BY", name: "Belarus" },
  { code: "BE", name: "Belgium" },
  { code: "BG", name: "Bulgaria" },
  { code: "BR", name: "Brazil" },
  { code: "CA", name: "Canada" },
  { code: "CL", name: "Chile" },
  { code: "CN", name: "China" },
  { code: "CO", name: "Colombia" },
  { code: "HR", name: "Croatia" },
  { code: "CY", name: "Cyprus" },
  { code: "CZ", name: "Czech Republic" },
  { code: "DK", name: "Denmark" },
  { code: "EG", name: "Egypt" },
  { code: "EE", name: "Estonia" },
  { code: "FI", name: "Finland" },
  { code: "FR", name: "France" },
  { code: "GE", name: "Georgia" },
  { code: "DE", name: "Germany" },
  { code: "GR", name: "Greece" },
  { code: "HK", name: "Hong Kong" },
  { code: "HU", name: "Hungary" },
  { code: "IN", name: "India" },
  { code: "ID", name: "Indonesia" },
  { code: "IR", name: "Iran" },
  { code: "IQ", name: "Iraq" },
  { code: "IE", name: "Ireland" },
  { code: "IL", name: "Israel" },
  { code: "IT", name: "Italy" },
  { code: "JP", name: "Japan" },
  { code: "JO", name: "Jordan" },
  { code: "KZ", name: "Kazakhstan" },
  { code: "KW", name: "Kuwait" },
  { code: "KG", name: "Kyrgyzstan" },
  { code: "LV", name: "Latvia" },
  { code: "LB", name: "Lebanon" },
  { code: "LT", name: "Lithuania" },
  { code: "LU", name: "Luxembourg" },
  { code: "MY", name: "Malaysia" },
  { code: "MX", name: "Mexico" },
  { code: "MD", name: "Moldova" },
  { code: "MC", name: "Monaco" },
  { code: "MA", name: "Morocco" },
  { code: "NL", name: "Netherlands" },
  { code: "NZ", name: "New Zealand" },
  { code: "NG", name: "Nigeria" },
  { code: "NO", name: "Norway" },
  { code: "OM", name: "Oman" },
  { code: "PK", name: "Pakistan" },
  { code: "PS", name: "Palestine" },
  { code: "PE", name: "Peru" },
  { code: "PH", name: "Philippines" },
  { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" },
  { code: "QA", name: "Qatar" },
  { code: "RO", name: "Romania" },
  { code: "RU", name: "Russia" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "RS", name: "Serbia" },
  { code: "SG", name: "Singapore" },
  { code: "SK", name: "Slovakia" },
  { code: "SI", name: "Slovenia" },
  { code: "ZA", name: "South Africa" },
  { code: "KR", name: "South Korea" },
  { code: "ES", name: "Spain" },
  { code: "SD", name: "Sudan" },
  { code: "SE", name: "Sweden" },
  { code: "CH", name: "Switzerland" },
  { code: "SY", name: "Syria" },
  { code: "TW", name: "Taiwan" },
  { code: "TJ", name: "Tajikistan" },
  { code: "TH", name: "Thailand" },
  { code: "TN", name: "Tunisia" },
  { code: "UA", name: "Ukraine" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "UZ", name: "Uzbekistan" },
  { code: "VE", name: "Venezuela" },
  { code: "VN", name: "Vietnam" },
  { code: "YE", name: "Yemen" },
].filter(c => c.code !== "AB"); // remove separator

/** Get country flag emoji from ISO 3166-1 alpha-2 code. */
export function countryFlag(code: string): string {
  return code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(c.charCodeAt(0) - 65 + 0x1f1e6))
    .join("");
}

/** Get country name from code. */
export function countryName(code: string): string {
  return COUNTRIES.find((c) => c.code === code)?.name ?? code;
}
