import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PlatformLoginLockoutService } from "./platform-login-lockout";

describe("platform-login-lockout", () => {
  it("locks after repeated password failures", async () => {
    const svc = new PlatformLoginLockoutService();
    const email = `lock-test-${Date.now()}@example.com`;

    for (let i = 0; i < 7; i++) {
      const status = await svc.recordFailure(email);
      assert.equal(status.allowed, true, `failure ${i + 1} should not lock yet`);
    }

    const locked = await svc.recordFailure(email);
    assert.equal(locked.allowed, false);
    assert.ok(locked.retryAfterMs && locked.retryAfterMs > 0);

    const blocked = await svc.check(email);
    assert.equal(blocked.allowed, false);
  });

  it("clears lockout so valid password step can proceed", async () => {
    const svc = new PlatformLoginLockoutService();
    const email = `clear-test-${Date.now()}@example.com`;

    for (let i = 0; i < 8; i++) {
      await svc.recordFailure(email);
    }
    assert.equal((await svc.check(email)).allowed, false);

    await svc.clear(email);
    assert.equal((await svc.check(email)).allowed, true);
  });
});
