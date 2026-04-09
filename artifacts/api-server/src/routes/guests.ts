import { Router } from "express";
import type { IRouter, Request } from "express";
import { db, guestsTable, guestKeysTable, auditLogsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireStaff, requireManager } from "../middlewares/requireAuth";
import { generateGuestKey } from "../lib/auth";
import { deriveLocaleFromCountry } from "../lib/locale";
import { issueQrToken, revokeAllGuestQrTokens } from "../lib/qr-token";
import { env } from "../config/env";

const router: IRouter = Router();

function getAppBase(req: Request): string {
  if (env.APP_BASE_URL) return env.APP_BASE_URL;
  const proto = (req.headers["x-forwarded-proto"] as string) ?? req.protocol;
  const host = (req.headers["x-forwarded-host"] as string) ?? req.headers.host;
  return `${proto}://${host}`;
}

// ---------------------------------------------------------------------------
// GET /guests — list all guests for this hotel
// ---------------------------------------------------------------------------
router.get("/guests", requireStaff, async (req, res): Promise<void> => {
  const hotelId = req.session!.hotelId;
  const guests = await db
    .select({
      id: guestsTable.id,
      firstName: guestsTable.firstName,
      lastName: guestsTable.lastName,
      roomNumber: guestsTable.roomNumber,
      countryCode: guestsTable.countryCode,
      language: guestsTable.language,
      hotelId: guestsTable.hotelId,
      isActive: guestsTable.isActive,
      createdAt: guestsTable.createdAt,
      guestKey: guestKeysTable.keyDisplay,
    })
    .from(guestsTable)
    .leftJoin(guestKeysTable, and(eq(guestKeysTable.guestId, guestsTable.id), eq(guestKeysTable.isActive, true)))
    .where(and(eq(guestsTable.hotelId, hotelId), eq(guestsTable.isActive, true)))
    .orderBy(desc(guestsTable.createdAt));

  res.json(guests);
});

// ---------------------------------------------------------------------------
// POST /guests — create a new guest
// ---------------------------------------------------------------------------
router.post("/guests", requireStaff, async (req, res): Promise<void> => {
  const { firstName, lastName, roomNumber, countryCode } = req.body;
  const hotelId = req.session!.hotelId;
  const actorId = req.session!.userId;

  if (!firstName || !lastName || !roomNumber) {
    res.status(400).json({ error: "firstName, lastName, and roomNumber are required" });
    return;
  }

  if (!countryCode || typeof countryCode !== "string" || countryCode.trim().length < 2) {
    res.status(400).json({ error: "countryCode is required (ISO 3166-1 alpha-2)" });
    return;
  }

  const normalizedCountry = countryCode.trim().toUpperCase();
  const { voiceLocale } = deriveLocaleFromCountry(normalizedCountry);

  const [guest] = await db
    .insert(guestsTable)
    .values({ firstName, lastName, roomNumber, hotelId, countryCode: normalizedCountry, language: voiceLocale })
    .returning();

  const { key, keyHash } = generateGuestKey();
  const [guestKey] = await db
    .insert(guestKeysTable)
    .values({ guestId: guest.id, hotelId, keyHash, keyDisplay: key })
    .returning();

  await db.insert(auditLogsTable).values({
    hotelId,
    actorId,
    actorType: "manager",
    action: "create_guest",
    targetType: "guest",
    targetId: guest.id,
    metadata: { roomNumber, firstName, lastName, countryCode: normalizedCountry, language: voiceLocale },
  });

  const { rawToken, expiresAt } = await issueQrToken(guest.id, hotelId, actorId);
  const appBase = getAppBase(req);
  const qrLoginUrl = `${appBase}/guest/auto-login?token=${rawToken}`;

  res.status(201).json({
    guest: {
      id: guest.id,
      firstName: guest.firstName,
      lastName: guest.lastName,
      roomNumber: guest.roomNumber,
      countryCode: guest.countryCode,
      language: guest.language,
      hotelId: guest.hotelId,
      isActive: guest.isActive,
      createdAt: guest.createdAt,
      guestKey: guestKey.keyDisplay,
    },
    guestKey: key,
    qrLoginUrl,
    qrTokenExpiresAt: expiresAt.toISOString(),
  });
});

// ---------------------------------------------------------------------------
// GET /guests/:id — get one guest
// ---------------------------------------------------------------------------
router.get("/guests/:id", requireStaff, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid guest ID" });
    return;
  }

  const hotelId = req.session!.hotelId;
  const [guest] = await db
    .select({
      id: guestsTable.id,
      firstName: guestsTable.firstName,
      lastName: guestsTable.lastName,
      roomNumber: guestsTable.roomNumber,
      countryCode: guestsTable.countryCode,
      language: guestsTable.language,
      hotelId: guestsTable.hotelId,
      isActive: guestsTable.isActive,
      createdAt: guestsTable.createdAt,
      guestKey: guestKeysTable.keyDisplay,
    })
    .from(guestsTable)
    .leftJoin(guestKeysTable, and(eq(guestKeysTable.guestId, guestsTable.id), eq(guestKeysTable.isActive, true)))
    .where(and(eq(guestsTable.id, id), eq(guestsTable.hotelId, hotelId)));

  if (!guest) {
    res.status(404).json({ error: "Guest not found" });
    return;
  }

  res.json(guest);
});

// ---------------------------------------------------------------------------
// PATCH /guests/:id — update guest details (name, room, country)
// ---------------------------------------------------------------------------
router.patch("/guests/:id", requireStaff, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid guest ID" });
    return;
  }

  const hotelId = req.session!.hotelId;
  const actorId = req.session!.userId;
  const { firstName, lastName, roomNumber, countryCode } = req.body;

  const [existing] = await db
    .select()
    .from(guestsTable)
    .where(and(eq(guestsTable.id, id), eq(guestsTable.hotelId, hotelId), eq(guestsTable.isActive, true)));

  if (!existing) {
    res.status(404).json({ error: "Guest not found" });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (firstName && typeof firstName === "string") updates.firstName = firstName.trim();
  if (lastName && typeof lastName === "string") updates.lastName = lastName.trim();
  if (roomNumber && typeof roomNumber === "string") updates.roomNumber = roomNumber.trim();
  if (countryCode && typeof countryCode === "string") {
    const normalized = countryCode.trim().toUpperCase();
    updates.countryCode = normalized;
    updates.language = deriveLocaleFromCountry(normalized).voiceLocale;
  }

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "No valid fields to update" });
    return;
  }

  const [updated] = await db
    .update(guestsTable)
    .set(updates)
    .where(and(eq(guestsTable.id, id), eq(guestsTable.hotelId, hotelId)))
    .returning();

  await db.insert(auditLogsTable).values({
    hotelId,
    actorId,
    actorType: "manager",
    action: "update_guest",
    targetType: "guest",
    targetId: id,
    metadata: {
      before: { firstName: existing.firstName, lastName: existing.lastName, roomNumber: existing.roomNumber },
      after: updates,
    },
  });

  res.json(updated);
});

// ---------------------------------------------------------------------------
// DELETE /guests/:id — soft-delete (manager only)
// ---------------------------------------------------------------------------
router.delete("/guests/:id", requireManager, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid guest ID" });
    return;
  }

  const hotelId = req.session!.hotelId;
  const actorId = req.session!.userId;

  const [existing] = await db
    .select()
    .from(guestsTable)
    .where(and(eq(guestsTable.id, id), eq(guestsTable.hotelId, hotelId)));

  if (!existing) {
    res.status(404).json({ error: "Guest not found" });
    return;
  }

  await db
    .update(guestsTable)
    .set({ isActive: false })
    .where(and(eq(guestsTable.id, id), eq(guestsTable.hotelId, hotelId)));

  await db
    .update(guestKeysTable)
    .set({ isActive: false })
    .where(eq(guestKeysTable.guestId, id));

  await revokeAllGuestQrTokens(id);

  await db.insert(auditLogsTable).values({
    hotelId,
    actorId,
    actorType: "manager",
    action: "delete_guest",
    targetType: "guest",
    targetId: id,
    metadata: { firstName: existing.firstName, lastName: existing.lastName, roomNumber: existing.roomNumber },
  });

  res.json({ success: true });
});

// ---------------------------------------------------------------------------
// POST /guests/:id/renew-key — deactivate old key, issue new key + QR
// ---------------------------------------------------------------------------
router.post("/guests/:id/renew-key", requireStaff, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid guest ID" });
    return;
  }

  const hotelId = req.session!.hotelId;
  const actorId = req.session!.userId;

  const [existing] = await db
    .select()
    .from(guestsTable)
    .where(and(eq(guestsTable.id, id), eq(guestsTable.hotelId, hotelId), eq(guestsTable.isActive, true)));

  if (!existing) {
    res.status(404).json({ error: "Guest not found" });
    return;
  }

  await db
    .update(guestKeysTable)
    .set({ isActive: false })
    .where(and(eq(guestKeysTable.guestId, id), eq(guestKeysTable.isActive, true)));

  const { key, keyHash } = generateGuestKey();
  const [newKey] = await db
    .insert(guestKeysTable)
    .values({ guestId: id, hotelId, keyHash, keyDisplay: key })
    .returning();

  await db.insert(auditLogsTable).values({
    hotelId,
    actorId,
    actorType: "manager",
    action: "renew_guest_key",
    targetType: "guest",
    targetId: id,
    metadata: { firstName: existing.firstName, lastName: existing.lastName, roomNumber: existing.roomNumber },
  });

  const { rawToken, expiresAt } = await issueQrToken(id, hotelId, actorId);
  const appBase = getAppBase(req);
  const qrLoginUrl = `${appBase}/guest/auto-login?token=${rawToken}`;

  res.json({
    guest: {
      id: existing.id,
      firstName: existing.firstName,
      lastName: existing.lastName,
      roomNumber: existing.roomNumber,
      countryCode: existing.countryCode,
      language: existing.language,
      hotelId: existing.hotelId,
      isActive: existing.isActive,
      createdAt: existing.createdAt,
      guestKey: newKey.keyDisplay,
    },
    guestKey: key,
    qrLoginUrl,
    qrTokenExpiresAt: expiresAt.toISOString(),
  });
});

export default router;
