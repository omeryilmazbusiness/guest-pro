import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatAssistantPromptBlock } from "./prompt-block";
import type { HotelAssistantConfigDto } from "./types";

function baseConfig(overrides: Partial<HotelAssistantConfigDto> = {}): HotelAssistantConfigDto {
  return {
    hotelId: 1,
    aboutHotel: "Beachfront resort with spa and pools.",
    cityName: "Istanbul",
    countryCode: "TR",
    amenities: [
      { id: "pool", enabled: true, openTime: "09:00", closeTime: "20:00" },
      { id: "spa", enabled: false },
    ],
    taxiLobbyPhone: "+90 212 000 00 00",
    taxiNotes: null,
    spaPhone: null,
    spaInfo: null,
    spaOpenTime: null,
    spaCloseTime: null,
    salonInfo: null,
    salonPhone: null,
    salonOpenTime: null,
    salonCloseTime: null,
    laundryInfo: null,
    laundryPhone: null,
    onboardingCompletedAt: null,
    ...overrides,
  };
}

describe("formatAssistantPromptBlock", () => {
  it("anchors roadmaps to GM city and country", () => {
    const block = formatAssistantPromptBlock(baseConfig(), "Grand Hotel");
    assert.match(block, /Explore base city: Istanbul, Turkey/);
    assert.match(block, /MUST be set in Istanbul, Turkey/);
    assert.match(block, /street_food/);
    assert.match(block, /hotel_pick/);
  });

  it("lists only enabled amenities", () => {
    const block = formatAssistantPromptBlock(baseConfig(), "Grand Hotel");
    assert.match(block, /Swimming pool/);
    assert.doesNotMatch(block, /Spa.*Enabled hotel facilities/s);
  });

  it("includes GM nearby picks for roadmaps", () => {
    const block = formatAssistantPromptBlock(baseConfig(), "Grand Hotel", {
      nearbyPlaces: [
        { name: "Spice Bazaar", type: "bazaar", description: "Historic market" },
      ],
    });
    assert.match(block, /Spice Bazaar/);
    assert.match(block, /GM nearby picks/);
  });

  it("warns when city is not configured", () => {
    const block = formatAssistantPromptBlock(
      baseConfig({ cityName: null, countryCode: null }),
      "Grand Hotel",
    );
    assert.match(block, /City not configured/);
  });
});
