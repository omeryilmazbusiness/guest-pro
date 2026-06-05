import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  decodeSessionClaims,
  shouldRefreshSessionToken,
  isSessionTokenExpired,
} from "./session-token";

function makeToken(payload: Record<string, unknown>): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64");
  return `${body}.deadbeef`;
}

describe("session-token", () => {
  it("decodes exp from token payload", () => {
    const exp = Date.now() + 60_000;
    const claims = decodeSessionClaims(makeToken({ exp, role: "guest" }));
    assert.equal(claims?.exp, exp);
    assert.equal(claims?.role, "guest");
  });

  it("requests refresh when exp is within lead window", () => {
    const soon = Date.now() + 60_000;
    assert.equal(shouldRefreshSessionToken(makeToken({ exp: soon })), true);
    const later = Date.now() + 30 * 24 * 60 * 60 * 1000;
    assert.equal(shouldRefreshSessionToken(makeToken({ exp: later })), false);
  });

  it("detects expired tokens", () => {
    const past = Date.now() - 60_000;
    assert.equal(isSessionTokenExpired(makeToken({ exp: past })), true);
    const future = Date.now() + 60_000;
    assert.equal(isSessionTokenExpired(makeToken({ exp: future })), false);
  });
});
