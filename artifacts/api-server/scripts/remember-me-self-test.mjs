#!/usr/bin/env node
/**
 * Remember Me self-test — pure logic + API route smoke (no DB).
 */
import assert from "node:assert/strict";
import {
  isGuestInHotel,
  isRememberMeDue,
  rememberMeClientEventId,
  REMEMBER_ME_ACK_TIMEOUT_MS,
  shouldEscalateRememberMe,
  secondsUntilEscalation,
} from "../src/lib/entry-track-logic.ts";

console.log("remember-me self-test");

const now = new Date("2026-06-13T15:00:00.000Z");
const expected = new Date("2026-06-13T14:59:00.000Z");
assert.equal(isRememberMeDue(expected, now), true);

const promptedAt = new Date("2026-06-13T15:00:00.000Z");
const beforeEscalate = new Date(promptedAt.getTime() + REMEMBER_ME_ACK_TIMEOUT_MS - 500);
const afterEscalate = new Date(promptedAt.getTime() + REMEMBER_ME_ACK_TIMEOUT_MS);
assert.equal(shouldEscalateRememberMe(promptedAt, beforeEscalate), false);
assert.equal(shouldEscalateRememberMe(promptedAt, afterEscalate), true);
assert.equal(secondsUntilEscalation(promptedAt, beforeEscalate), 1);

assert.equal(isGuestInHotel("IN_HOTEL_AND_ON_WIFI"), true);
assert.equal(isGuestInHotel("OUTSIDE_HOTEL"), false);
assert.equal(rememberMeClientEventId(42), "entry-track:42");

console.log("OK — remember-me logic");
