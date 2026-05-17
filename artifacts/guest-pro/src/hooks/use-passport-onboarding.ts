/**
 * Passport onboarding flow state — language → intro → consent → scan.
 */

import { useCallback, useState } from "react";
import type {
  PassportOnboardingLocale,
  PassportOnboardingStep,
} from "@/lib/passport/onboarding/types";
import { hasPassportConsent, setPassportConsent } from "@/lib/passport/onboarding/session";
import { persistWelcomingLocale } from "@/lib/welcoming/welcoming-locale";
import type { WelcomingLocale } from "@/lib/welcoming/types";

function toWelcomingLocale(locale: PassportOnboardingLocale): WelcomingLocale {
  if (locale === "ar") return "en";
  return locale;
}

function initialStep(): PassportOnboardingStep {
  return hasPassportConsent() ? "scan" : "language";
}

export interface UsePassportOnboardingReturn {
  step: PassportOnboardingStep;
  locale: PassportOnboardingLocale;
  selectLanguage: (locale: PassportOnboardingLocale) => void;
  goToConsent: () => void;
  acceptConsent: () => void;
}

export function usePassportOnboarding(): UsePassportOnboardingReturn {
  const [step, setStep] = useState<PassportOnboardingStep>(initialStep);
  const [locale, setLocale] = useState<PassportOnboardingLocale>("en");

  const selectLanguage = useCallback((next: PassportOnboardingLocale) => {
    setLocale(next);
    persistWelcomingLocale(toWelcomingLocale(next));
    setStep("intro");
  }, []);

  const goToConsent = useCallback(() => setStep("consent"), []);

  const acceptConsent = useCallback(() => {
    setPassportConsent();
    setStep("scan");
  }, []);

  return {
    step,
    locale,
    selectLanguage,
    goToConsent,
    acceptConsent,
  };
}
