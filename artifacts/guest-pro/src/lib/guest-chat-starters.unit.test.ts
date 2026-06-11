import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getTranslations } from "@/lib/i18n";
import { translations, type SupportedLocale } from "@/lib/i18n/locales";
import {
  GUEST_CHAT_STARTERS,
  resolveGuestChatStarters,
} from "./guest-chat-starters";

const LOCALES = Object.keys(translations) as SupportedLocale[];

describe("guest-chat-starters", () => {
  it("defines seven premium starter cards", () => {
    assert.equal(GUEST_CHAT_STARTERS.length, 7);
    const ids = GUEST_CHAT_STARTERS.map((s) => s.id);
    assert.deepEqual(ids, ["food", "trip", "explore", "spa", "support", "taxi", "hotel"]);
  });

  it("resolves localized title, hint, and prompt", () => {
    const tr = resolveGuestChatStarters(getTranslations("tr"));
    const food = tr.find((s) => s.id === "food");
    assert.ok(food);
    assert.match(food!.title, /servis/i);
    assert.ok(food!.prompt.length > 20);
    assert.equal(food!.mode, "food");
  });

  it("has starter strings in every supported locale", () => {
    for (const locale of LOCALES) {
      const t = translations[locale];
      const resolved = resolveGuestChatStarters(t);
      assert.equal(resolved.length, 7);
      for (const starter of resolved) {
        assert.ok(starter.title.trim(), `${locale} missing title for ${starter.id}`);
        assert.ok(starter.hint.trim(), `${locale} missing hint for ${starter.id}`);
        assert.ok(starter.prompt.trim(), `${locale} missing prompt for ${starter.id}`);
      }
    }
  });
});
