import { Router } from "express";
import type { IRouter } from "express";
import { db, hotelBrandingTable, quickActionsTable, hotelsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/hotel/branding", async (req, res): Promise<void> => {
  const [branding] = await db.select().from(hotelBrandingTable).limit(1);
  if (!branding) {
    const [hotel] = await db.select().from(hotelsTable).limit(1);
    res.json({
      hotelId: hotel?.id ?? 1,
      appName: "Guest Pro",
      tagline: "Your personal hotel concierge",
      primaryColor: null,
      accentColor: null,
      logoUrl: null,
      welcomeText: "Welcome! How can we make your stay perfect?",
    });
    return;
  }
  res.json({
    hotelId: branding.hotelId,
    appName: branding.appName,
    tagline: branding.tagline,
    primaryColor: branding.primaryColor,
    accentColor: branding.accentColor,
    logoUrl: branding.logoUrl,
    welcomeText: branding.welcomeText,
  });
});

router.get("/hotel/quick-actions", async (_req, res): Promise<void> => {
  const actions = await db
    .select()
    .from(quickActionsTable)
    .orderBy(quickActionsTable.sortOrder);
  res.json(actions);
});

export default router;
