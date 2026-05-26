import { isReservedHotelSlug } from "@/lib/reserved-slugs";

/** First path segment when it is a hotel tenant slug (not platform, login, etc.). */
export function getHotelSlugFromPath(pathname = window.location.pathname): string | null {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return null;
  const slug = parts[0]!.toLowerCase();
  if (isReservedHotelSlug(slug)) return null;
  return slug;
}
