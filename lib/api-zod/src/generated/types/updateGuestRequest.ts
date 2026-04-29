/**
 * UpdateGuestRequest — PATCH /api/guests/:id body
 */
export interface UpdateGuestRequest {
  firstName?: string;
  lastName?: string;
  roomNumber?: string;
  countryCode?: string;
  checkInDate?: string;
  checkOutDate?: string;
}
