/**
 * Guest-facing i18n translation dictionaries.
 *
 * Only guest UI strings live here. Manager screens stay in English.
 *
 * Usage:
 *   const { t } = useLocale();
 *   <p>{t.voiceTitle}</p>
 *   <p>{t.welcome.replace("{name}", user.firstName)}</p>
 */

export type { GuestTranslations } from "./i18n/types";
export { translations, type SupportedLocale } from "./i18n/locales";

import { translations } from "./i18n/locales";
import type { GuestTranslations } from "./i18n/types";

/**
 * Get the translation dictionary for the given UI locale.
 * Gracefully falls back to English for unsupported locales.
 */
export function getTranslations(uiLocale: string): GuestTranslations {
  const base = uiLocale?.split("-")[0]?.toLowerCase() ?? "en";
  return translations[base as keyof typeof translations] ?? translations.en;
}

/** Inline template substitution: replace {key} placeholders in a string. */
export function tFmt(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replaceAll(`{${k}}`, v),
    template,
  );
}
