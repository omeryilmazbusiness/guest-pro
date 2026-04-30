/**
 * Passport domain types.
 *
 * PassportData — canonical shape stored inside the guest-registration QR code.
 * Deliberately flat & minimal: only what reception needs to create a guest.
 *
 * ISO 3166-1 alpha-3 nationality codes are used because that is what MRZ
 * encodes; reception auto-fill maps them to alpha-2 country codes.
 */

export interface PassportData {
  /** Given names (space-separated) */
  firstName: string;
  /** Surname / family name */
  lastName: string;
  /** ISO 3166-1 alpha-3 e.g. "TUR", "GBR", "DEU" */
  nationality: string;
  /** YYYY-MM-DD */
  dateOfBirth: string;
  /** Machine-readable document number */
  passportNumber: string;
  /** YYYY-MM-DD */
  expiryDate: string;
  /** "M" | "F" | "X" | "" */
  gender: string;
}

/** QR payload version — bump when shape changes to detect stale scans. */
export const PASSPORT_QR_VERSION = 1 as const;

export interface PassportQrPayload {
  v: typeof PASSPORT_QR_VERSION;
  data: PassportData;
}

/** Serialise for QR encoding */
export function encodePassportQr(data: PassportData): string {
  const payload: PassportQrPayload = { v: PASSPORT_QR_VERSION, data };
  return JSON.stringify(payload);
}

/** Parse & validate a scanned QR string. Returns null if invalid. */
export function decodePassportQr(raw: string): PassportData | null {
  try {
    const payload = JSON.parse(raw) as PassportQrPayload;
    if (payload.v !== PASSPORT_QR_VERSION) return null;
    const d = payload.data;
    if (!d?.firstName || !d?.lastName || !d?.nationality) return null;
    return d;
  } catch {
    return null;
  }
}
