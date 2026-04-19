/**
 * Welcoming flow domain types.
 *
 * Self-contained — no dependency on the broader i18n system.
 * These 6 locales are the ONLY supported welcoming languages.
 */

export type WelcomingLocale = "tr" | "en" | "ru" | "hi" | "ur" | "ja";

export interface WelcomingLanguageEntry {
  uiLocale: WelcomingLocale;
  voiceLocale: string;
  /** Native-script language name shown in selector */
  label: string;
  /** "Hello" equivalent in this language */
  greeting: string;
  dir: "ltr" | "rtl";
}

export interface ServiceHours {
  open: string;
  close: string;
}

export interface NearbyPlace {
  name: string;
  type: "market" | "pharmacy" | "bazaar" | "restaurant" | "other";
  distance: string;
}

export interface MenuItem {
  name: string;
}

export interface MenuSection {
  category: string;
  items: MenuItem[];
}
