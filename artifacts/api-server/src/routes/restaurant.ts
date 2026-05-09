/**
 * Restaurant routes  – /api/restaurant/*
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  Menu        GET/POST/PATCH/DELETE /restaurant/menu[/:id]       │
 * │  Stock       GET/POST/PATCH/DELETE /restaurant/stock[/:id]      │
 * │              PATCH /restaurant/stock/:id/adjust                 │
 * │  Orders      GET   /restaurant/orders                           │
 * │              PATCH /restaurant/orders/:id/status                │
 * │  Insights    GET   /restaurant/care-insights                    │
 * │              POST  /restaurant/care-insights/refresh            │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * Access:
 *   manager                              – full access to all routes
 *   personnel with dept === RESTAURANT   – full access to all routes
 *   guest                                – GET /restaurant/menu only (active items)
 */

import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { db } from "@workspace/db";
import {
  restaurantMenuItemsTable,
  restaurantStockItemsTable,
  restaurantCareInsightsTable,
  serviceRequestsTable,
  MENU_CATEGORIES,
  MENU_TYPES,
} from "@workspace/db";
import { eq, and, desc, asc } from "drizzle-orm";
import { requireAuth, requireStaff } from "../middlewares/requireAuth";
import { analyzeGuestCareForRestaurant } from "../lib/gemini";
import { logger } from "../lib/logger";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function paramInt(val: string | string[]): number {
  const s = Array.isArray(val) ? (val[0] ?? "") : val;
  return parseInt(s, 10);
}

// ---------------------------------------------------------------------------
// requireRestaurantAccess
//   Managers pass unconditionally.
//   Personnel pass only when staffDepartment === "RESTAURANT".
//   All others → 403.
// ---------------------------------------------------------------------------
function requireRestaurantAccess(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  requireStaff(req, res, () => {
    const role = req.session?.role;
    if (role === "manager") {
      next();
      return;
    }
    // staffDepartment is typed on req.session (see requireAuth.ts declaration)
    if (role === "personnel" && req.session?.staffDepartment === "RESTAURANT") {
      next();
      return;
    }
    res.status(403).json({ error: "Restaurant staff access required" });
  });
}

const router = Router();

// ===========================================================================
// MENU
// ===========================================================================

const createMenuItemSchema = z.object({
  name:          z.string().min(1).max(200),
  description:   z.string().max(500).optional(),
  category:      z.enum(MENU_CATEGORIES).default("OTHER"),
  menuType:      z.enum(MENU_TYPES).default("DAILY"),
  availableDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish(),
  priceAmount:   z.string().regex(/^\d+(\.\d{1,2})?$/).nullish(),
  currency:      z.string().max(3).default("TRY"),
  isActive:      z.boolean().default(true),
  allergenNotes: z.string().max(400).nullish(),
  portionInfo:   z.string().max(200).nullish(),
  sortOrder:     z.number().int().default(0),
});

const updateMenuItemSchema = createMenuItemSchema.partial();

/**
 * GET /restaurant/menu
 * Public-ish: requires auth (guest or staff token).
 * Guests see active items for the requested date/type.
 * Staff see all items (including inactive) for filtering.
 */
router.get("/restaurant/menu", async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const { verifyToken } = await import("../lib/auth");
  const payload = verifyToken(authHeader.slice(7));
  if (!payload) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  const { hotelId } = payload;
  const isStaff = payload.role === "manager" || payload.role === "personnel";
  const { menuType, date: dateParam } = req.query;

  if (isStaff) {
    // Staff: return everything (active + inactive) for management UI
    const conditions: ReturnType<typeof eq>[] = [
      eq(restaurantMenuItemsTable.hotelId, hotelId),
    ];
    if (typeof menuType === "string" && MENU_TYPES.includes(menuType as "DAILY" | "ROOM_SERVICE")) {
      conditions.push(eq(restaurantMenuItemsTable.menuType, menuType as "DAILY" | "ROOM_SERVICE"));
    }
    if (typeof dateParam === "string") {
      conditions.push(eq(restaurantMenuItemsTable.availableDate, dateParam));
    }
    const items = await db
      .select()
      .from(restaurantMenuItemsTable)
      .where(and(...conditions))
      .orderBy(asc(restaurantMenuItemsTable.sortOrder), asc(restaurantMenuItemsTable.name));
    res.json(items);
    return;
  }

  // Guest: return only active items
  const today = new Date().toISOString().split("T")[0]!;
  const type = (typeof menuType === "string" && MENU_TYPES.includes(menuType as "DAILY" | "ROOM_SERVICE"))
    ? (menuType as "DAILY" | "ROOM_SERVICE")
    : "DAILY";
  const dateToUse = typeof dateParam === "string" ? dateParam : today;

  const conditions: ReturnType<typeof eq>[] = [
    eq(restaurantMenuItemsTable.hotelId, hotelId),
    eq(restaurantMenuItemsTable.isActive, true),
    eq(restaurantMenuItemsTable.menuType, type),
  ];
  if (type === "DAILY") {
    conditions.push(eq(restaurantMenuItemsTable.availableDate, dateToUse));
  }
  const items = await db
    .select()
    .from(restaurantMenuItemsTable)
    .where(and(...conditions))
    .orderBy(asc(restaurantMenuItemsTable.sortOrder), asc(restaurantMenuItemsTable.name));
  res.json(items);
});

/** POST /restaurant/menu */
router.post("/restaurant/menu", requireRestaurantAccess, async (req: Request, res: Response): Promise<void> => {
  const hotelId = req.session!.hotelId;
  const userId  = req.session!.userId;

  const parsed = createMenuItemSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid request" });
    return;
  }

  const [item] = await db
    .insert(restaurantMenuItemsTable)
    .values({ ...parsed.data, hotelId, createdByUserId: userId })
    .returning();

  logger.info({ itemId: item!.id, hotelId, userId }, "Restaurant menu item created");
  res.status(201).json(item);
});

/** PATCH /restaurant/menu/:id */
router.patch("/restaurant/menu/:id", requireRestaurantAccess, async (req: Request, res: Response): Promise<void> => {
  const hotelId = req.session!.hotelId;
  const id = paramInt(req.params.id!);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid item ID" }); return; }

  const parsed = updateMenuItemSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid request" });
    return;
  }

  const [updated] = await db
    .update(restaurantMenuItemsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(
      eq(restaurantMenuItemsTable.id, id),
      eq(restaurantMenuItemsTable.hotelId, hotelId)
    ))
    .returning();

  if (!updated) { res.status(404).json({ error: "Menu item not found" }); return; }
  res.json(updated);
});

/** DELETE /restaurant/menu/:id */
router.delete("/restaurant/menu/:id", requireRestaurantAccess, async (req: Request, res: Response): Promise<void> => {
  const hotelId = req.session!.hotelId;
  const id = paramInt(req.params.id!);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid item ID" }); return; }

  const [existing] = await db
    .select({ id: restaurantMenuItemsTable.id })
    .from(restaurantMenuItemsTable)
    .where(and(
      eq(restaurantMenuItemsTable.id, id),
      eq(restaurantMenuItemsTable.hotelId, hotelId)
    ));
  if (!existing) { res.status(404).json({ error: "Menu item not found" }); return; }

  await db
    .delete(restaurantMenuItemsTable)
    .where(and(
      eq(restaurantMenuItemsTable.id, id),
      eq(restaurantMenuItemsTable.hotelId, hotelId)
    ));

  logger.info({ itemId: id, hotelId }, "Restaurant menu item deleted");
  res.status(204).send();
});

// ===========================================================================
// STOCK
// ===========================================================================

const createStockSchema = z.object({
  name:               z.string().min(1).max(200),
  unit:               z.string().min(1).max(50).default("adet"),
  quantityOnHand:     z.string().regex(/^\d+(\.\d{1,2})?$/).default("0"),
  lowStockThreshold:  z.string().regex(/^\d+(\.\d{1,2})?$/).nullish(),
  notes:              z.string().max(300).nullish(),
});

const updateStockSchema = createStockSchema.partial();

const adjustStockSchema = z.object({
  delta: z.number().finite(),
});

/** GET /restaurant/stock */
router.get("/restaurant/stock", requireRestaurantAccess, async (req: Request, res: Response): Promise<void> => {
  const hotelId = req.session!.hotelId;
  const items = await db
    .select()
    .from(restaurantStockItemsTable)
    .where(and(
      eq(restaurantStockItemsTable.hotelId, hotelId),
      eq(restaurantStockItemsTable.isActive, true)
    ))
    .orderBy(asc(restaurantStockItemsTable.name));
  res.json(items);
});

/** POST /restaurant/stock */
router.post("/restaurant/stock", requireRestaurantAccess, async (req: Request, res: Response): Promise<void> => {
  const hotelId = req.session!.hotelId;
  const parsed = createStockSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid request" });
    return;
  }
  const [item] = await db
    .insert(restaurantStockItemsTable)
    .values({ ...parsed.data, hotelId })
    .returning();
  res.status(201).json(item);
});

/** PATCH /restaurant/stock/:id/adjust — +/- quantity */
router.patch("/restaurant/stock/:id/adjust", requireRestaurantAccess, async (req: Request, res: Response): Promise<void> => {
  const hotelId = req.session!.hotelId;
  const id = paramInt(req.params.id!);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid stock item ID" }); return; }

  const parsed = adjustStockSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid request" });
    return;
  }

  const [existing] = await db
    .select()
    .from(restaurantStockItemsTable)
    .where(and(
      eq(restaurantStockItemsTable.id, id),
      eq(restaurantStockItemsTable.hotelId, hotelId)
    ));
  if (!existing) { res.status(404).json({ error: "Stock item not found" }); return; }

  const current = parseFloat(existing.quantityOnHand ?? "0");
  const newQty  = Math.max(0, current + parsed.data.delta);

  const [updated] = await db
    .update(restaurantStockItemsTable)
    .set({ quantityOnHand: newQty.toFixed(2), updatedAt: new Date() })
    .where(and(
      eq(restaurantStockItemsTable.id, id),
      eq(restaurantStockItemsTable.hotelId, hotelId)
    ))
    .returning();

  logger.info({ stockId: id, delta: parsed.data.delta, newQty }, "Stock adjusted");
  res.json(updated);
});

/** PATCH /restaurant/stock/:id — update metadata */
router.patch("/restaurant/stock/:id", requireRestaurantAccess, async (req: Request, res: Response): Promise<void> => {
  const hotelId = req.session!.hotelId;
  const id = paramInt(req.params.id!);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid stock item ID" }); return; }

  const parsed = updateStockSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid request" });
    return;
  }

  const [updated] = await db
    .update(restaurantStockItemsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(
      eq(restaurantStockItemsTable.id, id),
      eq(restaurantStockItemsTable.hotelId, hotelId)
    ))
    .returning();
  if (!updated) { res.status(404).json({ error: "Stock item not found" }); return; }
  res.json(updated);
});

/** DELETE /restaurant/stock/:id — soft delete */
router.delete("/restaurant/stock/:id", requireRestaurantAccess, async (req: Request, res: Response): Promise<void> => {
  const hotelId = req.session!.hotelId;
  const id = paramInt(req.params.id!);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid stock item ID" }); return; }

  await db
    .update(restaurantStockItemsTable)
    .set({ isActive: false, updatedAt: new Date() })
    .where(and(
      eq(restaurantStockItemsTable.id, id),
      eq(restaurantStockItemsTable.hotelId, hotelId)
    ));
  res.status(204).send();
});

// ===========================================================================
// ORDERS (FOOD_ORDER service requests)
// ===========================================================================

const ORDER_STATUSES = ["open", "in_progress", "resolved"] as const;
type OrderStatus = (typeof ORDER_STATUSES)[number];

/** GET /restaurant/orders */
router.get("/restaurant/orders", requireRestaurantAccess, async (req: Request, res: Response): Promise<void> => {
  const hotelId = req.session!.hotelId;
  const { status } = req.query;

  const conditions = [
    eq(serviceRequestsTable.hotelId, hotelId),
    eq(serviceRequestsTable.requestType, "FOOD_ORDER"),
  ];
  if (typeof status === "string" && ORDER_STATUSES.includes(status as OrderStatus)) {
    conditions.push(eq(serviceRequestsTable.status, status as OrderStatus));
  }

  const orders = await db
    .select()
    .from(serviceRequestsTable)
    .where(and(...conditions))
    .orderBy(desc(serviceRequestsTable.createdAt));

  res.json(orders);
});

/** PATCH /restaurant/orders/:id/status */
router.patch("/restaurant/orders/:id/status", requireRestaurantAccess, async (req: Request, res: Response): Promise<void> => {
  const hotelId = req.session!.hotelId;
  const id = paramInt(req.params.id!);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid order ID" }); return; }

  const { status } = req.body as { status?: string };
  if (!status || !ORDER_STATUSES.includes(status as OrderStatus)) {
    res.status(400).json({ error: `status must be one of: ${ORDER_STATUSES.join(", ")}` });
    return;
  }

  const [updated] = await db
    .update(serviceRequestsTable)
    .set({ status: status as OrderStatus, updatedAt: new Date() })
    .where(and(
      eq(serviceRequestsTable.id, id),
      eq(serviceRequestsTable.hotelId, hotelId),
      eq(serviceRequestsTable.requestType, "FOOD_ORDER")
    ))
    .returning();

  if (!updated) { res.status(404).json({ error: "Order not found" }); return; }
  logger.info({ orderId: id, status }, "Food order status updated");
  res.json(updated);
});

// ===========================================================================
// CARE INSIGHTS  (AI analysis of CARE_PROFILE_UPDATE service requests)
// ===========================================================================

/** GET /restaurant/care-insights?date=YYYY-MM-DD */
router.get("/restaurant/care-insights", requireRestaurantAccess, async (req: Request, res: Response): Promise<void> => {
  const hotelId = req.session!.hotelId;
  const today = new Date().toISOString().split("T")[0]!;
  const date  = typeof req.query.date === "string" ? req.query.date : today;

  const [insight] = await db
    .select()
    .from(restaurantCareInsightsTable)
    .where(and(
      eq(restaurantCareInsightsTable.hotelId, hotelId),
      eq(restaurantCareInsightsTable.date, date)
    ));

  res.json(insight ?? { date, insights: [], sourceRequestCount: 0, cached: false });
});

/** POST /restaurant/care-insights/refresh — trigger fresh AI analysis */
router.post("/restaurant/care-insights/refresh", requireRestaurantAccess, async (req: Request, res: Response): Promise<void> => {
  const hotelId = req.session!.hotelId;
  const today   = new Date().toISOString().split("T")[0]!;

  // Fetch all CARE_PROFILE_UPDATE requests for this hotel
  const careRequests = await db
    .select()
    .from(serviceRequestsTable)
    .where(and(
      eq(serviceRequestsTable.hotelId, hotelId),
      eq(serviceRequestsTable.requestType, "CARE_PROFILE_UPDATE")
    ))
    .orderBy(desc(serviceRequestsTable.createdAt));

  if (careRequests.length === 0) {
    res.json({ date: today, insights: [], sourceRequestCount: 0 });
    return;
  }

  const summaries = careRequests.map((r) => ({
    roomNumber:    r.roomNumber,
    guestName:     `${r.guestFirstName} ${r.guestLastName}`,
    summary:       r.summary,
    structuredData: r.structuredData as Record<string, unknown> | null,
  }));

  logger.info({ hotelId, count: summaries.length }, "Generating restaurant care insights");

  const insights = await analyzeGuestCareForRestaurant(summaries);

  // Upsert today's insight record
  const [existing] = await db
    .select({ id: restaurantCareInsightsTable.id })
    .from(restaurantCareInsightsTable)
    .where(and(
      eq(restaurantCareInsightsTable.hotelId, hotelId),
      eq(restaurantCareInsightsTable.date, today)
    ));

  let result;
  if (existing) {
    [result] = await db
      .update(restaurantCareInsightsTable)
      .set({ insights, sourceRequestCount: careRequests.length, updatedAt: new Date() })
      .where(eq(restaurantCareInsightsTable.id, existing.id))
      .returning();
  } else {
    [result] = await db
      .insert(restaurantCareInsightsTable)
      .values({ hotelId, date: today, insights, sourceRequestCount: careRequests.length })
      .returning();
  }

  logger.info({ hotelId, insightCount: insights.length }, "Restaurant care insights refreshed");
  res.json(result);
});

export default router;
