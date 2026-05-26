/**
 * PassportScanPage — /guest/passport-scan
 *
 * Onboarding: language → intro → consent → camera scan → QR.
 */

import { usePassportOnboarding } from "@/hooks/use-passport-onboarding";
import { getPassportOnboardingStrings } from "@/lib/passport/onboarding/content";
import { useHotelDisplay } from "@/hooks/use-hotel-display";
import { WelcomeLanguageStep } from "@/components/guest/passport/onboarding/WelcomeLanguageStep";
import { OnboardingIntroStep } from "@/components/guest/passport/onboarding/OnboardingIntroStep";
import { ConsentStep } from "@/components/guest/passport/onboarding/ConsentStep";
import { PassportScanStage } from "@/components/guest/passport/onboarding/PassportScanStage";

export default function PassportScanPage() {
  const { hotelName, appName } = useHotelDisplay();
  const displayName = hotelName || appName;
  const { step, locale, selectLanguage, goToConsent, acceptConsent } =
    usePassportOnboarding();

  const strings = getPassportOnboardingStrings(locale);

  if (step === "language") {
    return (
      <WelcomeLanguageStep
        hotelName={displayName}
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
