import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  IN_HOTEL_STATUSES,
  REMEMBER_ME_ACK_TIMEOUT_MS,
  isGuestInHotel,
  isRememberMeDue,
  secondsUntilEscalation,
  shouldEscalateRememberMe,
} from "./entry-track-logic";

describe("remember me entry-track logic", () => {
  it("marks schedule due at expected entry time", () => {
    const now = new Date("2026-06-13T15:00:00.000Z");
    const expected = new Date("2026-06-13T15:00:00.000Z");
    assert.equal(isRememberMeDue(expected, now), true);
  });

  it("does not mark schedule due before expected entry time", () => {
    const now = new Date("2026-06-13T14:59:00.000Z");
    const expected = new Date("2026-06-13T15:00:00.000Z");
    assert.equal(isRememberMeDue(expected, now), false);
  });

  it("escalates 30s after guest prompt", () => {
    const promptedAt = new Date("2026-06-13T15:00:00.000Z");
    const before = new Date(promptedAt.getTime() + REMEMBER_ME_ACK_TIMEOUT_MS - 1);
    const after = new Date(promptedAt.getTime() + REMEMBER_ME_ACK_TIMEOUT_MS);
    assert.equal(shouldEscalateRememberMe(promptedAt, before), false);
    assert.equal(shouldEscalateRememberMe(promptedAt, after), true);
  });

  it("counts down seconds until escalation", () => {
    const promptedAt = new Date("2026-06-13T15:00:00.000Z");
    const now = new Date(promptedAt.getTime() + 10_000);
    assert.equal(secondsUntilEscalation(promptedAt, now), 20);
  });

  it("cancels when guest is in hotel", () => {
    assert.equal(isGuestInHotel("IN_HOTEL_AND_ON_WIFI"), true);
    assert.equal(isGuestInHotel("OUTSIDE_HOTEL"), false);
    assert.equal(isGuestInHotel(undefined), false);
    assert.equal(IN_HOTEL_STATUSES.has("IN_HOTEL_NOT_ON_WIFI"), true);
  });
});
