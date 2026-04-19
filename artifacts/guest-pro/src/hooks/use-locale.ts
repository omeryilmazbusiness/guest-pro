import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { getTranslations, type GuestTranslations } from "@/lib/i18n";
import { uiLocaleFromVoiceLocale, dirFromUiLocale } from "@/lib/locale";
import { getRawPersistedWelcomingLocale } from "@/lib/welcoming/welcoming-locale";
import { welcVoiceLocale } from "@/lib/welcoming/languages";

export interface LocaleContext {
  /** BCP 47 voice locale, e.g. "tr-TR". Used for TTS + STT + Gemini language. */
  voiceLocale: string;
  /** Short UI locale code, e.g. "tr". Used for translation dictionary lookup. */
  uiLocale: string;
  /** Text direction derived from locale. */
  dir: "ltr" | "rtl";
  /** Ready-to-use translation object for the guest's locale. */
  t: GuestTranslations;
}

/** Fallback voice locale — Turkish (hotel default). */
const DEFAULT_VOICE_LOCALE = "tr-TR";

/**
 * Reads the guest's language from their profile and returns a fully-typed
 * locale context including the translation dictionary and text direction.
 *
 * If the guest has completed the welcoming flow and chosen a language,
 * that choice (stored in localStorage) overrides the profile default so
 * the preference is immediately reflected without an API round-trip.
 *
 * Also sets document.dir and document.lang for correct RTL rendering.
 */
export function useLocale(): LocaleContext {
  const { user } = useAuth();

  // Welcoming locale override: if the guest explicitly picked a language on
  // /welcoming, use that; otherwise fall back to the profile voice locale.
  const welcomingLocale = getRawPersistedWelcomingLocale();
  let voiceLocale: string;
  let uiLocale: string;
  if (welcomingLocale) {
    uiLocale   = welcomingLocale;
    voiceLocale = welcVoiceLocale(welcomingLocale as "tr" | "en" | "ru" | "hi" | "ur" | "ja");
  } else {
    voiceLocale = user?.language ?? DEFAULT_VOICE_LOCALE;
    uiLocale    = uiLocaleFromVoiceLocale(voiceLocale);
  }

  const dir = dirFromUiLocale(uiLocale);
  const t = getTranslations(uiLocale);

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = uiLocale;
    return () => {
      document.documentElement.dir = "ltr";
      document.documentElement.lang = "en";
    };
  }, [dir, uiLocale]);

  return { voiceLocale, uiLocale, dir, t };
}
