import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  GUEST_LANGUAGE_OPTIONS,
  guestVoiceLocaleFromUi,
  isGuestUiLocale,
  normalizeGuestUiLocale,
} from "./guest-locale";

describe("guest-locale", () => {
  it("exposes exactly four selectable languages", () => {
    assert.equal(GUEST_LANGUAGE_OPTIONS.length, 4);
    assert.deepEqual(
      GUEST_LANGUAGE_OPTIONS.map((o) => o.code),
      ["tr", "en", "ar", "ru"],
    );
  });

  it("maps ui locale to voice locale", () => {
    assert.equal(guestVoiceLocaleFromUi("tr"), "tr-TR");
    assert.equal(guestVoiceLocaleFromUi("ar"), "ar-SA");
  });

  it("normalizes unknown locales to English", () => {
    assert.equal(normalizeGuestUiLocale("de"), "en");
    assert.equal(normalizeGuestUiLocale("fr-FR"), "en");
    assert.equal(normalizeGuestUiLocale("tr-TR"), "tr");
  });

  it("validates guest ui locales", () => {
    assert.equal(isGuestUiLocale("ru"), true);
    assert.equal(isGuestUiLocale("ja"), false);
  });
});
