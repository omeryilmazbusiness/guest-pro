/**
 * Floor Wi-Fi routes — per-floor guest WiFi passwords (GM managed).
 *
 * GET  /hotel/floor-wifi       requireGeneralManager — list all floors
 * PUT  /hotel/floor-wifi       requireGeneralManager — replace all floor entries
 * GET  /guest/floor-wifi       requireGuest — WiFi for guest's room floor
 */

import { Router } from "express";
import type { IRouter } from "express";
import { z } from "zod";
import { db, hotelFloorWifiTable } from "@workspace/db";
import { and, asc, eq } from "drizzle-orm";
import { requireGeneralManager, requireGuest } from "../middlewares/requireAuth";
import { floorKeyFromRoomNumber } from "../lib/floor-from-room";

const router: IRouter = Router();

const floorEntrySchema = z.object({
  floorKey: z.string().min(1).max(20),
  floorLabel: z.string().min(1).max(80),
  wifiPassword: z.string().min(1).max(128),
  wifiSsid: z.string().max(64).optional().nullable(),
  sortOrder: z.number().int().optional(),
});

const replaceFloorsSchema = z.object({
  floors: z.array(floorEntrySchema).max(50),
});

router.get("/hotel/floor-wifi", requireGeneralManager, async (req, res): Promise<void> => {
  const hotelId = req.session!.hotelId;
  const rows = await db
    .select()
    .from(hotelFloorWifiTable)
    .where(eq(hotelFloorWifiTable.hotelId, hotelId))
    .orderBy(asc(hotelFloorWifiTable.sortOrder), asc(hotelFloorWifiTable.floorKey));
  res.json({ floors: rows });
});

router.put("/hotel/floor-wifi", requireGeneralManager, async (req, res): Promise<void> => {
  const hotelId = req.session!.hotelId;
  const parsed = replaceFloorsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid request" });
    return;
  }

  const normalized = parsed.data.floors.map((f, i) => ({
    hotelId,
    floorKey: f.floorKey.trim(),
    floorLabel: f.floorLabel.trim(),
    wifiPassword: f.wifiPassword,
    wifiSsid: f.wifiSsid?.trim() || null,
    sortOrder: f.sortOrder ?? i,
  }));

  const keys = new Set(normalized.map((f) => f.floorKey.toLowerCase()));
  if (keys.size !== normalized.length) {
    res.status(400).json({ error: "Duplicate floor keys are not allowed" });
    return;
  }

  await db.delete(hotelFloorWifiTable).where(eq(hotelFloorWifiTable.hotelId, hotelId));

  if (normalized.length > 0) {
    await db.insert(hotelFloorWifiTable).values(normalized);
  }

  const rows = await db
    .select()
    .from(hotelFloorWifiTable)
    .where(eq(hotelFloorWifiTable.hotelId, hotelId))
    .orderBy(asc(hotelFloorWifiTable.sortOrder), asc(hotelFloorWifiTable.floorKey));

  res.json({ floors: rows });
});

router.get("/guest/floor-wifi", requireGuest, async (req, res): Promise<void> => {
  const hotelId = req.session!.hotelId;
  const guestId = req.session!.guestId;

  const { guestsTable } = await import("@workspace/db");
  const [guest] = await db
    .select({ roomNumber: guestsTable.roomNumber })
    .from(guestsTable)
    .where(and(eq(guestsTable.id, guestId!), eq(guestsTable.hotelId, hotelId)));

  if (!guest?.roomNumber) {
    res.json({ configured: false, roomNumber: null, floorKey: null });
    return;
  }

  const floorKey = floorKeyFromRoomNumber(guest.roomNumber);
  if (!floorKey) {
    res.json({ configured: false, roomNumber: guest.roomNumber, floorKey: null });
    return;
  }

  const [row] = await db
    .select()
    .from(hotelFloorWifiTable)
    .where(
      and(
        eq(hotelFloorWifiTable.hotelId, hotelId),
        eq(hotelFloorWifiTable.floorKey, floorKey),
      ),
    );

  if (!row) {
    res.json({
      configured: false,
      roomNumber: guest.roomNumber,
      floorKey,
    });
    return;
  }

  res.json({
    configured: true,
    roomNumber: guest.roomNumber,
    floorKey: row.floorKey,
    floorLabel: row.floorLabel,
    wifiPassword: row.wifiPassword,
    wifiSsid: row.wifiSsid,
  });
});

export default router;
