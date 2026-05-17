const CONSENT_KEY = "guestpro_passport_consent";

/** Consent granted this browser session — skip onboarding on scan retry */
export function hasPassportConsent(): boolean {
  try {
    return sessionStorage.getItem(CONSENT_KEY) === "1";
  } catch {
    return false;
  }
}

export function setPassportConsent(): void {
  try {
    sessionStorage.setItem(CONSENT_KEY, "1");
  } catch {
    // private mode — in-memory only via hook state
  }
}

export function clearPassportConsent(): void {
  try {
    sessionStorage.removeItem(CONSENT_KEY);
  } catch {
    // ignore
  }
}
