import { getHotelSlugFromPath } from "@/lib/hotel-slug-from-path";

function consentKey(hotelSlug?: string): string {
  const slug = (hotelSlug ?? getHotelSlugFromPath() ?? "default").toLowerCase();
  return `guestpro_passport_consent_${slug}`;
}

/** Consent granted this browser session for this hotel — skip onboarding on scan retry */
export function hasPassportConsent(hotelSlug?: string): boolean {
  try {
    return sessionStorage.getItem(consentKey(hotelSlug)) === "1";
  } catch {
    return false;
  }
}

export function setPassportConsent(hotelSlug?: string): void {
  try {
    sessionStorage.setItem(consentKey(hotelSlug), "1");
  } catch {
    // private mode — in-memory only via hook state
  }
}

export function clearPassportConsent(hotelSlug?: string): void {
  try {
    sessionStorage.removeItem(consentKey(hotelSlug));
  } catch {
    // ignore
  }
}
