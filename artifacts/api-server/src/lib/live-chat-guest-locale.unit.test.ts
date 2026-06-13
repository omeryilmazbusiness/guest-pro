import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  GUEST_UI_TRANSLATION_LANGS,
  resolveGuestUiLocaleForSession,
} from "./live-chat-guest-locale";

describe("live-chat-guest-locale", () => {
  it("covers every guest-screen UI locale", () => {
    const expected = [
      "en",
      "tr",
      "ar",
      "ru",
      "de",
      "fr",
      "es",
      "it",
      "ur",
      "fa",
      "he",
      "ku",
    ];
    assert.deepEqual([...GUEST_UI_TRANSLATION_LANGS], expected);
  });

  it("prefers live session locale over stale hints", () => {
    assert.equal(
      resolveGuestUiLocaleForSession(
        { lastGuestUiLocale: "ru" },
        "en",
        "tr-TR",
      ),
      "ru",
    );
  });

  it("normalizes voice locale hints", () => {
    assert.equal(
      resolveGuestUiLocaleForSession({}, "fr-FR", "en-US"),
      "fr",
    );
  });

  it("falls back to guest profile language", () => {
    assert.equal(
      resolveGuestUiLocaleForSession({}, undefined, "ar-SA"),
      "ar",
    );
  });
});
