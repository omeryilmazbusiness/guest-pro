import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildLiveChatAutoDetectTranslationPrompt,
  buildLiveChatTranslationPrompt,
  GUEST_UI_TRANSLATION_LANGS,
  hasPendingGuestTranslation,
  hasPendingStaffTranslation,
  isGuestMessageReadyForStaff,
  isStaffMessageReadyForGuest,
  isTranslationCached,
  langBase,
  resolveLanguageName,
  resolveTranslationTargetLang,
} from "./live-chat-translate-lang";

describe("live-chat-translate-lang", () => {
  it("resolves language names for prompts", () => {
    assert.equal(resolveLanguageName("tr"), "Turkish");
    assert.equal(resolveLanguageName("en-US"), "English");
  });

  it("normalizes locale base codes", () => {
    assert.equal(langBase("de-DE"), "de");
    assert.equal(langBase(""), "");
  });

  it("resolves all guest UI locales for translation", () => {
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
    for (const code of GUEST_UI_TRANSLATION_LANGS) {
      assert.equal(resolveTranslationTargetLang(code), code);
    }
  });

  it("resolves translation targets from UI locales", () => {
    assert.equal(resolveTranslationTargetLang("fr"), "fr");
    assert.equal(resolveTranslationTargetLang("xx"), "en");
    assert.equal(resolveTranslationTargetLang(null, "tr"), "tr");
  });

  it("detects cached translations by target language", () => {
    assert.equal(
      isTranslationCached(
        { translatedContent: "Merhaba", translatedForLang: "tr" },
        "tr",
      ),
      true,
    );
    assert.equal(
      isTranslationCached(
        { translatedContent: "Merhaba", translatedForLang: "tr" },
        "en",
      ),
      false,
    );
    assert.equal(
      isTranslationCached({ translatedContent: "", translatedForLang: "tr" }, "tr"),
      false,
    );
  });

  it("builds C2 hospitality translation prompt with explicit source", () => {
    const prompt = buildLiveChatTranslationPrompt("Hello", "en", "tr");
    assert.match(prompt, /C2/i);
    assert.match(prompt, /Turkish/i);
    assert.match(prompt, /five-star hotel/i);
  });

  it("builds auto-detect translation prompt for any source language", () => {
    const prompt = buildLiveChatAutoDetectTranslationPrompt(
      "Bonjour, j'ai besoin d'aide",
      "tr",
    );
    assert.match(prompt, /Detect the source language/i);
    assert.match(prompt, /Turkish/i);
    assert.match(prompt, /already entirely in Turkish/i);
  });

  it("invalidates cache when UI language changes", () => {
    const msgEn = {
      translatedContent: "I need towels",
      translatedForLang: "en",
    };
    assert.equal(isTranslationCached(msgEn, "en"), true);
    assert.equal(isTranslationCached(msgEn, "tr"), false);
    assert.equal(isTranslationCached(msgEn, "ar"), false);

    const msgTr = {
      translatedContent: "Yardımcı olabilir miyim?",
      translatedForLang: "tr",
    };
    assert.equal(isTranslationCached(msgTr, "de"), false);
    assert.equal(isTranslationCached(msgTr, "tr"), true);
  });
});

describe("live-chat guest visibility", () => {
  it("hides staff messages until translated for guest UI locale", () => {
    const pendingStaff = {
      senderRole: "staff" as const,
      translatedContent: null,
      translatedForLang: null,
    };
    const readyStaff = {
      senderRole: "staff" as const,
      translatedContent: "Merhaba",
      translatedForLang: "tr",
    };
    const guestMsg = {
      senderRole: "guest" as const,
      translatedContent: null,
      translatedForLang: null,
    };

    assert.equal(isStaffMessageReadyForGuest(pendingStaff, "tr"), false);
    assert.equal(isStaffMessageReadyForGuest(readyStaff, "tr"), true);
    assert.equal(isStaffMessageReadyForGuest(guestMsg, "tr"), true);
    assert.equal(hasPendingStaffTranslation([pendingStaff, guestMsg], "tr"), true);
    assert.equal(hasPendingStaffTranslation([readyStaff, guestMsg], "tr"), false);
  });
});

describe("live-chat staff visibility", () => {
  it("hides guest text until translated for staff UI locale", () => {
    const pendingGuest = {
      senderRole: "guest" as const,
      messageType: "text" as const,
      translatedContent: null,
      translatedForLang: null,
    };
    const readyGuest = {
      senderRole: "guest" as const,
      messageType: "text" as const,
      translatedContent: "I need help",
      translatedForLang: "en",
    };
    const locationGuest = {
      senderRole: "guest" as const,
      messageType: "location" as const,
      translatedContent: null,
      translatedForLang: null,
    };

    assert.equal(isGuestMessageReadyForStaff(pendingGuest, "tr"), false);
    assert.equal(isGuestMessageReadyForStaff(readyGuest, "en"), true);
    assert.equal(isGuestMessageReadyForStaff(locationGuest, "tr"), true);
    assert.equal(hasPendingGuestTranslation([pendingGuest], "tr"), true);
    assert.equal(hasPendingGuestTranslation([readyGuest], "en"), false);
  });
});
