import { Router } from "express";
import type { IRouter } from "express";
import { db, quickActionsTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { resolveHotelForRequest, getBrandingForHotel } from "../lib/hotel-resolver";

const router: IRouter = Router();

router.get("/hotel/branding", async (req, res): Promise<void> => {
  const hotel = await resolveHotelForRequest(req, {
    sessionHotelId: req.session?.hotelId,
    requireActive: true,
  });

  if (!hotel) {
    res.status(404).json({ error: "Hotel not found" });
    return;
  }

  const branding = await getBrandingForHotel(hotel);
  res.json(branding);
});

router.get("/hotel/quick-actions", async (req, res): Promise<void> => {
  const hotel = await resolveHotelForRequest(req, {
    sessionHotelId: req.session?.hotelId,
    requireActive: true,
  });

  if (!hotel) {
    res.status(404).json({ error: "Hotel not found" });
    return;
  }

  const actions = await db
    .select()
    .from(quickActionsTable)
    .where(eq(quickActionsTable.hotelId, hotel.id))
    .orderBy(asc(quickActionsTable.sortOrder));

  res.json(actions);
});

export default router;
