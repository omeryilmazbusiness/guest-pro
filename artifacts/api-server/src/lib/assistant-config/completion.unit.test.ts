import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeAssistantCompletion } from "./completion";
import type { HotelAssistantConfigDto } from "./types";

function emptyConfig(overrides: Partial<HotelAssistantConfigDto> = {}): HotelAssistantConfigDto {
  return {
    hotelId: 1,
    aboutHotel: "",
    cityName: null,
    countryCode: null,
    amenities: [{ id: "pool", enabled: false }],
    taxiLobbyPhone: null,
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

describe("computeAssistantCompletion", () => {
  it("counts facilities when at least one amenity is enabled (no hours required)", () => {
    const result = computeAssistantCompletion(
      emptyConfig({
        amenities: [{ id: "pool", enabled: true }],
      }),
    );
    assert.ok(result.completedSteps.includes("facilities"));
  });

  it("does not count facilities when no amenity is enabled", () => {
    const result = computeAssistantCompletion(
      emptyConfig({
        amenities: [
          { id: "pool", enabled: false },
          { id: "spa", enabled: false },
        ],
      }),
    );
    assert.ok(result.pendingSteps.includes("facilities"));
  });
});
