import { Router } from "express";
import type { IRouter, Request } from "express";
import { db, guestsTable, guestKeysTable, auditLogsTable, hotelWifiNetworksTable } from "@workspace/db";
import { eq, and, desc, count } from "drizzle-orm";
import {
  requireGuestOperations,
  requireGeneralManager,
} from "../middlewares/requireAuth";
import { generateGuestKey } from "../lib/auth";
import { deriveLocaleFromCountry } from "../lib/locale";
import { issueQrToken, revokeAllGuestQrTokens } from "../lib/qr-token";
import { getHotelSlugById, readHotelSlugFromRequest, findHotelBySlug } from "../lib/hotel-resolver";
import { buildTenantAppUrl, getAppBaseFromRequest } from "../lib/app-url";

const router: IRouter = Router();

async function buildGuestQrLoginUrl(req: Request, hotelId: number, rawToken: string): Promise<string> {
  const appBase = getAppBaseFromRequest(req);
  const slug = await getHotelSlugById(hotelId);
  const path = `/guest/auto-login?token=${encodeURIComponent(rawToken)}`;
  if (slug) return buildTenantAppUrl(appBase, slug, path);
  return `${appBase.replace(/\/+$/, "")}${path}`;
}

/** Validate a date string is in YYYY-MM-DD format. */
function isValidDate(s: unknown): s is string {
  if (typeof s !== "string") return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

// Guest fields projected in all SELECT operations.
const GUEST_SELECT = {
  id: guestsTable.id,
  firstName: guestsTable.firstName,
  lastName: guestsTable.lastName,
  roomNumber: guestsTable.roomNumber,
  countryCode: guestsTable.countryCode,
  language: guestsTable.language,
  hotelId: guestsTable.hotelId,
  isActive: guestsTable.isActive,
  checkInDate: guestsTable.checkInDate,
  checkOutDate: guestsTable.checkOutDate,
  originalCheckOutDate: guestsTable.originalCheckOutDate,
  isExtended: guestsTable.isExtended,
  extensionCount: guestsTable.extensionCount,
  wifiNetworkId: guestsTable.wifiNetworkId,
  createdAt: guestsTable.createdAt,
  guestKey: guestKeysTable.keyDisplay,
} as const;

async function resolveWifiNetworkId(
  hotelId: number,
  wifiNetworkId: unknown,
): Promise<number | null | "invalid"> {
  if (wifiNetworkId === undefined || wifiNetworkId === null || wifiNetworkId === "") {
    return null;
  }
  const id = typeof wifiNetworkId === "number" ? wifiNetworkId : parseInt(String(wifiNetworkId), 10);
  if (!Number.isFinite(id) || id <= 0) return "invalid";

  const [network] = await db
    .select({ id: hotelWifiNetworksTable.id })
    .from(hotelWifiNetworksTable)
    .where(and(eq(hotelWifiNetworksTable.id, id), eq(hotelWifiNetworksTable.hotelId, hotelId)));

  return network ? id : "invalid";
}

const GUESTS_PAGE_SIZE_DEFAULT = 50;
const GUESTS_PAGE_SIZE_MAX = 50;

function parseGuestsPagination(query: Request["query"]) {
  const rawPage = query.page;
  if (rawPage == null || rawPage === "") return null;
  const page = Math.max(1, Number(rawPage) || 1);
  const limit = Math.min(
    GUESTS_PAGE_SIZE_MAX,
    Math.max(1, Number(query.limit) || GUESTS_PAGE_SIZE_DEFAULT),
  );
  return { page, limit, offset: (page - 1) * limit };
}

// ---------------------------------------------------------------------------
// GET /guests — list guests (paginated when ?page= is set)
// ---------------------------------------------------------------------------
router.get("/guests", requireGuestOperations, async (req, res): Promise<void> => {
  const hotelId = req.session!.hotelId;
  const pagination = parseGuestsPagination(req.query);

  const baseQuery = db
    .select(GUEST_SELECT)
    .from(guestsTable)
    .leftJoin(guestKeysTable, and(eq(guestKeysTable.guestId, guestsTable.id), eq(guestKeysTable.isActive, true)))
    .where(and(eq(guestsTable.hotelId, hotelId), eq(guestsTable.isActive, true)))
    .orderBy(desc(guestsTable.createdAt));

  if (!pagination) {
    const guests = await baseQuery;
    res.json(guests);
    return;
  }

  const { page, limit, offset } = pagination;

  const [totalRow] = await db
    .select({ total: count() })
    .from(guestsTable)
    .where(and(eq(guestsTable.hotelId, hotelId), eq(guestsTable.isActive, true)));

  const total = Number(totalRow?.total ?? 0);
  const guests = await baseQuery.limit(limit).offset(offset);

  res.json({
    items: guests,
    pagination: {
      page,
      limit,
      total,
      hasMore: offset + guests.length < total,
    },
  });
});

// ---------------------------------------------------------------------------
// POST /guests — create a new guest
// ---------------------------------------------------------------------------
router.post("/guests", requireGuestOperations, async (req, res): Promise<void> => {
  const { firstName, lastName, roomNumber, countryCode, checkInDate, checkOutDate, wifiNetworkId } =
    req.body;
  const hotelId = req.session!.hotelId;
  const actorId = req.session!.userId;

  const tenantSlug = readHotelSlugFromRequest(req);
  if (tenantSlug) {
    const tenantHotel = await findHotelBySlug(tenantSlug, { requireActive: true });
    if (tenantHotel && tenantHotel.id !== hotelId) {
      res.status(403).json({
        error:
          "Your session is for a different property. Sign out and sign in again at this hotel's login page.",
      });
      return;
    }
  }

  if (!firstName || !lastName || !roomNumber) {
    res.status(400).json({ error: "firstName, lastName, and roomNumber are required" });
    return;
  }

  if (!countryCode || typeof countryCode !== "string" || countryCode.trim().length < 2) {
    res.status(400).json({ error: "countryCode is required (ISO 3166-1 alpha-2)" });
    return;
  }

  // Stay date validation — optional fields, must be valid format if provided.
  const validCheckIn = isValidDate(checkInDate) ? checkInDate : null;
  const validCheckOut = isValidDate(checkOutDate) ? checkOutDate : null;

  if (validCheckIn && validCheckOut && validCheckOut <= validCheckIn) {
    res.status(400).json({ error: "checkOutDate must be after checkInDate" });
    return;
  }

  const normalizedCountry = countryCode.trim().toUpperCase();
  const { voiceLocale } = deriveLocaleFromCountry(normalizedCountry);

  const hotelNetworks = await db
    .select({ id: hotelWifiNetworksTable.id })
    .from(hotelWifiNetworksTable)
    .where(eq(hotelWifiNetworksTable.hotelId, hotelId));

  const resolvedWifiId = await resolveWifiNetworkId(hotelId, wifiNetworkId);
  if (resolvedWifiId === "invalid") {
    res.status(400).json({ error: "Invalid Wi-Fi network" });
    return;
  }
  if (hotelNetworks.length > 0 && resolvedWifiId === null) {
    res.status(400).json({ error: "wifiNetworkId is required when hotel Wi-Fi networks are configured" });
    return;
  }

  const [guest] = await db
    .insert(guestsTable)
    .values({
      firstName,
      lastName,
      roomNumber,
      hotelId,
      countryCode: normalizedCountry,
      language: voiceLocale,
      checkInDate: validCheckIn,
      checkOutDate: validCheckOut,
      // originalCheckOutDate mirrors checkOutDate at creation — never overwritten.
      originalCheckOutDate: validCheckOut,
      wifiNetworkId: resolvedWifiId,
    })
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
    metadata: {
      roomNumber,
      firstName,
      lastName,
      countryCode: normalizedCountry,
      language: voiceLocale,
      checkInDate: validCheckIn,
      checkOutDate: validCheckOut,
      wifiNetworkId: resolvedWifiId,
    },
  });

  const { rawToken, expiresAt } = await issueQrToken(guest.id, hotelId, actorId);
  const qrLoginUrl = await buildGuestQrLoginUrl(req, hotelId, rawToken);

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
      checkInDate: guest.checkInDate,
      checkOutDate: guest.checkOutDate,
      originalCheckOutDate: guest.originalCheckOutDate,
      isExtended: guest.isExtended,
      extensionCount: guest.extensionCount,
      wifiNetworkId: guest.wifiNetworkId,
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
router.get("/guests/:id", requireGuestOperations, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid guest ID" });
    return;
  }

  const hotelId = req.session!.hotelId;
  const [guest] = await db
    .select(GUEST_SELECT)
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
// PATCH /guests/:id — update guest details + optionally extend stay
// ---------------------------------------------------------------------------
router.patch("/guests/:id", requireGuestOperations, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid guest ID" });
    return;
  }

  const hotelId = req.session!.hotelId;
  const actorId = req.session!.userId;
  const { firstName, lastName, roomNumber, countryCode, checkInDate, checkOutDate, wifiNetworkId } =
    req.body;

  const [existing] = await db
    .select()
    .from(guestsTable)
    .where(and(eq(guestsTable.id, id), eq(guestsTable.hotelId, hotelId), eq(guestsTable.isActive, true)));

  if (!existing) {
    res.status(404).json({ error: "Guest not found" });
    return;
  }

  const updates: Record<string, unknown> = {};

  // ── Standard fields ──
  if (firstName && typeof firstName === "string") updates.firstName = firstName.trim();
  if (lastName && typeof lastName === "string") updates.lastName = lastName.trim();
  if (roomNumber && typeof roomNumber === "string") updates.roomNumber = roomNumber.trim();
  if (countryCode && typeof countryCode === "string") {
    const normalized = countryCode.trim().toUpperCase();
    updates.countryCode = normalized;
    updates.language = deriveLocaleFromCountry(normalized).voiceLocale;
  }

  // ── Wi-Fi network ──
  if (wifiNetworkId !== undefined) {
    const resolvedWifiId = await resolveWifiNetworkId(hotelId, wifiNetworkId);
    if (resolvedWifiId === "invalid") {
      res.status(400).json({ error: "Invalid Wi-Fi network" });
      return;
    }
    updates.wifiNetworkId = resolvedWifiId;
  }

  // ── Check-in date ──
  if (isValidDate(checkInDate)) {
    updates.checkInDate = checkInDate;
  }

  // ── Check-out / extension logic ─────────────────────────────────────────
  // If a new checkOutDate is provided and is strictly later than the existing
  // one, this is a stay extension. We capture the original checkout on first
  // extension and increment the extension counter.
  if (isValidDate(checkOutDate)) {
    const newOut = checkOutDate as string;
    const currentOut = existing.checkOutDate;

    if (currentOut && newOut > currentOut) {
      // Stay extension detected
      updates.checkOutDate = newOut;
      // Preserve original checkout on the first extension
      if (!existing.originalCheckOutDate) {
        updates.originalCheckOutDate = currentOut;
      }
      updates.isExtended = true;
      updates.extensionCount = (existing.extensionCount ?? 0) + 1;

      await db.insert(auditLogsTable).values({
        hotelId,
        actorId,
        actorType: "manager",
        action: "extend_stay",
        targetType: "guest",
        targetId: id,
        metadata: {
          previousCheckOut: currentOut,
          newCheckOut: newOut,
          extensionCount: (existing.extensionCount ?? 0) + 1,
          firstName: existing.firstName,
          lastName: existing.lastName,
          roomNumber: existing.roomNumber,
        },
      });
    } else {
      // Setting or correcting checkout (not an extension)
      updates.checkOutDate = newOut;
    }
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
      before: {
        firstName: existing.firstName,
        lastName: existing.lastName,
        roomNumber: existing.roomNumber,
        checkOutDate: existing.checkOutDate,
      },
      after: updates,
    },
  });

  res.json(updated);
});

// ---------------------------------------------------------------------------
// DELETE /guests/:id — soft-delete (manager only)
// ---------------------------------------------------------------------------
router.delete("/guests/:id", requireGeneralManager, async (req, res): Promise<void> => {
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
// POST /guests/:id/renew-key
// ---------------------------------------------------------------------------
router.post("/guests/:id/renew-key", requireGuestOperations, async (req, res): Promise<void> => {
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
  const qrLoginUrl = await buildGuestQrLoginUrl(req, hotelId, rawToken);

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
      checkInDate: existing.checkInDate,
      checkOutDate: existing.checkOutDate,
      originalCheckOutDate: existing.originalCheckOutDate,
      isExtended: existing.isExtended,
      extensionCount: existing.extensionCount,
      wifiNetworkId: existing.wifiNetworkId,
      createdAt: existing.createdAt,
      guestKey: newKey.keyDisplay,
    },
    guestKey: key,
    qrLoginUrl,
    qrTokenExpiresAt: expiresAt.toISOString(),
  });
});

export default router;
