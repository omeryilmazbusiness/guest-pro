import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { countLiveChatUnread } from "../hooks/use-live-chat-inbox";
import type { LiveChatInboxItem } from "../lib/live-chat-api";

function item(overrides: Partial<LiveChatInboxItem> = {}): LiveChatInboxItem {
  return {
    sessionId: 1,
    guestId: 1,
    roomNumber: "101",
    guestFirstName: "Ada",
    guestLastName: null,
    guestLanguage: "en",
    guestUiLocale: "en",
    lastMessageAt: "2026-06-13T12:00:00.000Z",
    lastMessagePreview: "Hello",
    hasUnread: false,
    staffTyping: false,
    emergencyAt: null,
    emergencyAcknowledged: false,
    ...overrides,
  };
}

describe("countLiveChatUnread", () => {
  it("counts only sessions with hasUnread", () => {
    assert.equal(
      countLiveChatUnread([
        item({ sessionId: 1, hasUnread: true }),
        item({ sessionId: 2, hasUnread: false }),
        item({ sessionId: 3, hasUnread: true }),
      ]),
      2,
    );
  });

  it("returns 0 for empty or undefined inbox", () => {
    assert.equal(countLiveChatUnread([]), 0);
    assert.equal(countLiveChatUnread(undefined), 0);
  });
});
