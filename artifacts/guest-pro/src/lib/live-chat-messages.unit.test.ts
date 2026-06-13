import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  appendLiveChatMessage,
  mergeLiveChatMessages,
} from "./live-chat-messages";
import type { LiveChatMessage } from "./live-chat-api";

function msg(id: number, createdAt: string): LiveChatMessage {
  return {
    id,
    sessionId: 1,
    senderRole: "guest",
    content: `m${id}`,
    readByStaffAt: null,
    readByGuestAt: null,
    createdAt,
  };
}

describe("live-chat-messages", () => {
  it("merges by id without duplicates", () => {
    const a = msg(1, "2026-01-01T10:00:00Z");
    const b = msg(2, "2026-01-01T10:01:00Z");
    const bUpdated = { ...b, content: "updated" };
    const merged = mergeLiveChatMessages([a, b], [bUpdated, msg(3, "2026-01-01T10:02:00Z")]);
    assert.equal(merged.length, 3);
    assert.equal(merged.find((m) => m.id === 2)?.content, "updated");
  });

  it("append skips existing id", () => {
    const base = [msg(55, "2026-01-01T10:00:00Z")];
    const next = appendLiveChatMessage(base, msg(55, "2026-01-01T10:01:00Z"));
    assert.equal(next.length, 1);
  });
});
