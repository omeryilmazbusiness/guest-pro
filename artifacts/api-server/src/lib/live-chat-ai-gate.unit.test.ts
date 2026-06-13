import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  canUseLiveChatAi,
  pauseLiveChatAi,
  resetLiveChatAiGate,
} from "./live-chat-ai-gate";

describe("live-chat-ai-gate", () => {
  beforeEach(() => {
    resetLiveChatAiGate();
  });

  it("blocks AI while hotel is paused", async () => {
    pauseLiveChatAi(99, 60_000);
    assert.equal(await canUseLiveChatAi(99), false);
  });
});
