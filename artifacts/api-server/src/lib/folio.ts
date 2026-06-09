/**
 * Guest folio — charge sync from service requests and daily bill aggregation.
 */

import {
  db,
  guestFolioEntriesTable,
  restaurantMenuItemsTable,
  serviceRequestsTable,
  type FolioCategory,
  type ServiceRequest,
} from "@workspace/db";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { logger } from "./logger";

const MINIBAR_CHARGE_TRY = process.env.FOLIO_MINIBAR_CHARGE ?? "250.00";

export interface FolioLineDto {
  id: number;
  description: string;
  category: FolioCategory;
  quantity: number;
  unitAmount: string;
  lineTotal: string;
  currency: string;
  createdAt: string;
}

export interface DailyBillDto {
  date: string;
  currency: string;
  subtotal: string;
  itemCount: number;
  lines: FolioLineDto[];
}

export interface FolioDaySummaryDto {
  date: string;
  currency: string;
  subtotal: string;
  itemCount: number;
}

function parseAmount(value: string | number | null | undefined): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : parseFloat(String(value));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function formatAmount(n: number): string {
  return n.toFixed(2);
}

function chargeDateFromRequest(createdAt: Date): string {
  return createdAt.toISOString().slice(0, 10);
}

interface FoodStructuredData {
  menuItemId: number | null;
  itemName: string | null;
  category: string | null;
  quantity: number;
  unitPrice: string | null;
  currency: string;
  menuType: string | null;
}

const EMPTY_FOOD_DATA: FoodStructuredData = {
  menuItemId: null,
  itemName: null,
  category: null,
  quantity: 1,
  unitPrice: null,
  currency: "TRY",
  menuType: null,
};

function foodStructuredData(data: Record<string, unknown> | null): FoodStructuredData {
  if (!data) return EMPTY_FOOD_DATA;
  return {
    menuItemId:
      typeof data.menuItemId === "number"
        ? data.menuItemId
        : Number(data.menuItemId) || null,
    itemName:
      typeof data.itemName === "string"
        ? data.itemName
        : typeof data.item === "string"
          ? data.item
          : null,
    category: typeof data.category === "string" ? data.category : null,
    quantity:
      typeof data.quantity === "number"
        ? data.quantity
        : parseInt(String(data.quantity ?? "1"), 10) || 1,
    unitPrice:
      data.unitPrice != null
        ? String(data.unitPrice)
        : data.priceAmount != null
          ? String(data.priceAmount)
          : null,
    currency: typeof data.currency === "string" ? data.currency : "TRY",
    menuType: typeof data.menuType === "string" ? data.menuType : null,
  };
}

interface FoodOrderLine {
  menuItemId: number | null;
  itemName: string | null;
  category: string | null;
  quantity: number;
  unitPrice: string | null;
  currency: string;
  menuType: string | null;
}

function parseFoodOrderLine(entry: unknown): FoodOrderLine | null {
  if (!entry || typeof entry !== "object") return null;
  const row = entry as Record<string, unknown>;
  const itemName =
    typeof row.itemName === "string"
      ? row.itemName
      : typeof row.item === "string"
        ? row.item
        : null;
  if (!itemName) return null;
  return {
    menuItemId:
      typeof row.menuItemId === "number"
        ? row.menuItemId
        : Number(row.menuItemId) || null,
    itemName,
    category: typeof row.category === "string" ? row.category : null,
    quantity:
      typeof row.quantity === "number"
        ? Math.max(1, row.quantity)
        : parseInt(String(row.quantity ?? "1"), 10) || 1,
    unitPrice:
      row.unitPrice != null
        ? String(row.unitPrice)
        : row.priceAmount != null
          ? String(row.priceAmount)
          : null,
    currency: typeof row.currency === "string" ? row.currency : "TRY",
    menuType: typeof row.menuType === "string" ? row.menuType : null,
  };
}

function parseFoodOrderLines(data: Record<string, unknown> | null): FoodOrderLine[] {
  if (!data || !Array.isArray(data.items)) return [];
  return data.items
    .map(parseFoodOrderLine)
    .filter((line): line is FoodOrderLine => line !== null);
}

async function syncMultiFoodOrderFolio(
  request: ServiceRequest,
  lines: FoodOrderLine[],
): Promise<void> {
  let total = 0;
  let currency = "TRY";
  let category: FolioCategory = "FOOD";
  const descriptions: string[] = [];

  for (const line of lines) {
    const qty = Math.max(1, line.quantity);
    let unitAmount = parseAmount(line.unitPrice);
    const price = await resolveMenuPrice(
      request.hotelId,
      line.menuItemId,
      line.itemName,
      line.category,
    );
    if (price) {
      unitAmount = price.unitAmount;
      currency = price.currency;
      category = folioCategoryFromMenu(price.menuType);
    } else if (unitAmount != null) {
      currency = line.currency;
      category = folioCategoryFromMenu(line.menuType);
    }

    if (unitAmount == null) continue;
    total += unitAmount * qty;
    descriptions.push(qty > 1 ? `${line.itemName} × ${qty}` : line.itemName!);
  }

  if (total <= 0 || descriptions.length === 0) {
    logger.debug({ requestId: request.id }, "Folio: multi food order has no priced lines");
    return;
  }

  const chargeDate = chargeDateFromRequest(new Date(request.createdAt));
  await upsertFolioEntry({
    guestId: request.guestId,
    hotelId: request.hotelId,
    serviceRequestId: request.id,
    chargeDate,
    category,
    description: descriptions.join(", "),
    quantity: 1,
    unitAmount: formatAmount(total),
    lineTotal: formatAmount(total),
    currency,
  });
}

async function resolveMenuPrice(
  hotelId: number,
  menuItemId: number | null,
  itemName: string | null,
  category: string | null,
): Promise<{ unitAmount: number; currency: string; menuType: string | null } | null> {
  if (menuItemId) {
    const [row] = await db
      .select()
      .from(restaurantMenuItemsTable)
      .where(
        and(
          eq(restaurantMenuItemsTable.id, menuItemId),
          eq(restaurantMenuItemsTable.hotelId, hotelId),
          eq(restaurantMenuItemsTable.isActive, true),
        ),
      )
      .limit(1);
    if (row) {
      const amt = parseAmount(row.priceAmount);
      if (amt != null) return { unitAmount: amt, currency: row.currency, menuType: row.menuType };
    }
  }

  if (!itemName) return null;

  const nameConditions = [
    eq(restaurantMenuItemsTable.hotelId, hotelId),
    eq(restaurantMenuItemsTable.name, itemName),
    eq(restaurantMenuItemsTable.isActive, true),
  ];
  if (category) {
    nameConditions.push(eq(restaurantMenuItemsTable.category, category as never));
  }

  const [byName] = await db
    .select()
    .from(restaurantMenuItemsTable)
    .where(and(...nameConditions))
    .limit(1);

  if (byName) {
    const amt = parseAmount(byName.priceAmount);
    if (amt != null) return { unitAmount: amt, currency: byName.currency, menuType: byName.menuType };
  }

  return null;
}

function folioCategoryFromMenu(menuType: string | null): FolioCategory {
  if (menuType === "ROOM_SERVICE") return "ROOM_SERVICE";
  return "FOOD";
}

/**
 * Create or update a folio line for a billable service request (idempotent per request id).
 */
export async function syncFolioFromServiceRequest(request: ServiceRequest): Promise<void> {
  if (request.requestType === "FOOD_ORDER") {
    await syncFoodOrderFolio(request);
    return;
  }

  if (request.requestType === "SUPPORT_REQUEST") {
    await syncSupportFolio(request);
  }
}

async function syncFoodOrderFolio(request: ServiceRequest): Promise<void> {
  const raw = request.structuredData as Record<string, unknown> | null;
  const multiItems = parseFoodOrderLines(raw);

  if (multiItems.length > 0) {
    await syncMultiFoodOrderFolio(request, multiItems);
    return;
  }

  const data = foodStructuredData(raw);
  const qty = Math.max(1, data.quantity);
  const itemLabel =
    data.itemName ??
    (request.summary.replace(/^[^:]+:\s*/, "").trim() || "Food order");

  const price = await resolveMenuPrice(
    request.hotelId,
    data.menuItemId,
    data.itemName,
    data.category,
  );

  let unitAmount = parseAmount(data.unitPrice);
  let currency = data.currency;
  let category: FolioCategory = "FOOD";

  if (price) {
    unitAmount = price.unitAmount;
    currency = price.currency;
    category = folioCategoryFromMenu(price.menuType);
  }

  if (unitAmount == null) {
    logger.debug({ requestId: request.id }, "Folio: food order has no price — skipping charge");
    return;
  }

  const lineTotal = unitAmount * qty;
  const chargeDate = chargeDateFromRequest(new Date(request.createdAt));

  await upsertFolioEntry({
    guestId: request.guestId,
    hotelId: request.hotelId,
    serviceRequestId: request.id,
    chargeDate,
    category,
    description: qty > 1 ? `${itemLabel} × ${qty}` : itemLabel,
    quantity: qty,
    unitAmount: formatAmount(unitAmount),
    lineTotal: formatAmount(lineTotal),
    currency,
  });
}

async function syncSupportFolio(request: ServiceRequest): Promise<void> {
  const data = (request.structuredData ?? {}) as Record<string, unknown>;
  const issueKey = typeof data.issueTypeKey === "string" ? data.issueTypeKey : null;
  if (issueKey !== "MINIBAR_REFRESH") return;

  const unitAmount = parseAmount(MINIBAR_CHARGE_TRY);
  if (unitAmount == null || unitAmount <= 0) return;

  const chargeDate = chargeDateFromRequest(new Date(request.createdAt));
  const label =
    typeof data.issueTypeCustom === "string" && data.issueTypeCustom.trim()
      ? data.issueTypeCustom.trim()
      : "Minibar refresh";

  await upsertFolioEntry({
    guestId: request.guestId,
    hotelId: request.hotelId,
    serviceRequestId: request.id,
    chargeDate,
    category: "MINIBAR",
    description: label,
    quantity: 1,
    unitAmount: formatAmount(unitAmount),
    lineTotal: formatAmount(unitAmount),
    currency: "TRY",
  });
}

async function upsertFolioEntry(values: {
  guestId: number;
  hotelId: number;
  serviceRequestId: number;
  chargeDate: string;
  category: FolioCategory;
  description: string;
  quantity: number;
  unitAmount: string;
  lineTotal: string;
  currency: string;
}): Promise<void> {
  const [existing] = await db
    .select({ id: guestFolioEntriesTable.id })
    .from(guestFolioEntriesTable)
    .where(eq(guestFolioEntriesTable.serviceRequestId, values.serviceRequestId))
    .limit(1);

  if (existing) {
    await db
      .update(guestFolioEntriesTable)
      .set({
        chargeDate: values.chargeDate,
        category: values.category,
        description: values.description,
        quantity: values.quantity,
        unitAmount: values.unitAmount,
        lineTotal: values.lineTotal,
        currency: values.currency,
      })
      .where(eq(guestFolioEntriesTable.id, existing.id));
    return;
  }

  await db.insert(guestFolioEntriesTable).values(values);
  logger.info(
    { guestId: values.guestId, requestId: values.serviceRequestId, lineTotal: values.lineTotal },
    "Folio entry created",
  );
}

/** Backfill folio lines from food/minibar requests that predate folio sync. */
export async function backfillFolioForGuestOnDate(guestId: number, date: string): Promise<void> {
  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const dayEnd = new Date(`${date}T23:59:59.999Z`);

  const requests = await db
    .select()
    .from(serviceRequestsTable)
    .where(
      and(
        eq(serviceRequestsTable.guestId, guestId),
        gte(serviceRequestsTable.createdAt, dayStart),
        lte(serviceRequestsTable.createdAt, dayEnd),
      ),
    );

  for (const req of requests) {
    if (req.requestType !== "FOOD_ORDER" && req.requestType !== "SUPPORT_REQUEST") continue;

    const [existing] = await db
      .select({ id: guestFolioEntriesTable.id })
      .from(guestFolioEntriesTable)
      .where(eq(guestFolioEntriesTable.serviceRequestId, req.id))
      .limit(1);

    if (!existing) {
      await syncFolioFromServiceRequest(req);
    }
  }
}

function mapLine(row: typeof guestFolioEntriesTable.$inferSelect): FolioLineDto {
  return {
    id: row.id,
    description: row.description,
    category: row.category,
    quantity: row.quantity,
    unitAmount: String(row.unitAmount),
    lineTotal: String(row.lineTotal),
    currency: row.currency,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getDailyBillForGuest(
  guestId: number,
  date: string,
): Promise<DailyBillDto> {
  await backfillFolioForGuestOnDate(guestId, date);

  const lines = await db
    .select()
    .from(guestFolioEntriesTable)
    .where(
      and(eq(guestFolioEntriesTable.guestId, guestId), eq(guestFolioEntriesTable.chargeDate, date)),
    )
    .orderBy(desc(guestFolioEntriesTable.createdAt));

  const mapped = lines.map(mapLine);
  const subtotal = lines.reduce((sum, row) => sum + parseFloat(String(row.lineTotal)), 0);
  const currency = lines[0]?.currency ?? "TRY";

  return {
    date,
    currency,
    subtotal: formatAmount(subtotal),
    itemCount: mapped.length,
    lines: mapped,
  };
}

export async function listFolioDaySummaries(
  guestId: number,
  days = 14,
): Promise<FolioDaySummaryDto[]> {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - (days - 1));
  const sinceStr = since.toISOString().slice(0, 10);

  const rows = await db
    .select({
      chargeDate: guestFolioEntriesTable.chargeDate,
      currency: guestFolioEntriesTable.currency,
      subtotal: sql<string>`sum(${guestFolioEntriesTable.lineTotal})::text`,
      itemCount: sql<number>`count(*)::int`,
    })
    .from(guestFolioEntriesTable)
    .where(
      and(
        eq(guestFolioEntriesTable.guestId, guestId),
        gte(guestFolioEntriesTable.chargeDate, sinceStr),
      ),
    )
    .groupBy(guestFolioEntriesTable.chargeDate, guestFolioEntriesTable.currency)
    .orderBy(desc(guestFolioEntriesTable.chargeDate));

  return rows.map((r) => ({
    date: String(r.chargeDate),
    currency: r.currency,
    subtotal: formatAmount(parseFloat(r.subtotal) || 0),
    itemCount: r.itemCount,
  }));
}
