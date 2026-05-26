import { Router } from "express";
import type { IRouter } from "express";
import { db, hotelsTable, hotelBrandingTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { isReservedHotelSlug } from "../lib/reserved-slugs";
import { hotelLogoFilePath, resolveHotelLogoUrl } from "../lib/hotel-logo-storage";
import fs from "node:fs";

const router: IRouter = Router();

/** GET /public/hotels/:slug — tenant bootstrap for SPA (no auth). */
router.get("/public/hotels/:slug", async (req, res): Promise<void> => {
  const slug = String(req.params.slug ?? "").trim().toLowerCase();
  if (!slug || isReservedHotelSlug(slug)) {
    res.status(404).json({ error: "Hotel not found" });
    return;
  }

  const [hotel] = await db.select().from(hotelsTable).where(eq(hotelsTable.slug, slug));
  if (!hotel || !hotel.isActive) {
    res.status(404).json({ error: "Hotel not found" });
    return;
  }

  const [branding] = await db
    .select()
    .from(hotelBrandingTable)
    .where(eq(hotelBrandingTable.hotelId, hotel.id));

  const logoUrl = await resolveHotelLogoUrl(hotel.id, hotel.slug, branding?.logoUrl);

  res.json({
    id: hotel.id,
    name: hotel.name,
    slug: hotel.slug,
    isActive: hotel.isActive,
    branding: branding
      ? {
          appName: branding.appName,
          tagline: branding.tagline,
          primaryColor: branding.primaryColor,
          accentColor: branding.accentColor,
          logoUrl,
          welcomeText: branding.welcomeText,
        }
      : logoUrl
        ? {
            appName: hotel.name,
            tagline: null,
            primaryColor: null,
            accentColor: null,
            logoUrl,
            welcomeText: null,
          }
        : null,
  });
});

/** GET /public/hotels/:slug/logo — cached hotel logo asset */
router.get("/public/hotels/:slug/logo", async (req, res): Promise<void> => {
  const slug = String(req.params.slug ?? "").trim().toLowerCase();
  if (!slug || isReservedHotelSlug(slug)) {
    res.status(404).end();
    return;
  }

  const [hotel] = await db.select({ id: hotelsTable.id }).from(hotelsTable).where(eq(hotelsTable.slug, slug));
  if (!hotel) {
    res.status(404).end();
    return;
  }

  const [branding] = await db
    .select({ logoUrl: hotelBrandingTable.logoUrl })
    .from(hotelBrandingTable)
    .where(eq(hotelBrandingTable.hotelId, hotel.id));

  await resolveHotelLogoUrl(hotel.id, slug, branding?.logoUrl);

  const filePath = hotelLogoFilePath(hotel.id);
  if (!fs.existsSync(filePath)) {
    res.status(404).end();
    return;
  }

  res.setHeader("Content-Type", "image/jpeg");
  res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
  res.sendFile(filePath);
});

export default router;
