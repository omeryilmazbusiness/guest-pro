import type { WelcomingLanguageEntry, WelcomingLocale } from "./types";

/**
 * The exhaustive list of selectable welcoming languages.
 * Exactly these 6 — no more, no less.
 */
export const WELCOMING_LANGUAGES: WelcomingLanguageEntry[] = [
  { uiLocale: "tr", voiceLocale: "tr-TR", label: "Türkçe",  greeting: "Merhaba",     dir: "ltr" },
  { uiLocale: "en", voiceLocale: "en-US", label: "English",  greeting: "Hello",       dir: "ltr" },
  { uiLocale: "ru", voiceLocale: "ru-RU", label: "Русский",  greeting: "Привет",      dir: "ltr" },
  { uiLocale: "hi", voiceLocale: "hi-IN", label: "हिन्दी",   greeting: "नमस्ते",      dir: "ltr" },
  { uiLocale: "ur", voiceLocale: "ur-PK", label: "اردو",     greeting: "آداب",        dir: "rtl" },
  { uiLocale: "ja", voiceLocale: "ja-JP", label: "日本語",   greeting: "こんにちは",  dir: "ltr" },
];

export const DEFAULT_WELCOMING_LOCALE: WelcomingLocale = "en";

/** Resolve a language entry by ui locale, falling back to English. */
export function getWelcomingLanguage(locale: string): WelcomingLanguageEntry {
  return (
    WELCOMING_LANGUAGES.find((l) => l.uiLocale === locale) ??
    WELCOMING_LANGUAGES.find((l) => l.uiLocale === DEFAULT_WELCOMING_LOCALE)!
  );
}

/** Map from welcoming uiLocale → BCP-47 voice locale. */
export function welcVoiceLocale(uiLocale: WelcomingLocale): string {
  return getWelcomingLanguage(uiLocale).voiceLocale;
}
