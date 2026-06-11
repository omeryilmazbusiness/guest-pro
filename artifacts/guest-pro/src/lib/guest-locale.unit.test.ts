import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  GUEST_LANGUAGE_OPTIONS,
  guestDirFromUi,
  guestVoiceLocaleFromUi,
  isGuestUiLocale,
  normalizeGuestUiLocale,
} from "./guest-locale";

describe("guest-locale", () => {
  it("exposes ten selectable guest languages", () => {
    assert.equal(GUEST_LANGUAGE_OPTIONS.length, 10);
    assert.deepEqual(
      GUEST_LANGUAGE_OPTIONS.map((o) => o.code),
      ["tr", "en", "ar", "ru", "fr", "it", "ur", "fa", "he", "ku"],
    );
  });

  it("maps ui locale to voice locale", () => {
    assert.equal(guestVoiceLocaleFromUi("tr"), "tr-TR");
    assert.equal(guestVoiceLocaleFromUi("ar"), "ar-SA");
    assert.equal(guestVoiceLocaleFromUi("fr"), "fr-FR");
    assert.equal(guestVoiceLocaleFromUi("ur"), "ur-PK");
  });

  it("normalizes supported and unsupported locales", () => {
    assert.equal(normalizeGuestUiLocale("de"), "en");
    assert.equal(normalizeGuestUiLocale("fr-FR"), "fr");
    assert.equal(normalizeGuestUiLocale("tr-TR"), "tr");
    assert.equal(normalizeGuestUiLocale("fa-IR"), "fa");
  });

  it("validates guest ui locales", () => {
    assert.equal(isGuestUiLocale("ru"), true);
    assert.equal(isGuestUiLocale("he"), true);
    assert.equal(isGuestUiLocale("ja"), false);
  });

  it("marks RTL locales correctly", () => {
    assert.equal(guestDirFromUi("ar"), "rtl");
    assert.equal(guestDirFromUi("ur"), "rtl");
    assert.equal(guestDirFromUi("he"), "rtl");
    assert.equal(guestDirFromUi("fr"), "ltr");
  });
});
