/**
 * Guest food order domain — selection state, summary & API payload builders.
 */

import type { GuestMenuItem } from "@/hooks/use-guest-menu";
import type { GuestTranslations } from "@/lib/i18n";

export const FOOD_ORDER_ALL_CATEGORY = "ALL" as const;
export type FoodCategoryFilter = typeof FOOD_ORDER_ALL_CATEGORY | string;

export interface FoodOrderLineSelection {
  menuItemId: number;
  itemName: string;
  category: string;
  quantity: number;
  note: string;
  unitPrice: string | null;
  currency: string;
  menuType: "DAILY" | "ROOM_SERVICE";
}

export interface FoodOrderLineDraft {
  quantity: number;
  note: string;
}

export function createLineSelection(
  item: GuestMenuItem,
  draft: FoodOrderLineDraft,
): FoodOrderLineSelection {
  return {
    menuItemId: item.id,
    itemName: item.name,
    category: item.category,
    quantity: Math.max(1, Math.min(99, draft.quantity || 1)),
    note: draft.note.trim(),
    unitPrice: item.priceAmount,
    currency: item.currency,
    menuType: item.menuType,
  };
}

export function formatMenuPrice(amount: string | null, currency: string): string | null {
  if (amount == null) return null;
  const sym = currency === "TRY" ? "₺" : currency === "USD" ? "$" : currency === "EUR" ? "€" : `${currency} `;
  return `${sym}${amount}`;
}

export function buildFoodOrderSummary(
  lines: FoodOrderLineSelection[],
  t: GuestTranslations,
): string {
  if (lines.length === 0) return t.flowFoodLabel;

  const parts = lines.map((line) => {
    const qty = line.quantity > 1 ? `${line.quantity}× ` : "";
    const note = line.note ? ` (${line.note})` : "";
    return `${qty}${line.itemName}${note}`;
  });

  return `${t.flowFoodLabel}: ${parts.join(", ")}`;
}

export function buildFoodOrderStructuredData(lines: FoodOrderLineSelection[]) {
  const first = lines[0];
  return {
    originalLanguage: navigator.language,
    version: 2 as const,
    items: lines.map((line) => ({
      menuItemId: line.menuItemId,
      itemName: line.itemName,
      category: line.category,
      quantity: line.quantity,
      note: line.note || null,
      unitPrice: line.unitPrice,
      priceAmount: line.unitPrice,
      currency: line.currency,
      menuType: line.menuType,
    })),
    // Legacy single-item fields for downstream consumers
    menuItemId: first?.menuItemId ?? null,
    itemName: first?.itemName ?? null,
    item: first?.itemName ?? null,
    category: first?.category ?? null,
    quantity: lines.reduce((sum, l) => sum + l.quantity, 0),
    unitPrice: first?.unitPrice ?? null,
    priceAmount: first?.unitPrice ?? null,
    currency: first?.currency ?? "TRY",
    menuType: first?.menuType ?? null,
    note: lines.length === 1 ? lines[0]!.note || null : null,
  };
}

export function categorySectionId(categoryKey: string): string {
  return `food-section-${categoryKey}`;
}
