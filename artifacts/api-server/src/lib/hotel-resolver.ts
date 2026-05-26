/**
 * Resolves the active hotel tenant from request context (session, header, slug).
 * Single place for multi-tenant hotel lookup — avoids scattered .limit(1) on hotels.
 */

import type { Request } from "express";
import { db, hotelsTable, hotelBrandingTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { isReservedHotelSlug } from "./reserved-slugs";
import { env } from "../config/env";
import type { Hotel } from "@workspace/db";

export const HOTEL_SLUG_HEADER = "x-hotel-slug";

export function readHotelSlugFromRequest(req: Request): string | null {
  const rawHeader = req.headers[HOTEL_SLUG_HEADER];
  const fromHeader = (Array.isArray(rawHeader) ? rawHeader[0] : rawHeader)?.trim().toLowerCase();
  if (fromHeader && !isReservedHotelSlug(fromHeader)) return fromHeader;

  const querySlug =
    typeof req.query.hotelSlug === "string" ? req.query.hotelSlug.trim().toLowerCase() : null;
  if (querySlug && !isReservedHotelSlug(querySlug)) return querySlug;

  const body = req.body as { hotelSlug?: unknown } | undefined;
  if (typeof body?.hotelSlug === "string") {
    const fromBody = body.hotelSlug.trim().toLowerCase();
    if (fromBody && !isReservedHotelSlug(fromBody)) return fromBody;
  }

  return null;
}

export async function findHotelBySlug(
  slug: string,
  options?: { requireActive?: boolean },
): Promise<Hotel | null> {
  const normalized = slug.trim().toLowerCase();
  if (!normalized || isReservedHotelSlug(normalized)) return null;

  const [hotel] = await db.select().from(hotelsTable).where(eq(hotelsTable.slug, normalized));
  if (!hotel) return null;
  if (options?.requireActive && !hotel.isActive) return null;
  return hotel;
}

export async function findHotelById(
  hotelId: number,
  options?: { requireActive?: boolean },
): Promise<Hotel | null> {
  const [hotel] = await db.select().from(hotelsTable).where(eq(hotelsTable.id, hotelId));
  if (!hotel) return null;
  if (options?.requireActive && !hotel.isActive) return null;
  return hotel;
}

/** Default slug for legacy flat URLs — env override, else first active hotel. */
export async function getDefaultHotelSlug(): Promise<string | null> {
  if (env.DEFAULT_HOTEL_SLUG) {
    const hotel = await findHotelBySlug(env.DEFAULT_HOTEL_SLUG, { requireActive: true });
    if (hotel) return hotel.slug;
  }

  const [hotel] = await db
    .select({ slug: hotelsTable.slug })
    .from(hotelsTable)
    .where(eq(hotelsTable.isActive, true))
    .orderBy(asc(hotelsTable.id))
    .limit(1);

  return hotel?.slug ?? null;
}

export interface ResolveHotelOptions {
  /** Authenticated user's hotel — takes precedence when set. */
  sessionHotelId?: number;
  requireActive?: boolean;
  /** When true, never fall back to first hotel (strict tenant routes). */
  slugOnly?: boolean;
}

export async function resolveHotelForRequest(
  req: Request,
  options: ResolveHotelOptions = {},
): Promise<Hotel | null> {
  const { sessionHotelId, requireActive = false, slugOnly = false } = options;

  if (sessionHotelId != null && sessionHotelId > 0) {
    const fromSession = await findHotelById(sessionHotelId, { requireActive });
    if (fromSession) return fromSession;
  }

  const slug = readHotelSlugFromRequest(req);
  if (slug) {
    const fromSlug = await findHotelBySlug(slug, { requireActive });
    if (fromSlug) return fromSlug;
  }

  if (slugOnly) return null;

  const defaultSlug = await getDefaultHotelSlug();
  if (defaultSlug) {
    return findHotelBySlug(defaultSlug, { requireActive });
  }

  return null;
}

export interface HotelBrandingDto {
  hotelId: number;
  appName: string;
  tagline: string | null;
  primaryColor: string | null;
  accentColor: string | null;
  logoUrl: string | null;
  welcomeText: string | null;
}

export async function getBrandingForHotel(hotel: Hotel): Promise<HotelBrandingDto> {
  const [branding] = await db
    .select()
    .from(hotelBrandingTable)
    .where(eq(hotelBrandingTable.hotelId, hotel.id));

  const { resolveHotelLogoUrl } = await import("./hotel-logo-storage");
  const logoUrl = await resolveHotelLogoUrl(hotel.id, hotel.slug, branding?.logoUrl);

  return {
    hotelId: hotel.id,
    appName: branding?.appName ?? hotel.name,
    tagline: branding?.tagline ?? "Your personal hotel concierge",
    primaryColor: branding?.primaryColor ?? null,
    accentColor: branding?.accentColor ?? null,
    logoUrl,
    welcomeText: branding?.welcomeText ?? "Welcome! How can we make your stay perfect?",
  };
}

export async function getHotelSlugById(hotelId: number): Promise<string | null> {
  const [row] = await db
    .select({ slug: hotelsTable.slug })
    .from(hotelsTable)
    .where(eq(hotelsTable.id, hotelId));
  return row?.slug ?? null;
}
