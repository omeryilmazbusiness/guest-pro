import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getLiveChatWelcomeMessage,
  isStaffTyping,
  resolveGuestLanguage,
  staffTypingExpiry,
} from "./live-chat-welcome";

describe("live-chat-welcome", () => {
  it("returns Turkish welcome for tr locale", () => {
    const msg = getLiveChatWelcomeMessage("tr-TR");
    assert.match(msg, /resepsiyon/i);
  });

  it("falls back to English for unknown locale", () => {
    const msg = getLiveChatWelcomeMessage("xx");
    assert.match(msg, /reception/i);
  });

  it("detects staff typing window", () => {
    assert.equal(isStaffTyping(staffTypingExpiry()), true);
    assert.equal(isStaffTyping(null), false);
  });

  it("resolves guest language base code", () => {
    assert.equal(resolveGuestLanguage("de-DE"), "de");
    assert.equal(resolveGuestLanguage(null), "en");
  });
});
