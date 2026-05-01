import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { getTranslations, type GuestTranslations } from "@/lib/i18n";
import { uiLocaleFromVoiceLocale, dirFromUiLocale } from "@/lib/locale";
import { getRawPersistedWelcomingLocale } from "@/lib/welcoming/welcoming-locale";
import { getWelcomingLanguage } from "@/lib/welcoming/languages";

export interface LocaleContext {
  voiceLocale: string;
  uiLocale: string;
  dir: "ltr" | "rtl";
  t: GuestTranslations;
}

const DEFAULT_VOICE_LOCALE = "en-US";

/**
 * Returns the active locale context for the current guest.
 *
 * Priority order (highest wins):
 *   1. Authenticated guest -> user.language from DB
 *      Set at guest creation from countryCode via deriveLocaleFromCountry().
 *      This is the ONLY authoritative source when a guest is logged in.
 *      Kiosk localStorage is completely ignored so that a Russian guest is
 *      never shown Turkish just because the lobby kiosk had Turkish selected.
 *   2. Unauthenticated (passport-scan, welcoming kiosk) -> welcoming localStorage
 *      Lets passport-scan use the language the operator selected on /welcoming.
 *   3. Hard fallback -> en-US
 */
export function useLocale(): LocaleContext {
  const { user } = useAuth();

  let voiceLocale: string;
  let uiLocale: string;

  if (user?.language) {
    // Priority 1: authenticated guest - DB language is authoritative
    voiceLocale = user.language;
    uiLocale    = uiLocaleFromVoiceLocale(voiceLocale);
  } else {
    // Priority 2: unauthenticated - kiosk welcoming locale
    const welcomingLocale = getRawPersistedWelcomingLocale();
    if (welcomingLocale) {
      // getWelcomingLanguage already falls back to English for unknown locales —
      // no unsafe cast needed. We look up the entry directly.
      const entry = getWelcomingLanguage(welcomingLocale);
      uiLocale    = entry.uiLocale;
      voiceLocale = entry.voiceLocale;
    } else {
      // Priority 3: hard fallback
      voiceLocale = DEFAULT_VOICE_LOCALE;
      uiLocale    = uiLocaleFromVoiceLocale(voiceLocale);
    }
  }

  const dir = dirFromUiLocale(uiLocale);
  const t   = getTranslations(uiLocale);

  useEffect(() => {
    document.documentElement.dir  = dir;
    document.documentElement.lang = uiLocale;
    return () => {
      document.documentElement.dir  = "ltr";
      document.documentElement.lang = "en";
    };
  }, [dir, uiLocale]);

  return { voiceLocale, uiLocale, dir, t };
}
