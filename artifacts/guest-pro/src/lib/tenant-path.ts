import { ROUTES } from "@/lib/app-routes";
import { getHotelSlugFromPath } from "@/lib/hotel-slug-from-path";

/** Bare tenant slug (first path segment only). */
export function sanitizeHotelSlug(slug: string): string {
  const cleaned = slug.trim().replace(/^\/+|\/+$/g, "").toLowerCase();
  return cleaned.split("/").filter(Boolean)[0] ?? "";
}

/**
 * App route segment only — e.g. "/login", "/manager" (not /{slug}/login).
 */
export function isAppRouteSegment(path: string): boolean {
  const p = path.split("?")[0] ?? path;
  return (
    p === ROUTES.login ||
    p === ROUTES.guest ||
    p === ROUTES.guestChat ||
    p === ROUTES.guestFlow ||
    p === ROUTES.guestAutoLogin ||
    p === ROUTES.guestPassportScan ||
    p === ROUTES.welcoming ||
    p === ROUTES.manager ||
    p === ROUTES.managerCreateGuest ||
    p === ROUTES.managerSettings ||
    p === ROUTES.restaurant
  );
}

/**
 * Strip duplicate tenant prefix so /{slug}/login is not doubled to /{slug}/{slug}/login.
 */
export function normalizeTenantSegment(slug: string, segment: string): string {
  const base = sanitizeHotelSlug(slug);
  if (!base) return segment.startsWith("/") ? segment : `/${segment}`;

  let path = segment.split("?")[0] ?? segment;
  const query = segment.includes("?") ? segment.slice(segment.indexOf("?")) : "";

  if (!path.startsWith("/")) path = `/${path}`;

  const prefix = `/${base}`;
  let guard = 0;
  while (guard++ < 8) {
    if (path === prefix) {
      path = "/";
      break;
    }
    if (path.startsWith(`${prefix}/`)) {
      path = path.slice(prefix.length);
      if (!path.startsWith("/")) path = `/${path}`;
      continue;
    }
    break;
  }

  return `${path}${query}`;
}

/**
 * Path for wouter `setLocation` inside a nested /:hotelSlug router.
 * Must be tenant-relative (/login), not /{slug}/login (base would double the slug).
 */
export function tenantNavigatePath(slug: string, path: string): string {
  const qIndex = path.indexOf("?");
  const basePath = qIndex >= 0 ? path.slice(0, qIndex) : path;
  const query = qIndex >= 0 ? path.slice(qIndex) : "";
  const raw = basePath.startsWith("/") ? basePath : `/${basePath}`;
  return `${normalizeTenantSegment(slug, raw)}${query}`;
}

/** Full browser URL for links from platform (outside tenant nest). */
export function absoluteAppHref(path: string): string {
  const base = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  const full = base ? `${base}${p}` : p;
  return `${window.location.origin}${full}`;
}

/** Build a hotel-scoped path: /{slug}/guest, /{slug}/login, … */
export function hotelPath(slug: string, segment: string): string {
  const base = sanitizeHotelSlug(slug);
  if (!base) {
    const normalized = segment.startsWith("/") ? segment : `/${segment}`;
    return normalized;
  }
  const normalized = normalizeTenantSegment(base, segment);
  const path = normalized.split("?")[0] ?? normalized;
  const query = normalized.includes("?") ? normalized.slice(normalized.indexOf("?")) : "";
  const segmentPath = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  return `/${base}${segmentPath}${query}`;
}

export function hotelLoginPath(slug: string): string {
  return hotelPath(slug, ROUTES.login);
}

export function hotelGuestPath(slug: string): string {
  return hotelPath(slug, ROUTES.guest);
}

export function hotelManagerPath(slug: string): string {
  return hotelPath(slug, ROUTES.manager);
}

/** Parse /{slug}/guest → { slug, rest } or null if not a tenant path. */
export function parseTenantPath(pathname: string): { slug: string; rest: string } | null {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return null;
  const [slug, ...rest] = parts;
  return { slug, rest: rest.length ? `/${rest.join("/")}` : "/" };
}

/** True when URL has duplicated slug: /{slug}/{slug}/login */
export function isDuplicateTenantSlugPath(pathname: string): boolean {
  const parsed = parseTenantPath(pathname);
  if (!parsed || parsed.rest === "/") return false;
  const restParts = parsed.rest.split("/").filter(Boolean);
  return restParts[0]?.toLowerCase() === parsed.slug.toLowerCase();
}

/** Canonical path for a duplicated tenant URL. */
export function fixDuplicateTenantSlugPath(pathname: string): string | null {
  const parsed = parseTenantPath(pathname);
  if (!parsed) return null;

  const slug = sanitizeHotelSlug(parsed.slug);
  let rest = parsed.rest;
  let changed = false;

  for (let i = 0; i < 8; i++) {
    const restParts = rest.split("/").filter(Boolean);
    if (restParts[0]?.toLowerCase() !== slug) break;
    changed = true;
    const inner = restParts.slice(1).join("/");
    rest = inner ? `/${inner}` : "/";
  }

  if (!changed) return null;
  const segment = rest === "/" ? ROUTES.login : rest;
  return hotelPath(slug, segment);
}

/** Wouter absolute navigate token (avoids nested `base` doubling). */
export function wouterAbsolutePath(fullPath: string): string {
  return fullPath.startsWith("~") ? fullPath : `~${fullPath}`;
}

/** After sign-out: tenant login when URL is /{slug}/…, else marketing home. */
export function getLogoutNavigateTarget(pathname = window.location.pathname): string {
  const slug = getHotelSlugFromPath(pathname);
  if (slug) return wouterAbsolutePath(hotelLoginPath(slug));
  return ROUTES.marketingHome;
}
