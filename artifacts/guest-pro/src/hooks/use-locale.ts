import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { getTranslations, type GuestTranslations } from "@/lib/i18n";
import { uiLocaleFromVoiceLocale, dirFromUiLocale } from "@/lib/locale";

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
 * Also sets document.dir and document.lang for correct RTL rendering
 * (e.g. Arabic guests get RTL layout automatically).
 */
export function useLocale(): LocaleContext {
  const { user } = useAuth();

  const voiceLocale: string = user?.language ?? DEFAULT_VOICE_LOCALE;
  const uiLocale = uiLocaleFromVoiceLocale(voiceLocale);
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
