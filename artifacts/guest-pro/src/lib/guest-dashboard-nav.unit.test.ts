import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildGuestDashboardNavItems, GUEST_SECTION_IDS } from "./guest-dashboard-nav";
import type { GuestTranslations } from "./i18n";

const t = {
  voiceLabel: "Voice",
  askSomethingLabel: "Ask",
  stayAboutTitle: "Stay",
  quickActionsSection: "Quick",
  myRequestsTitle: "Requests",
  billSection: "Bill",
  hotelConnectSection: "Hotel",
  infoSection: "Service",
} as Pick<
  GuestTranslations,
  | "voiceLabel"
  | "askSomethingLabel"
  | "stayAboutTitle"
  | "quickActionsSection"
  | "myRequestsTitle"
  | "billSection"
  | "hotelConnectSection"
  | "infoSection"
> as GuestTranslations;

describe("buildGuestDashboardNavItems", () => {
  it("includes all default sections when requests are visible", () => {
    const items = buildGuestDashboardNavItems({
      t,
      nearbyLabel: "Nearby",
      showRequests: true,
    });
    assert.equal(items.length, 9);
    assert.equal(items[0]?.sectionId, GUEST_SECTION_IDS.voice);
    assert.equal(items.find((i) => i.id === "nearby")?.label, "Nearby");
  });

  it("hides requests when not loaded", () => {
    const items = buildGuestDashboardNavItems({
      t,
      nearbyLabel: "Nearby",
      showRequests: false,
    });
    assert.equal(items.some((i) => i.id === "requests"), false);
    assert.equal(items.length, 8);
  });
});
