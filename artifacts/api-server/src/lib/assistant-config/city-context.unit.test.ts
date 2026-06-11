import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { findCountryForCity, resolveExploreCity } from "./city-context";
import type { HotelAssistantConfigDto } from "./types";

describe("city-context", () => {
  it("resolves country from stored countryCode", () => {
    const ctx = resolveExploreCity({
      cityName: "Custom Beach Town",
      countryCode: "AE",
    } as HotelAssistantConfigDto);
    assert.equal(ctx?.label, "Custom Beach Town, United Arab Emirates");
  });

  it("infers country from known city list", () => {
    assert.equal(findCountryForCity("Istanbul"), "TR");
    const ctx = resolveExploreCity({
      cityName: "Paris",
      countryCode: null,
    } as HotelAssistantConfigDto);
    assert.equal(ctx?.countryCode, "FR");
    assert.match(ctx?.label ?? "", /Paris, France/);
  });
});
