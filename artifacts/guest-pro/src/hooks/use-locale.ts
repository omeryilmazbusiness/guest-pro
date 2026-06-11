import { useState, useEffect, useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { getTranslations, type GuestTranslations } from "@/lib/i18n";
import { deriveLocaleFromCountry, uiLocaleFromVoiceLocale } from "@/lib/locale";
import { useOptionalHotelTenant } from "@/hooks/use-hotel-tenant";
import { getRawPersistedWelcomingLocale, getWelcomingHotelSlug } from "@/lib/welcoming/welcoming-locale";
import { getWelcomingLanguage } from "@/lib/welcoming/languages";
import {
  type GuestUiLocale,
  GUEST_LOCALE_CHANGE_EVENT,
  guestDirFromUi,
  guestVoiceLocaleFromUi,
  isGuestUiLocale,
  normalizeGuestUiLocale,
  readGuestLocalePreference,
  writeGuestLocalePreference,
} from "@/lib/guest-locale";
import { updateGuestLanguage } from "@/lib/guest-language-api";
import { getGetMeQueryKey } from "@workspace/api-client-react";

export interface LocaleContext {
  voiceLocale: string;
  uiLocale: GuestUiLocale;
  dir: "ltr" | "rtl";
  t: GuestTranslations;
  setLocale: (locale: GuestUiLocale) => void;
}

const DEFAULT_VOICE_LOCALE = "en-US";

interface ResolvedLocale {
  voiceLocale: string;
  uiLocale: GuestUiLocale;
}

function resolveGuestLocale(
  userLanguage: string | null | undefined,
  countryCode: string | null | undefined,
  guestId: number | null | undefined,
  welcomingSlug: string,
): ResolvedLocale {
  const stored = readGuestLocalePreference(guestId);
  if (stored) {
    return { uiLocale: stored, voiceLocale: guestVoiceLocaleFromUi(stored) };
  }

  if (userLanguage) {
    const rawUi = uiLocaleFromVoiceLocale(userLanguage);
    let uiLocale = normalizeGuestUiLocale(rawUi);
    let voiceLocale = userLanguage;

    if (!isGuestUiLocale(rawUi) && countryCode) {
      const fromCountry = deriveLocaleFromCountry(countryCode);
      const countryUi = normalizeGuestUiLocale(fromCountry.uiLocale);
      if (isGuestUiLocale(fromCountry.uiLocale)) {
        uiLocale = countryUi;
        voiceLocale = fromCountry.voiceLocale;
      }
    }

    return { uiLocale, voiceLocale };
  }

  if (countryCode) {
    const fromCountry = deriveLocaleFromCountry(countryCode);
    const uiLocale = normalizeGuestUiLocale(fromCountry.uiLocale);
    if (isGuestUiLocale(fromCountry.uiLocale)) {
      return { uiLocale, voiceLocale: fromCountry.voiceLocale };
    }
  }

  const welcomingLocale = getRawPersistedWelcomingLocale(welcomingSlug);
  if (welcomingLocale) {
    const entry = getWelcomingLanguage(welcomingLocale);
    const uiLocale = normalizeGuestUiLocale(entry.uiLocale);
    return { uiLocale, voiceLocale: entry.voiceLocale };
  }

  return { uiLocale: "en", voiceLocale: DEFAULT_VOICE_LOCALE };
}

/**
 * Returns the active locale context for the current guest.
 *
 * Priority order (highest wins):
 *   1. Explicit guest preference (localStorage, keyed by guestId when available)
 *   2. Authenticated guest -> user.language from DB
 *   3. Unauthenticated kiosk -> welcoming localStorage
 *   4. Hard fallback -> en
 */
export function useLocale(): LocaleContext {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const tenant = useOptionalHotelTenant();
  const welcomingSlug = tenant?.slug ?? getWelcomingHotelSlug();

  const baseline = useMemo(
    () => resolveGuestLocale(user?.language, user?.countryCode, user?.guestId, welcomingSlug),
    [user?.language, user?.countryCode, user?.guestId, welcomingSlug],
  );

  const [active, setActive] = useState<ResolvedLocale>(baseline);

  useEffect(() => {
    setActive(baseline);
  }, [baseline]);

  useEffect(() => {
    const onCustom = (event: Event) => {
      const next = (event as CustomEvent<GuestUiLocale>).detail;
      setActive({
        uiLocale: next,
        voiceLocale: guestVoiceLocaleFromUi(next),
      });
    };
    const onStorage = (event: StorageEvent) => {
      if (!event.key?.startsWith("guestpro_guest_locale")) return;
      setActive(resolveGuestLocale(user?.language, user?.countryCode, user?.guestId, welcomingSlug));
    };

    window.addEventListener(GUEST_LOCALE_CHANGE_EVENT, onCustom);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(GUEST_LOCALE_CHANGE_EVENT, onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, [user?.language, user?.countryCode, user?.guestId, welcomingSlug]);

  const { uiLocale, voiceLocale } = active;
  const dir = guestDirFromUi(uiLocale);
  const t = getTranslations(uiLocale);

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = uiLocale;
  }, [dir, uiLocale]);

  const setLocale = useCallback(
    (next: GuestUiLocale) => {
      writeGuestLocalePreference(next, user?.guestId);
      window.dispatchEvent(new CustomEvent(GUEST_LOCALE_CHANGE_EVENT, { detail: next }));
      setActive({ uiLocale: next, voiceLocale: guestVoiceLocaleFromUi(next) });

      if (user?.role === "guest" && user.guestId) {
        const voice = guestVoiceLocaleFromUi(next);
        void updateGuestLanguage(next)
          .then(() => {
            queryClient.setQueryData(getGetMeQueryKey(), (current) =>
              current ? { ...current, language: voice } : current,
            );
          })
          .catch(() => {
            // UI already switched; preference is in localStorage for this device.
          });
      }
    },
    [queryClient, user?.guestId, user?.role],
  );

  return { voiceLocale, uiLocale, dir, t, setLocale };
}
