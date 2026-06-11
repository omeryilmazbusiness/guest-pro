import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  validateAboutHotel,
  validateFacilities,
  validateNearbyRow,
  validateWifiRow,
  validateEnabledServiceFields,
} from "./setup-section-validation";

describe("setup-section-validation", () => {
  it("requires minimum about length", () => {
    assert.equal(validateAboutHotel("short"), false);
    assert.equal(validateAboutHotel("x".repeat(20)), true);
  });

  it("requires at least one facility", () => {
    assert.equal(validateFacilities([{ id: "pool", enabled: false }]), false);
    assert.equal(validateFacilities([{ id: "pool", enabled: true }]), true);
  });

  it("validates wifi rows", () => {
    assert.equal(validateWifiRow("", ""), "empty");
    assert.equal(validateWifiRow("Guest", "pass"), "complete");
    assert.equal(validateWifiRow("Guest", ""), "partial");
    assert.equal(validateWifiRow("", "pass"), "partial");
  });

  it("validates nearby rows", () => {
    assert.equal(validateNearbyRow("", "", "", "", ""), "empty");
    assert.equal(validateNearbyRow("Market", "", "", "", ""), "partial-coords");
    assert.equal(validateNearbyRow("", "41", "29", "", ""), "partial-name");
    assert.equal(validateNearbyRow("Market", "41.0", "29.0", "", ""), "complete");
    assert.equal(validateNearbyRow("Market", "bad", "coords", "", ""), "invalid-coords");
  });

  it("requires at least one enabled service field", () => {
    assert.equal(validateEnabledServiceFields(null, ""), false);
    assert.equal(validateEnabledServiceFields(null, "Lobby phone"), true);
  });
});
