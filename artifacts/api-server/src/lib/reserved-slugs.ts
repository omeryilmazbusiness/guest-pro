/**
 * URL segments reserved for global routes — cannot be used as hotel slugs.
 */
export const RESERVED_HOTEL_SLUGS = new Set([
  "platform",
  "api",
  "home",
  "colega",
  "login",
  "manager",
  "guest",
  "restaurant",
  "welcoming",
  "assets",
  "favicon.ico",
  "sw.js",
  "manifest.webmanifest",
]);

export function isReservedHotelSlug(slug: string): boolean {
  const normalized = slug.trim().toLowerCase();
  return RESERVED_HOTEL_SLUGS.has(normalized);
}

export function slugifyHotelName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
