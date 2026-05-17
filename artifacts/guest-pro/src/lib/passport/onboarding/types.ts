/**
 * Passport scan onboarding — locales and flow steps.
 */

export type PassportOnboardingLocale = "tr" | "en" | "ar" | "ur";

export type PassportOnboardingStep = "language" | "intro" | "consent" | "scan";

export interface PassportLanguageCycleEntry {
  locale: PassportOnboardingLocale;
  label: string;
  dir: "ltr" | "rtl";
  /** "Welcome to {hotel}" — use formatWelcome(hotelName) */
  welcomeTemplate: string;
}

export interface OnboardingIntroItem {
  icon: "sparkles" | "scan" | "camera" | "qr" | "reception";
  title: string;
  body: string;
}

export interface PassportOnboardingStrings {
  welcomeTapHint: string;
  introTitle: string;
  introSubtitle: string;
  introItems: OnboardingIntroItem[];
  introContinue: string;
  consentTitle: string;
  consentIntro: string;
  consentBullets: string[];
  consentAccept: string;
  scanTitle: string;
  scanInstruction: string;
  showReception: string;
  waitMessage: string;
  scanAgain: string;
}
