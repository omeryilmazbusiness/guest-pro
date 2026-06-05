import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  PERSISTENT_SESSION_TTL_MS,
  PLATFORM_ADMIN_SESSION_TTL_MS,
  TOKEN_REFRESH_GRACE_MS,
  TOKEN_REFRESH_LEAD_MS,
  isPersistentSessionRole,
  sessionTtlForRole,
  tokenExpiresWithin,
  tokenWithinRefreshGrace,
} from "./session-policy";

describe("session-policy", () => {
  it("marks guest and staff as persistent roles", () => {
    assert.equal(isPersistentSessionRole("guest"), true);
    assert.equal(isPersistentSessionRole("manager"), true);
    assert.equal(isPersistentSessionRole("personnel"), true);
    assert.equal(isPersistentSessionRole("platform_admin"), false);
  });

  it("assigns long TTL to guest and staff", () => {
    assert.equal(sessionTtlForRole("guest"), PERSISTENT_SESSION_TTL_MS);
    assert.equal(sessionTtlForRole("manager"), PERSISTENT_SESSION_TTL_MS);
    assert.equal(sessionTtlForRole("personnel"), PERSISTENT_SESSION_TTL_MS);
    assert.equal(sessionTtlForRole("platform_admin"), PLATFORM_ADMIN_SESSION_TTL_MS);
  });

  it("detects refresh lead window", () => {
    const exp = Date.now() + TOKEN_REFRESH_LEAD_MS - 60_000;
    assert.equal(tokenExpiresWithin(exp, TOKEN_REFRESH_LEAD_MS), true);
    const far = Date.now() + TOKEN_REFRESH_LEAD_MS + 60_000;
    assert.equal(tokenExpiresWithin(far, TOKEN_REFRESH_LEAD_MS), false);
  });

  it("allows refresh within grace after expiry", () => {
    const expiredRecently = Date.now() - TOKEN_REFRESH_GRACE_MS + 60_000;
    assert.equal(tokenWithinRefreshGrace(expiredRecently), true);
    const expiredLongAgo = Date.now() - TOKEN_REFRESH_GRACE_MS - 60_000;
    assert.equal(tokenWithinRefreshGrace(expiredLongAgo), false);
  });
});
