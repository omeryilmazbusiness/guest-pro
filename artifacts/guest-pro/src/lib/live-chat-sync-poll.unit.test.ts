import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { nextPollDelayMs, LIVE_CHAT_POLL_BASE_MS, LIVE_CHAT_POLL_MAX_MS } from "./live-chat-sync-poll";

describe("live-chat-sync-poll", () => {
  it("resets delay after success", () => {
    assert.equal(nextPollDelayMs(12_000, false), LIVE_CHAT_POLL_BASE_MS);
  });

  it("backs off on failure up to max", () => {
    const first = nextPollDelayMs(LIVE_CHAT_POLL_BASE_MS, true);
    assert.ok(first > LIVE_CHAT_POLL_BASE_MS);
    const capped = nextPollDelayMs(LIVE_CHAT_POLL_MAX_MS, true);
    assert.equal(capped, LIVE_CHAT_POLL_MAX_MS);
  });
});
