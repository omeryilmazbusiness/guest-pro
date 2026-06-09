/**
 * Nearby places + hotel map anchor routes.
 *
 * GET  /hotel/nearby-places        requireGeneralManager — list places
 * PUT  /hotel/nearby-places        requireGeneralManager — replace places
 * GET  /hotel/nearby-settings      requireGeneralManager — hotel map pin
 * PUT  /hotel/nearby-settings      requireGeneralManager — save hotel map pin
 * GET  /guest/nearby-places        requireGuest — places + resolved hotel center
 */

import { Router } from "express";
import type { IRouter } from "express";
import { z } from "zod";
import {
  db,
  hotelNearbyPlacesTable,
  hotelNearbySettingsTable,
  hotelTrackingConfigsTable,
} from "@workspace/db";
import { and, asc, eq } from "drizzle-orm";
import { requireGeneralManager, requireGuest } from "../middlewares/requireAuth";
import { resolveNearbyHotelCenter } from "../lib/nearby-hotel-center";
import {
  normalizePlaceCoords,
  isWithinHotelRadius,
  isValidCoordPair,
} from "../lib/nearby-coords";

const router: IRouter = Router();

const PLACE_TYPES = ["market", "pharmacy", "bazaar", "mall", "restaurant", "other"] as const;

const placeEntrySchema = z.object({
  name: z.string().min(1).max(120),
  address: z.string().max(240).optional().nullable(),
  type: z.enum(PLACE_TYPES),
  description: z.string().max(500).optional().nullable(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

const replacePlacesSchema = z.object({
  places: z.array(placeEntrySchema).max(100),
});

const hotelAnchorSchema = z.object({
  hotelLat: z.number().min(-90).max(90),
  hotelLng: z.number().min(-180).max(180),
  hotelLabel: z.string().max(120).optional().nullable(),
});

router.get("/hotel/nearby-settings", requireGeneralManager, async (req, res): Promise<void> => {
  const hotelId = req.session!.hotelId;
  const [row] = await db
    .select()
    .from(hotelNearbySettingsTable)
    .where(eq(hotelNearbySettingsTable.hotelId, hotelId));

  if (!row?.hotelLat || !row?.hotelLng) {
    res.json({ hotelAnchor: null });
    return;
  }

  res.json({
    hotelAnchor: {
      lat: row.hotelLat,
      lng: row.hotelLng,
      label: row.hotelLabel,
    },
  });
});

router.put("/hotel/nearby-settings", requireGeneralManager, async (req, res): Promise<void> => {
  const hotelId = req.session!.hotelId;
  const parsed = hotelAnchorSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid request" });
    return;
  }

  const { hotelLat, hotelLng, hotelLabel } = parsed.data;

  await db
    .insert(hotelNearbySettingsTable)
    .values({
      hotelId,
      hotelLat,
      hotelLng,
      hotelLabel: hotelLabel?.trim() || null,
    })
    .onConflictDoUpdate({
      target: hotelNearbySettingsTable.hotelId,
      set: {
        hotelLat,
        hotelLng,
        hotelLabel: hotelLabel?.trim() || null,
        updatedAt: new Date(),
      },
    });

  res.json({
    hotelAnchor: {
      lat: hotelLat,
      lng: hotelLng,
      label: hotelLabel?.trim() || null,
    },
  });
});

router.get("/hotel/nearby-places", requireGeneralManager, async (req, res): Promise<void> => {
  const hotelId = req.session!.hotelId;
  const rows = await db
    .select()
    .from(hotelNearbyPlacesTable)
    .where(eq(hotelNearbyPlacesTable.hotelId, hotelId))
    .orderBy(asc(hotelNearbyPlacesTable.sortOrder), asc(hotelNearbyPlacesTable.id));
  res.json({ places: rows });
});

router.put("/hotel/nearby-places", requireGeneralManager, async (req, res): Promise<void> => {
  const hotelId = req.session!.hotelId;
  const parsed = replacePlacesSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid request" });
    return;
  }

  const [hotelRow] = await db
    .select({
      hotelLat: hotelNearbySettingsTable.hotelLat,
      hotelLng: hotelNearbySettingsTable.hotelLng,
    })
    .from(hotelNearbySettingsTable)
    .where(eq(hotelNearbySettingsTable.hotelId, hotelId))
    .limit(1);

  const hotelAnchor =
    hotelRow?.hotelLat != null && hotelRow?.hotelLng != null
      ? { lat: hotelRow.hotelLat, lng: hotelRow.hotelLng }
      : null;

  const normalized: Array<{
    hotelId: number;
    name: string;
    address: string | null;
    type: (typeof PLACE_TYPES)[number];
    description: string | null;
    lat: number;
    lng: number;
    sortOrder: number;
    isActive: boolean;
  }> = [];

  for (const [i, p] of parsed.data.places.entries()) {
    if (!isValidCoordPair(p.lat, p.lng)) {
      res.status(400).json({ error: "Invalid latitude or longitude for a nearby place." });
      return;
    }

    const { coords } = normalizePlaceCoords(p.lat, p.lng, hotelAnchor);
    if (hotelAnchor && !isWithinHotelRadius(coords, hotelAnchor)) {
      res.status(400).json({
        error: "A nearby place is too far from the hotel map pin (>50 km). Check coordinates.",
      });
      return;
    }

    normalized.push({
      hotelId,
      name: p.name.trim(),
      address: p.address?.trim() || null,
      type: p.type,
      description: p.description?.trim() || null,
      lat: coords.lat,
      lng: coords.lng,
      sortOrder: p.sortOrder ?? i,
      isActive: p.isActive ?? true,
    });
  }

  await db.delete(hotelNearbyPlacesTable).where(eq(hotelNearbyPlacesTable.hotelId, hotelId));

  if (normalized.length > 0) {
    await db.insert(hotelNearbyPlacesTable).values(normalized);
  }

  const rows = await db
    .select()
    .from(hotelNearbyPlacesTable)
    .where(eq(hotelNearbyPlacesTable.hotelId, hotelId))
    .orderBy(asc(hotelNearbyPlacesTable.sortOrder), asc(hotelNearbyPlacesTable.id));

  res.json({ places: rows });
});

router.get("/guest/nearby-places", requireGuest, async (req, res): Promise<void> => {
  const hotelId = req.session!.hotelId;

  const [[gmSettings], [tracking], rows] = await Promise.all([
    db
      .select({
        hotelLat: hotelNearbySettingsTable.hotelLat,
        hotelLng: hotelNearbySettingsTable.hotelLng,
        hotelLabel: hotelNearbySettingsTable.hotelLabel,
      })
      .from(hotelNearbySettingsTable)
      .where(eq(hotelNearbySettingsTable.hotelId, hotelId))
      .limit(1),
    db
      .select({
        centerLat: hotelTrackingConfigsTable.centerLat,
        centerLng: hotelTrackingConfigsTable.centerLng,
      })
      .from(hotelTrackingConfigsTable)
      .where(eq(hotelTrackingConfigsTable.hotelId, hotelId))
      .limit(1),
    db
      .select({
        id: hotelNearbyPlacesTable.id,
        name: hotelNearbyPlacesTable.name,
        address: hotelNearbyPlacesTable.address,
        type: hotelNearbyPlacesTable.type,
        description: hotelNearbyPlacesTable.description,
        lat: hotelNearbyPlacesTable.lat,
        lng: hotelNearbyPlacesTable.lng,
        sortOrder: hotelNearbyPlacesTable.sortOrder,
      })
      .from(hotelNearbyPlacesTable)
      .where(
        and(
          eq(hotelNearbyPlacesTable.hotelId, hotelId),
          eq(hotelNearbyPlacesTable.isActive, true),
        ),
      )
      .orderBy(asc(hotelNearbyPlacesTable.sortOrder), asc(hotelNearbyPlacesTable.id)),
  ]);

  const gmAnchor =
    gmSettings?.hotelLat != null && gmSettings?.hotelLng != null
      ? {
          lat: gmSettings.hotelLat,
          lng: gmSettings.hotelLng,
          label: gmSettings.hotelLabel,
        }
      : null;

  const trackingCenter =
    tracking &&
    Number.isFinite(tracking.centerLat) &&
    Number.isFinite(tracking.centerLng)
      ? { lat: tracking.centerLat, lng: tracking.centerLng }
      : null;

  const resolvedCenter = resolveNearbyHotelCenter(
    gmAnchor,
    trackingCenter,
    rows.map((r) => ({ lat: r.lat, lng: r.lng })),
  );

  const hotelCenter = resolvedCenter
    ? {
        lat: resolvedCenter.lat,
        lng: resolvedCenter.lng,
        label: gmAnchor ? gmAnchor.label : null,
      }
    : null;

  res.json({ places: rows, hotelCenter });
});

export default router;
