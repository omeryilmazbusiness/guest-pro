/**
 * RenewGuestKeyResponse — response body of POST /api/guests/:id/renew-key
 */
import type { Guest } from "./guest";
export interface RenewGuestKeyResponse {
  guest: Pick<Guest, "id" | "firstName" | "lastName" | "roomNumber">;
  guestKey: string;
  qrLoginUrl: string;
  expiresAt: string;
}
