import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { ElevenLabsQuotaStore, resetElevenLabsQuotaMemoryForTests } from "./quota-store";

describe("ElevenLabsQuotaStore (memory fallback)", () => {
  beforeEach(() => {
    resetElevenLabsQuotaMemoryForTests();
  });

  it("allows usage within monthly limit", async () => {
    const store = new ElevenLabsQuotaStore(100);
    assert.equal(await store.tryConsume(40), true);
    assert.equal(await store.tryConsume(50), true);
    assert.equal(await store.tryConsume(20), false);
    const snap = await store.getSnapshot();
    assert.equal(snap.used, 90);
    assert.equal(snap.remaining, 10);
  });

  it("releases quota on provider failure rollback", async () => {
    const store = new ElevenLabsQuotaStore(100);
    await store.tryConsume(30);
    await store.release(30);
    const snap = await store.getSnapshot();
    assert.equal(snap.used, 0);
    assert.equal(snap.remaining, 100);
  });
});
