/**
 * Guest + hotel context and live menu for AI concierge prompts.
 */

import { db, guestsTable, hotelsTable, hotelBrandingTable, restaurantMenuItemsTable } from "@workspace/db";
import { eq, and, asc } from "drizzle-orm";

export interface GuestChatContext {
  guestId: number;
  hotelId: number;
  firstName: string;
  lastName: string;
  roomNumber: string;
  countryCode: string;
  language: string;
  checkInDate: string | null;
  checkOutDate: string | null;
  hotelName: string;
  appName: string;
}

export async function loadGuestChatContext(guestId: number): Promise<GuestChatContext | null> {
  const [row] = await db
    .select({
      guest: guestsTable,
      hotel: hotelsTable,
      branding: hotelBrandingTable,
    })
    .from(guestsTable)
    .innerJoin(hotelsTable, eq(guestsTable.hotelId, hotelsTable.id))
    .leftJoin(hotelBrandingTable, eq(hotelBrandingTable.hotelId, hotelsTable.id))
    .where(eq(guestsTable.id, guestId))
    .limit(1);

  if (!row) return null;

  return {
    guestId: row.guest.id,
    hotelId: row.guest.hotelId,
    firstName: row.guest.firstName,
    lastName: row.guest.lastName,
    roomNumber: row.guest.roomNumber,
    countryCode: row.guest.countryCode,
    language: row.guest.language ?? "en-US",
    checkInDate: row.guest.checkInDate ?? null,
    checkOutDate: row.guest.checkOutDate ?? null,
    hotelName: row.hotel.name,
    appName: row.branding?.appName ?? row.hotel.name,
  };
}

const MENU_CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_MENU_ITEMS_IN_PROMPT = 24;
const menuPromptCache = new Map<string, { block: string; expiresAt: number }>();

export async function loadMenuPromptBlock(hotelId: number): Promise<string> {
  const today = new Date().toISOString().slice(0, 10);
  const cacheKey = `${hotelId}:${today}`;
  const cached = menuPromptCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.block;
  }

  const [daily, roomService] = await Promise.all([
    db
    .select({
      id: restaurantMenuItemsTable.id,
      name: restaurantMenuItemsTable.name,
      category: restaurantMenuItemsTable.category,
      priceAmount: restaurantMenuItemsTable.priceAmount,
      currency: restaurantMenuItemsTable.currency,
    })
    .from(restaurantMenuItemsTable)
    .where(
      and(
        eq(restaurantMenuItemsTable.hotelId, hotelId),
        eq(restaurantMenuItemsTable.isActive, true),
        eq(restaurantMenuItemsTable.menuType, "DAILY"),
        eq(restaurantMenuItemsTable.availableDate, today),
      ),
    )
      .orderBy(asc(restaurantMenuItemsTable.sortOrder), asc(restaurantMenuItemsTable.name)),
    db
      .select({
        id: restaurantMenuItemsTable.id,
        name: restaurantMenuItemsTable.name,
        category: restaurantMenuItemsTable.category,
        priceAmount: restaurantMenuItemsTable.priceAmount,
        currency: restaurantMenuItemsTable.currency,
      })
      .from(restaurantMenuItemsTable)
      .where(
        and(
          eq(restaurantMenuItemsTable.hotelId, hotelId),
          eq(restaurantMenuItemsTable.isActive, true),
          eq(restaurantMenuItemsTable.menuType, "ROOM_SERVICE"),
        ),
      )
      .orderBy(asc(restaurantMenuItemsTable.sortOrder), asc(restaurantMenuItemsTable.name)),
  ]);

  const allItems = [...daily, ...roomService];
  const items = allItems.slice(0, MAX_MENU_ITEMS_IN_PROMPT);
  let block: string;
  if (items.length === 0) {
    block =
      "LIVE MENU: No items published today. Offer to connect the guest with room service staff; do not invent dishes.";
  } else {
    const lines = items.map((item) => {
      const price =
        item.priceAmount != null ? ` — ${item.currency} ${item.priceAmount}` : "";
      return `- [id:${item.id}] ${item.name} (${item.category})${price}`;
    });
    const more =
      allItems.length > MAX_MENU_ITEMS_IN_PROMPT
        ? `\n(+${allItems.length - MAX_MENU_ITEMS_IN_PROMPT} more — ask staff for full menu)`
        : "";
    block = `LIVE MENU (only these items exist — never invent others):\n${lines.join("\n")}${more}`;
  }

  menuPromptCache.set(cacheKey, { block, expiresAt: Date.now() + MENU_CACHE_TTL_MS });
  return block;
}

export function formatGuestContextBlock(ctx: GuestChatContext): string {
  const stay =
    ctx.checkInDate && ctx.checkOutDate
      ? `${ctx.checkInDate} → ${ctx.checkOutDate}`
      : ctx.checkInDate
        ? `from ${ctx.checkInDate}`
        : "dates not set";

  return `GUEST CONTEXT:
- Name: ${ctx.firstName} ${ctx.lastName}
- Room: ${ctx.roomNumber} (never ask for room number)
- Hotel: ${ctx.hotelName}
- Stay: ${stay}
- Country: ${ctx.countryCode}
- Preferred language tag: ${ctx.language}`;
}
