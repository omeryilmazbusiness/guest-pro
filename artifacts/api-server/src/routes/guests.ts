import { Router } from "express";
import type { IRouter, Request } from "express";
import { db, guestsTable, guestKeysTable, auditLogsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireStaff } from "../middlewares/requireAuth";
import { generateGuestKey } from "../lib/auth";
import { deriveLocaleFromCountry } from "../lib/locale";
import { issueQrToken } from "../lib/qr-token";
import { env } from "../config/env";

const router: IRouter = Router();

function getAppBase(req: Request): string {
  if (env.APP_BASE_URL) return env.APP_BASE_URL;
  const proto = (req.headers["x-forwarded-proto"] as string) ?? req.protocol;
  const host = (req.headers["x-forwarded-host"] as string) ?? req.headers.host;
  return `${proto}://${host}`;
}

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
      createdAt: guestsTable.createdAt,
      guestKey: guestKeysTable.keyDisplay,
    })
    .from(guestsTable)
    .leftJoin(guestKeysTable, and(eq(guestKeysTable.guestId, guestsTable.id), eq(guestKeysTable.isActive, true)))
    .where(eq(guestsTable.hotelId, hotelId))
    .orderBy(desc(guestsTable.createdAt));

  res.json(guests);
});

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

  // Issue a secure single-use QR auto-login token (24h, single-use, SHA-256 hashed in DB)
  const { rawToken, expiresAt } = await issueQrToken(guest.id, hotelId, actorId);

  // Build the auto-login URL — path must match the frontend route
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
      createdAt: guest.createdAt,
      guestKey: guestKey.keyDisplay,
    },
    guestKey: key,
    qrLoginUrl,
    qrTokenExpiresAt: expiresAt.toISOString(),
  });
});

router.get("/guests/:id", requireStaff, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid guest ID" });
    return;
  }

  const [guest] = await db
    .select({
      id: guestsTable.id,
      firstName: guestsTable.firstName,
      lastName: guestsTable.lastName,
      roomNumber: guestsTable.roomNumber,
      countryCode: guestsTable.countryCode,
      language: guestsTable.language,
      hotelId: guestsTable.hotelId,
      createdAt: guestsTable.createdAt,
      guestKey: guestKeysTable.keyDisplay,
    })
    .from(guestsTable)
    .leftJoin(guestKeysTable, and(eq(guestKeysTable.guestId, guestsTable.id), eq(guestKeysTable.isActive, true)))
    .where(eq(guestsTable.id, id));

  if (!guest) {
    res.status(404).json({ error: "Guest not found" });
    return;
  }

  res.json(guest);
});

export default router;
