/**
 * Passport onboarding flow state — language → intro → consent → scan.
 */

import { useCallback, useState } from "react";
import type {
  PassportOnboardingLocale,
  PassportOnboardingStep,
} from "@/lib/passport/onboarding/types";
import { hasPassportConsent, setPassportConsent } from "@/lib/passport/onboarding/session";
import { useOptionalHotelTenant } from "@/hooks/use-hotel-tenant";
import { getWelcomingHotelSlug, persistWelcomingLocale } from "@/lib/welcoming/welcoming-locale";
import type { WelcomingLocale } from "@/lib/welcoming/types";

function toWelcomingLocale(locale: PassportOnboardingLocale): WelcomingLocale {
  if (locale === "ar") return "en";
  return locale;
}

function initialStep(hotelSlug: string): PassportOnboardingStep {
  return hasPassportConsent(hotelSlug) ? "scan" : "language";
}

export interface UsePassportOnboardingReturn {
  step: PassportOnboardingStep;
  locale: PassportOnboardingLocale;
  selectLanguage: (locale: PassportOnboardingLocale) => void;
  goToConsent: () => void;
  acceptConsent: () => void;
}

export function usePassportOnboarding(): UsePassportOnboardingReturn {
  const tenant = useOptionalHotelTenant();
  const hotelSlug = tenant?.slug ?? getWelcomingHotelSlug();

  const [step, setStep] = useState<PassportOnboardingStep>(() => initialStep(hotelSlug));
  const [locale, setLocale] = useState<PassportOnboardingLocale>("en");

  const selectLanguage = useCallback(
    (next: PassportOnboardingLocale) => {
      setLocale(next);
      persistWelcomingLocale(toWelcomingLocale(next), hotelSlug);
      setStep("intro");
    },
    [hotelSlug],
  );

  const goToConsent = useCallback(() => setStep("consent"), []);

  const acceptConsent = useCallback(() => {
    setPassportConsent(hotelSlug);
    setStep("scan");
  }, [hotelSlug]);

  return {
    step,
    locale,
    selectLanguage,
    goToConsent,
    acceptConsent,
  };
}
