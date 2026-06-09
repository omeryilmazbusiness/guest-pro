import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildFoodOrderStructuredData,
  buildFoodOrderSummary,
  createLineSelection,
} from "./guest-food-order";
import type { GuestMenuItem } from "@/hooks/use-guest-menu";

const mockItem: GuestMenuItem = {
  id: 1,
  name: "Burger",
  description: "Angus beef",
  category: "MAIN_COURSE",
  menuType: "DAILY",
  priceAmount: "120.00",
  currency: "TRY",
  allergenNotes: null,
  portionInfo: null,
  sortOrder: 0,
  imageUrl: null,
};

const mockT = {
  flowFoodLabel: "Room Service",
} as Parameters<typeof buildFoodOrderSummary>[1];

describe("guest-food-order", () => {
  it("builds multi-item summary", () => {
    const lines = [
      createLineSelection(mockItem, { quantity: 2, note: "no onion" }),
      createLineSelection({ ...mockItem, id: 2, name: "Cola" }, { quantity: 1, note: "" }),
    ];
    const summary = buildFoodOrderSummary(lines, mockT);
    assert.match(summary, /2× Burger \(no onion\)/);
    assert.match(summary, /Cola/);
  });

  it("builds structured data with items array", () => {
    const lines = [createLineSelection(mockItem, { quantity: 1, note: "" })];
    const data = buildFoodOrderStructuredData(lines);
    assert.equal(data.version, 2);
    assert.equal(Array.isArray(data.items), true);
    assert.equal(data.items.length, 1);
    assert.equal(data.menuItemId, 1);
  });
});
