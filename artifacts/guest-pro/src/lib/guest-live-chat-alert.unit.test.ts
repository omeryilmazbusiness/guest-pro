import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { shouldShowGuestLiveChatAlert } from "./guest-live-chat-alert";

describe("guest-live-chat-alert", () => {
  it("shows alert only for unacknowledged message ids", () => {
    assert.equal(shouldShowGuestLiveChatAlert(1, 42, 0), true);
    assert.equal(shouldShowGuestLiveChatAlert(1, 42, 42), false);
    assert.equal(shouldShowGuestLiveChatAlert(1, 50, 42), true);
    assert.equal(shouldShowGuestLiveChatAlert(0, 42, 0), false);
    assert.equal(shouldShowGuestLiveChatAlert(2, null, 0), false);
  });
});
