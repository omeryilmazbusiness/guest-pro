import { Router } from "express";
import type { IRouter } from "express";
import { z } from "zod";
import {
  db,
  hotelsTable,
  hotelBrandingTable,
  usersTable,
  platformAdminsTable,
  auditLogsTable,
} from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import {
  hashPassword,
  generateSalt,
} from "../lib/auth";
import { requirePlatformAdmin } from "../middlewares/requirePlatformAdmin";
import { requireAuth } from "../middlewares/requireAuth";
import {
  createHotelGeneralManager,
  createHotelWithBranding,
  updateHotelRecord,
  deleteHotelPermanently,
  ProvisioningError,
} from "../lib/hotel-provisioning";
import { isPlatformAdminRole } from "../lib/roles";
import { logPlatformAudit } from "../lib/platform-audit";
import { listHotelsWithTrackStats } from "../lib/platform-hotel-track";
import { HOTEL_PLAN_TIERS } from "../lib/hotel-provisioning";
import {
  saveHotelLogo,
  clearHotelLogo,
  resolveHotelLogoUrl,
} from "../lib/hotel-logo-storage";

const router: IRouter = Router();

const createHotelSchema = z.object({
  name: z.string().min(2).max(120),
  appName: z.string().min(1).max(120).optional(),
  address: z.string().min(3).max(500),
  countryCode: z.string().length(2).regex(/^[A-Z]{2}$/i).transform((c) => c.toUpperCase()),
});

const updateHotelSchema = z
  .object({
    name: z.string().min(2).max(120).optional(),
    address: z.string().min(3).max(500).optional(),
    countryCode: z.string().length(2).regex(/^[A-Z]{2}$/i).transform((c) => c.toUpperCase()).optional(),
    slug: z.string().min(2).max(64).regex(/^[a-z0-9-]+$/).optional(),
    isActive: z.boolean().optional(),
    planTier: z.enum(HOTEL_PLAN_TIERS).optional(),
    subscriptionRenewsAt: z.string().nullable().optional(),
    platformNotes: z.string().max(2000).nullable().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: "No fields to update" });

const deleteHotelSchema = z.object({
  confirmSlug: z.string().min(2).max(64),
});

const createManagerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
});

const changePasswordSchema = z.object({
  newPassword: z.string().min(8).max(200),
});

const resetManagerPasswordSchema = z.object({
  newPassword: z.string().min(8).max(200),
});

// GET /platform/auth/me
router.get("/platform/auth/me", requireAuth, async (req, res): Promise<void> => {
  if (!isPlatformAdminRole(req.session!.role)) {
    res.status(403).json({ error: "Platform administrator access required" });
    return;
  }
  const [admin] = await db
    .select()
    .from(platformAdminsTable)
    .where(eq(platformAdminsTable.id, req.session!.userId));
  if (!admin || !admin.isActive) {
    res.status(401).json({ error: "Session invalid" });
    return;
  }
  res.json({
    id: admin.id,
    email: admin.email,
    firstName: admin.firstName,
    lastName: admin.lastName,
    role: "platform_admin",
  });
});

// PATCH /platform/auth/password
router.patch("/platform/auth/password", requirePlatformAdmin, async (req, res): Promise<void> => {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid request" });
    return;
  }

  const [admin] = await db
    .select()
    .from(platformAdminsTable)
    .where(eq(platformAdminsTable.id, req.session!.userId));
  if (!admin) {
    res.status(401).json({ error: "Session invalid" });
    return;
  }

  const salt = generateSalt();
  await db
    .update(platformAdminsTable)
    .set({ passwordHash: hashPassword(parsed.data.newPassword, salt) })
    .where(eq(platformAdminsTable.id, admin.id));

  await logPlatformAudit(req.session!.userId, "platform_password_change", {
    email: admin.email,
  });

  res.json({ ok: true });
});

// GET /platform/hotels
router.get("/platform/hotels", requirePlatformAdmin, async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: hotelsTable.id,
      name: hotelsTable.name,
      slug: hotelsTable.slug,
      address: hotelsTable.address,
      countryCode: hotelsTable.countryCode,
      isActive: hotelsTable.isActive,
      planTier: hotelsTable.planTier,
      subscriptionRenewsAt: hotelsTable.subscriptionRenewsAt,
      platformNotes: hotelsTable.platformNotes,
      createdAt: hotelsTable.createdAt,
      updatedAt: hotelsTable.updatedAt,
      logoUrl: hotelBrandingTable.logoUrl,
    })
    .from(hotelsTable)
    .leftJoin(hotelBrandingTable, eq(hotelBrandingTable.hotelId, hotelsTable.id))
    .orderBy(desc(hotelsTable.createdAt));

  const hotels = await Promise.all(
    rows.map(async (h) => ({
      ...h,
      logoUrl: await resolveHotelLogoUrl(h.id, h.slug, h.logoUrl),
    })),
  );

  res.json({ hotels });
});

// GET /platform/track — per-hotel subscription & usage snapshot
router.get("/platform/track", requirePlatformAdmin, async (_req, res): Promise<void> => {
  const properties = await listHotelsWithTrackStats();
  res.json({ properties });
});

// POST /platform/hotels
router.post("/platform/hotels", requirePlatformAdmin, async (req, res): Promise<void> => {
  const parsed = createHotelSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid request" });
    return;
  }

  try {
    const hotel = await createHotelWithBranding(parsed.data);
    const logoUrl = await resolveHotelLogoUrl(hotel.id, hotel.slug, null);
    await logPlatformAudit(req.session!.userId, "platform_create_hotel", {
      hotelId: hotel.id,
      slug: hotel.slug,
      name: hotel.name,
      targetType: "hotel",
      targetId: hotel.id,
    }, hotel.id);
    res.status(201).json({
      hotel: { ...hotel, logoUrl },
      paths: {
        login: `/${hotel.slug}/login`,
        manager: `/${hotel.slug}/manager`,
        guest: `/${hotel.slug}/guest`,
      },
    });
  } catch (err) {
    if (err instanceof ProvisioningError) {
      res.status(400).json({ error: err.message, code: err.code });
      return;
    }
    throw err;
  }
});

// POST /platform/hotels/:hotelId/managers
router.post("/platform/hotels/:hotelId/managers", requirePlatformAdmin, async (req, res): Promise<void> => {
  const hotelId = parseInt(String(req.params.hotelId), 10);
  if (Number.isNaN(hotelId)) {
    res.status(400).json({ error: "Invalid hotel id" });
    return;
  }

  const parsed = createManagerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid request" });
    return;
  }

  try {
    const { hotel, manager } = await createHotelGeneralManager({
      hotelId,
      ...parsed.data,
    });
    await logPlatformAudit(req.session!.userId, "platform_create_manager", {
      hotelId: hotel.id,
      managerId: manager.id,
      email: manager.email,
      targetType: "user",
      targetId: manager.id,
    }, hotel.id);
    res.status(201).json({
      hotel: { id: hotel.id, name: hotel.name, slug: hotel.slug },
      manager: {
        id: manager.id,
        email: manager.email,
        firstName: manager.firstName,
        lastName: manager.lastName,
        role: manager.role,
      },
      loginUrl: `/${hotel.slug}/login`,
    });
  } catch (err) {
    if (err instanceof ProvisioningError) {
      const status = err.code === "HOTEL_NOT_FOUND" ? 404 : 400;
      res.status(status).json({ error: err.message, code: err.code });
      return;
    }
    throw err;
  }
});

// GET /platform/hotels/:hotelId/managers — list GMs for a hotel
router.get("/platform/hotels/:hotelId/managers", requirePlatformAdmin, async (req, res): Promise<void> => {
  const hotelId = parseInt(String(req.params.hotelId), 10);
  if (Number.isNaN(hotelId)) {
    res.status(400).json({ error: "Invalid hotel id" });
    return;
  }

  const managers = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      role: usersTable.role,
      isActive: usersTable.isActive,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .where(eq(usersTable.hotelId, hotelId));

  res.json({ managers });
});

// PATCH /platform/hotels/:hotelId — update tenant (slug, status, address, …)
router.patch("/platform/hotels/:hotelId", requirePlatformAdmin, async (req, res): Promise<void> => {
  const hotelId = parseInt(String(req.params.hotelId), 10);
  if (Number.isNaN(hotelId)) {
    res.status(400).json({ error: "Invalid hotel id" });
    return;
  }

  const parsed = updateHotelSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid request" });
    return;
  }

  try {
    const updated = await updateHotelRecord(hotelId, parsed.data);
    const [branding] = await db
      .select({ logoUrl: hotelBrandingTable.logoUrl })
      .from(hotelBrandingTable)
      .where(eq(hotelBrandingTable.hotelId, hotelId));
    const logoUrl = await resolveHotelLogoUrl(updated.id, updated.slug, branding?.logoUrl);
    const action =
      parsed.data.isActive === false
        ? "platform_deactivate_hotel"
        : parsed.data.isActive === true
          ? "platform_activate_hotel"
          : parsed.data.slug
            ? "platform_update_hotel_slug"
            : "platform_update_hotel";
    await logPlatformAudit(
      req.session!.userId,
      action,
      { hotelId: updated.id, slug: updated.slug, ...parsed.data, targetType: "hotel", targetId: updated.id },
      updated.id,
    );
    res.json({ hotel: { ...updated, logoUrl } });
  } catch (err) {
    if (err instanceof ProvisioningError) {
      res.status(400).json({ error: err.message, code: err.code });
      return;
    }
    throw err;
  }
});

// PUT /platform/hotels/:hotelId/logo — raw JPEG/PNG/WebP body (max 3 MB)
router.put("/platform/hotels/:hotelId/logo", requirePlatformAdmin, async (req, res): Promise<void> => {
  const hotelId = parseInt(String(req.params.hotelId), 10);
  if (Number.isNaN(hotelId)) {
    res.status(400).json({ error: "Invalid hotel id" });
    return;
  }

  const buffer = req.body as Buffer;
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    res.status(400).json({ error: "Send image/jpeg, image/png, or image/webp as request body" });
    return;
  }

  const [hotel] = await db.select().from(hotelsTable).where(eq(hotelsTable.id, hotelId));
  if (!hotel) {
    res.status(404).json({ error: "Hotel not found" });
    return;
  }

  try {
    const logoUrl = await saveHotelLogo(hotelId, hotel.slug, buffer);
    await logPlatformAudit(req.session!.userId, "platform_update_hotel_logo", {
      hotelId,
      slug: hotel.slug,
      targetType: "hotel",
      targetId: hotelId,
    }, hotelId);
    res.json({ logoUrl });
  } catch (err) {
    res.status(400).json({
      error: err instanceof Error ? err.message : "Could not save logo",
    });
  }
});

// DELETE /platform/hotels/:hotelId/logo
router.delete("/platform/hotels/:hotelId/logo", requirePlatformAdmin, async (req, res): Promise<void> => {
  const hotelId = parseInt(String(req.params.hotelId), 10);
  if (Number.isNaN(hotelId)) {
    res.status(400).json({ error: "Invalid hotel id" });
    return;
  }

  const [hotel] = await db.select().from(hotelsTable).where(eq(hotelsTable.id, hotelId));
  if (!hotel) {
    res.status(404).json({ error: "Hotel not found" });
    return;
  }

  await clearHotelLogo(hotelId);
  await logPlatformAudit(req.session!.userId, "platform_remove_hotel_logo", {
    hotelId,
    slug: hotel.slug,
    targetType: "hotel",
    targetId: hotelId,
  }, hotelId);
  res.json({ logoUrl: null });
});

async function handleDeleteHotel(
  req: import("express").Request,
  res: import("express").Response,
): Promise<void> {
  const hotelId = parseInt(String(req.params.hotelId), 10);
  if (Number.isNaN(hotelId)) {
    res.status(400).json({ error: "Invalid hotel id" });
    return;
  }

  const confirmFromQuery =
    typeof req.query.confirmSlug === "string" ? req.query.confirmSlug : undefined;
  const body = req.body as { confirmSlug?: string } | undefined;
  const parsed = deleteHotelSchema.safeParse({
    confirmSlug: confirmFromQuery ?? body?.confirmSlug,
  });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid request" });
    return;
  }

  try {
    const result = await deleteHotelPermanently(hotelId, parsed.data.confirmSlug);
    await logPlatformAudit(req.session!.userId, "platform_delete_hotel", {
      hotelId,
      slug: result.slug,
      targetType: "hotel",
      targetId: hotelId,
    });
    res.json(result);
  } catch (err) {
    if (err instanceof ProvisioningError) {
      const status = err.code === "HOTEL_NOT_FOUND" ? 404 : 400;
      res.status(status).json({ error: err.message, code: err.code });
      return;
    }
    const pgCode = (err as { code?: string })?.code;
    if (pgCode === "23503") {
      res.status(409).json({
        error: "Could not delete hotel because related data still exists. Contact support.",
      });
      return;
    }
    throw err;
  }
}

// POST preferred — some proxies / stale builds omit DELETE handlers
router.post(
  "/platform/hotels/:hotelId/delete",
  requirePlatformAdmin,
  handleDeleteHotel,
);

// DELETE /platform/hotels/:hotelId — permanent removal (requires confirmSlug)
router.delete("/platform/hotels/:hotelId", requirePlatformAdmin, handleDeleteHotel);

// POST /platform/hotels/:hotelId/managers/:managerId/reset-password
router.post(
  "/platform/hotels/:hotelId/managers/:managerId/reset-password",
  requirePlatformAdmin,
  async (req, res): Promise<void> => {
    const hotelId = parseInt(String(req.params.hotelId), 10);
    const managerId = parseInt(String(req.params.managerId), 10);
    if (Number.isNaN(hotelId) || Number.isNaN(managerId)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const parsed = resetManagerPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid request" });
      return;
    }

    const [manager] = await db
      .select()
      .from(usersTable)
      .where(and(eq(usersTable.id, managerId), eq(usersTable.hotelId, hotelId)));

    if (!manager) {
      res.status(404).json({ error: "Manager not found for this hotel" });
      return;
    }

    const salt = generateSalt();
    await db
      .update(usersTable)
      .set({ passwordHash: hashPassword(parsed.data.newPassword, salt) })
      .where(eq(usersTable.id, managerId));

    await logPlatformAudit(
      req.session!.userId,
      "platform_reset_manager_password",
      {
        hotelId,
        managerId,
        email: manager.email,
        targetType: "user",
        targetId: managerId,
      },
      hotelId,
    );

    res.json({ ok: true, managerId });
  },
);

// GET /platform/audit-logs
router.get("/platform/audit-logs", requirePlatformAdmin, async (req, res): Promise<void> => {
  const limit = Math.min(parseInt(String(req.query.limit ?? "50"), 10) || 50, 200);

  const logs = await db
    .select()
    .from(auditLogsTable)
    .where(eq(auditLogsTable.actorType, "platform_admin"))
    .orderBy(desc(auditLogsTable.createdAt))
    .limit(limit);

  res.json({ logs });
});

export default router;
