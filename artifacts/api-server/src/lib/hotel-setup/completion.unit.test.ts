import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ABOUT_HOTEL_MIN_CHARS, computeHotelSetupCompletion } from "./completion";
import type { HotelSetupContext } from "./types";

function ctx(overrides: Partial<HotelSetupContext> = {}): HotelSetupContext {
  return {
    aboutHotel: "",
    enabledAmenityCount: 0,
    wifiNetworkCount: 0,
    nearbyPlaceCount: 0,
    dismissed: false,
    ...overrides,
  };
}

describe("computeHotelSetupCompletion", () => {
  it("reaches 100% when all four steps are satisfied", () => {
    const result = computeHotelSetupCompletion(
      ctx({
        aboutHotel: "A".repeat(ABOUT_HOTEL_MIN_CHARS),
        enabledAmenityCount: 2,
        wifiNetworkCount: 1,
        nearbyPlaceCount: 3,
      }),
    );
    assert.equal(result.percent, 100);
    assert.equal(result.isComplete, true);
    assert.deepEqual(result.completedSteps, ["about", "services", "wifi", "nearby"]);
  });

  it("awards 25% per completed step", () => {
    const result = computeHotelSetupCompletion(ctx({ aboutHotel: "x".repeat(ABOUT_HOTEL_MIN_CHARS) }));
    assert.equal(result.percent, 25);
    assert.deepEqual(result.completedSteps, ["about"]);
  });

  it("does not count about below the minimum length", () => {
    const result = computeHotelSetupCompletion(
      ctx({ aboutHotel: "x".repeat(ABOUT_HOTEL_MIN_CHARS - 1) }),
    );
    assert.equal(result.percent, 0);
    assert.deepEqual(result.completedSteps, []);
  });
});
