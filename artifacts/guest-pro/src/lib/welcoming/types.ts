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

export interface PlaceCoords {
  lat: number;
  lng: number;
}

export interface NearbyPlace {
  name: string;
  type: "market" | "pharmacy" | "bazaar" | "restaurant" | "other";
  distance: string;
  /** Short description shown in the place modal */
  description?: string;
  /** GPS coordinates used for Google Maps links and the map preview */
  coords?: PlaceCoords;
}

export interface MenuItem {
  name: string;
}

export interface MenuSection {
  category: string;
  /** Lucide icon name for the category */
  icon: "Coffee" | "UtensilsCrossed" | "IceCream2" | "Soup" | "ChefHat";
  items: MenuItem[];
}
