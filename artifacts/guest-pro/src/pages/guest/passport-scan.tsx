/**
 * PassportScanPage — /guest/passport-scan
 *
 * Onboarding: language → intro → consent → camera scan → QR.
 */

import { usePassportOnboarding } from "@/hooks/use-passport-onboarding";
import { getPassportOnboardingStrings } from "@/lib/passport/onboarding/content";
import { HOTEL_CONFIG } from "@/lib/welcoming/hotel-content";
import { WelcomeLanguageStep } from "@/components/guest/passport/onboarding/WelcomeLanguageStep";
import { OnboardingIntroStep } from "@/components/guest/passport/onboarding/OnboardingIntroStep";
import { ConsentStep } from "@/components/guest/passport/onboarding/ConsentStep";
import { PassportScanStage } from "@/components/guest/passport/onboarding/PassportScanStage";

export default function PassportScanPage() {
  const { step, locale, selectLanguage, goToConsent, acceptConsent } =
    usePassportOnboarding();

  const strings = getPassportOnboardingStrings(locale);

  if (step === "language") {
    return (
      <WelcomeLanguageStep
        hotelName={HOTEL_CONFIG.name}
        onSelect={selectLanguage}
      />
    );
  }

  if (step === "intro") {
    return (
      <OnboardingIntroStep
        locale={locale}
        strings={strings}
        onContinue={goToConsent}
      />
    );
  }

  if (step === "consent") {
    return (
      <ConsentStep
        locale={locale}
        strings={strings}
        onAccept={acceptConsent}
      />
    );
  }

  return <PassportScanStage locale={locale} strings={strings} />;
}
