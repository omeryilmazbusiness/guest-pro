import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { en } from "@/lib/i18n/locales/en";
import { pickPostcardNote } from "@/lib/roadmap-postcard-notes";
import type { ChatRoadmap } from "@/lib/chat-roadmap";

const baseRoadmap: ChatRoadmap = {
  title: "Istanbul Icons",
  city: "Istanbul, Turkey",
  summary: "Half-day tour",
  stops: [{ title: "Hagia Sophia", category: "landmark" }],
};

describe("pickPostcardNote", () => {
  it("prefers AI postcardNote when present", () => {
    const note = pickPostcardNote({ ...baseRoadmap, postcardNote: "Custom AI note" }, en);
    assert.equal(note, "Custom AI note");
  });

  it("picks a stable fallback from the pool", () => {
    const a = pickPostcardNote(baseRoadmap, en);
    const b = pickPostcardNote(baseRoadmap, en);
    assert.equal(a, b);
    assert.match(a, /Istanbul/);
  });
});
