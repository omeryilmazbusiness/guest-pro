/**
 * Tracking Routes — Active Tracking System REST API.
 *
 * Endpoints:
 *   GET  /tracking/config          requireStaff   — get config + allowed networks
 *   PUT  /tracking/config          requireManager — upsert config
 *   POST /tracking/networks        requireManager — add allowed network rule
 *   DELETE /tracking/networks/:id  requireManager — remove network rule
 *   POST /tracking/heartbeat       requireGuest   — guest presence heartbeat
 *   GET  /tracking/presences       requireStaff   — all presence snapshots for hotel
 *   GET  /tracking/presences/:id   requireStaff   — single guest snapshot (with debug)
 */

import { Router } from "express";
import type { IRouter } from "express";
import {
  db,
  hotelTrackingConfigsTable,
  hotelTrackingNetworksTable,
  guestPresenceSnapshotsTable,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireManager, requireStaff, requireGuest } from "../middlewares/requireAuth";
import {
  resolveTrackingStatus,
  extractSourceIp,
  isValidLatitude,
  isValidLongitude,
  isValidRadius,
  isValidIpOrCidr,
  haversineMeters,
  isOnAllowedNetwork,
  isInGeofence,
} from "../lib/tracking-policy";
/**
 * Safely extract a single string from an Express 5 route param.
 * In Express 5, params can be string | string[]; parseInt expects string.
 */
function paramStr(val: string | string[]): string {
  return Array.isArray(val) ? val[0] ?? "" : val;
}
const router: IRouter = Router();

// ---------------------------------------------------------------------------
// GET /tracking/config — fetch hotel tracking config + networks
// ---------------------------------------------------------------------------
router.get("/tracking/config", requireStaff, async (req, res): Promise<void> => {
  const hotelId = req.session!.hotelId;

  const [config] = await db
    .select()
    .from(hotelTrackingConfigsTable)
    .where(eq(hotelTrackingConfigsTable.hotelId, hotelId))
    .limit(1);

  const networks = await db
    .select()
    .from(hotelTrackingNetworksTable)
    .where(eq(hotelTrackingNetworksTable.hotelId, hotelId))
    .orderBy(hotelTrackingNetworksTable.createdAt);

  res.json({
    config: config ?? null,
    networks,
  });
});

// ---------------------------------------------------------------------------
// PUT /tracking/config — create or update hotel tracking config
// ---------------------------------------------------------------------------
router.put("/tracking/config", requireManager, async (req, res): Promise<void> => {
  const hotelId = req.session!.hotelId;
  const { isEnabled, centerLat, centerLng, radiusMeters, notes } = req.body;

  const lat = typeof centerLat === "string" ? parseFloat(centerLat) : centerLat;
  const lng = typeof centerLng === "string" ? parseFloat(centerLng) : centerLng;
  const radius =
    typeof radiusMeters === "string" ? parseInt(radiusMeters, 10) : radiusMeters;

  if (!isValidLatitude(lat)) {
    res.status(400).json({ error: "centerLat must be a number between -90 and 90" });
    return;
  }
  if (!isValidLongitude(lng)) {
    res.status(400).json({ error: "centerLng must be a number between -180 and 180" });
    return;
  }
  if (!isValidRadius(radius)) {
    res.status(400).json({ error: "radiusMeters must be between 10 and 50000" });
    return;
  }

  const [existing] = await db
    .select({ id: hotelTrackingConfigsTable.id })
    .from(hotelTrackingConfigsTable)
    .where(eq(hotelTrackingConfigsTable.hotelId, hotelId))
    .limit(1);

  const payload = {
    hotelId,
    isEnabled: isEnabled === true || isEnabled === "true",
    centerLat: lat,
    centerLng: lng,
    radiusMeters: radius,
    notes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
  };

  let savedConfig;
  if (existing) {
    [savedConfig] = await db
      .update(hotelTrackingConfigsTable)
      .set({ ...payload, updatedAt: new Date() })
      .where(eq(hotelTrackingConfigsTable.id, existing.id))
      .returning();
  } else {
    [savedConfig] = await db
      .insert(hotelTrackingConfigsTable)
      .values(payload)
      .returning();
  }

  res.json(savedConfig);
});

// ---------------------------------------------------------------------------
// POST /tracking/networks — add an allowed network rule
// ---------------------------------------------------------------------------
router.post("/tracking/networks", requireManager, async (req, res): Promise<void> => {
  const hotelId = req.session!.hotelId;
  const { ipOrCidr, label } = req.body;

  if (typeof ipOrCidr !== "string" || !ipOrCidr.trim()) {
    res.status(400).json({ error: "ipOrCidr is required" });
    return;
  }

  const trimmed = ipOrCidr.trim();
  if (!isValidIpOrCidr(trimmed)) {
    res.status(400).json({
      error: "Invalid IP address or CIDR range. Examples: 203.0.113.5 or 203.0.113.0/24",
    });
    return;
  }

  const [network] = await db
    .insert(hotelTrackingNetworksTable)
    .values({
      hotelId,
      ipOrCidr: trimmed,
      label: typeof label === "string" && label.trim() ? label.trim() : null,
    })
    .returning();

  res.status(201).json(network);
});

// ---------------------------------------------------------------------------
// DELETE /tracking/networks/:id — remove a network rule
// ---------------------------------------------------------------------------
router.delete("/tracking/networks/:id", requireManager, async (req, res): Promise<void> => {
  const hotelId = req.session!.hotelId;
  const id = parseInt(paramStr(req.params.id), 10);

  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid network rule ID" });
    return;
  }

  const deleted = await db
    .delete(hotelTrackingNetworksTable)
    .where(
      and(
        eq(hotelTrackingNetworksTable.id, id),
        eq(hotelTrackingNetworksTable.hotelId, hotelId)
      )
    )
    .returning({ id: hotelTrackingNetworksTable.id });

  if (!deleted.length) {
    res.status(404).json({ error: "Network rule not found" });
    return;
  }

  res.status(204).end();
});

// ---------------------------------------------------------------------------
// POST /tracking/heartbeat — guest presence heartbeat
// ---------------------------------------------------------------------------
router.post("/tracking/heartbeat", requireGuest, async (req, res): Promise<void> => {
  const { guestId, hotelId } = req.session!;

  if (!guestId) {
    res.status(400).json({ error: "Guest session missing guestId" });
    return;
  }

  const { lat, lng, accuracy } = req.body;

  const parsedLat = lat != null ? parseFloat(String(lat)) : null;
  const parsedLng = lng != null ? parseFloat(String(lng)) : null;
  const parsedAcc = accuracy != null ? parseFloat(String(accuracy)) : null;

  const validLat = parsedLat !== null && isFinite(parsedLat) ? parsedLat : null;
  const validLng = parsedLng !== null && isFinite(parsedLng) ? parsedLng : null;
  const validAcc = parsedAcc !== null && isFinite(parsedAcc) ? parsedAcc : null;

  // ── Source IP resolution (multi-layer for diagnostics) ────────────────────
  const sourceIp = extractSourceIp(req);
  const rawXff   = req.headers["x-forwarded-for"] ?? null;
  const reqIp    = req.ip ?? null;
  const reqIps   = req.ips ?? [];
  const socketIp = req.socket?.remoteAddress ?? null;

  // ── Load hotel tracking config + networks ─────────────────────────────────
  const [config] = await db
    .select()
    .from(hotelTrackingConfigsTable)
    .where(eq(hotelTrackingConfigsTable.hotelId, hotelId))
    .limit(1);

  const networks = config
    ? await db
        .select({ ipOrCidr: hotelTrackingNetworksTable.ipOrCidr })
        .from(hotelTrackingNetworksTable)
        .where(eq(hotelTrackingNetworksTable.hotelId, hotelId))
    : [];

  // ── Resolve tracking status ───────────────────────────────────────────────
  const effectiveConfig = config ?? {
    isEnabled: false,
    centerLat: 0,
    centerLng: 0,
    radiusMeters: 100,
  };

  const status = resolveTrackingStatus({
    config: effectiveConfig,
    networks,
    lat: validLat,
    lng: validLng,
    sourceIp,
  });

  // ── Compute diagnostic values ─────────────────────────────────────────────
  let distanceMeters: number | null = null;
  let geofenceResult: boolean | null = null;
  let networkResult: boolean | null  = null;
  let unknownReason: string | null   = null;

  if (!effectiveConfig.isEnabled) {
    unknownReason = "Tracking is disabled in hotel configuration";
  } else if (validLat == null || validLng == null) {
    unknownReason = "No valid coordinates received from browser";
  } else {
    distanceMeters = haversineMeters(
      validLat,
      validLng,
      effectiveConfig.centerLat,
      effectiveConfig.centerLng
    );
    geofenceResult = isInGeofence(validLat, validLng, effectiveConfig);
    networkResult  = isOnAllowedNetwork(sourceIp, networks);
  }

  // ── Upsert presence snapshot ──────────────────────────────────────────────
  const [existing] = await db
    .select({ id: guestPresenceSnapshotsTable.id })
    .from(guestPresenceSnapshotsTable)
    .where(eq(guestPresenceSnapshotsTable.guestId, guestId))
    .limit(1);

  const snapshotPayload = {
    guestId,
    hotelId,
    status,
    lastLat: validLat,
    lastLng: validLng,
    lastAccuracyMeters: validAcc,
    lastSourceIp: sourceIp,
    lastSeenAt: new Date(),
    updatedAt: new Date(),
  };

  if (existing) {
    await db
      .update(guestPresenceSnapshotsTable)
      .set(snapshotPayload)
      .where(eq(guestPresenceSnapshotsTable.id, existing.id));
  } else {
    await db.insert(guestPresenceSnapshotsTable).values(snapshotPayload);
  }

  // ── Response ─────────────────────────────────────────────────────────────
  // Debug block is only included in non-production environments.
  // Never expose raw IP / config details to production clients.
  const isProduction = process.env.NODE_ENV === "production";

  res.json({
    status,
    sourceIp,
    ...(isProduction
      ? {}
      : {
          debug: {
            guestId,
            hotelId,
            browserLat: validLat,
            browserLng: validLng,
            browserAccuracyMeters: validAcc,
            resolvedSourceIp: sourceIp,
            reqIp,
            reqIps,
            xForwardedFor: rawXff,
            socketRemoteAddress: socketIp,
            hotelCenterLat: effectiveConfig.centerLat,
            hotelCenterLng: effectiveConfig.centerLng,
            hotelRadiusMeters: effectiveConfig.radiusMeters,
            trackingEnabled: effectiveConfig.isEnabled,
            allowedNetworks: networks.map((n) => n.ipOrCidr),
            distanceMeters: distanceMeters != null ? Math.round(distanceMeters) : null,
            isInGeofence: geofenceResult,
            isOnAllowedNetwork: networkResult,
            unknownReason,
            resolvedStatus: status,
          },
        }),
  });
});

// ---------------------------------------------------------------------------
// GET /tracking/my-ip — returns the server-seen IP for the current request
// Used by the settings page so managers can quickly add their IP to the
// allowed networks list without needing to look it up externally.
// ---------------------------------------------------------------------------
router.get("/tracking/my-ip", requireStaff, (req, res): void => {
  const sourceIp = extractSourceIp(req);
  res.json({
    sourceIp,
    reqIp: req.ip ?? null,
    reqIps: req.ips ?? [],
    xForwardedFor: req.headers["x-forwarded-for"] ?? null,
    socketRemoteAddress: req.socket?.remoteAddress ?? null,
  });
});

// ---------------------------------------------------------------------------
// GET /tracking/presences — all guest presence snapshots for this hotel
// ---------------------------------------------------------------------------
router.get("/tracking/presences", requireStaff, async (req, res): Promise<void> => {
  const hotelId = req.session!.hotelId;

  const snapshots = await db
    .select({
      guestId: guestPresenceSnapshotsTable.guestId,
      status: guestPresenceSnapshotsTable.status,
      lastLat: guestPresenceSnapshotsTable.lastLat,
      lastLng: guestPresenceSnapshotsTable.lastLng,
      lastAccuracyMeters: guestPresenceSnapshotsTable.lastAccuracyMeters,
      lastSourceIp: guestPresenceSnapshotsTable.lastSourceIp,
      lastSeenAt: guestPresenceSnapshotsTable.lastSeenAt,
    })
    .from(guestPresenceSnapshotsTable)
    .where(eq(guestPresenceSnapshotsTable.hotelId, hotelId));

  res.json(snapshots);
});

export default router;
