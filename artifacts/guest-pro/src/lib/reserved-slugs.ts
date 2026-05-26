/** Must match server RESERVED_HOTEL_SLUGS. */
export const RESERVED_HOTEL_SLUGS = new Set([
  "platform",
  "api",
  "home",
  "login",
  "manager",
  "guest",
  "restaurant",
  "welcoming",
]);

export function isReservedHotelSlug(slug: string): boolean {
  return RESERVED_HOTEL_SLUGS.has(slug.trim().toLowerCase());
}
