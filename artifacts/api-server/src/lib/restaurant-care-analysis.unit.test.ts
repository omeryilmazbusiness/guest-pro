import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  RESTAURANT_CARE_INSIGHT_COUNT,
  buildFallbackCareInsights,
  buildRestaurantCarePrompt,
  dedupeCareProfilesByRoom,
  extractCareProfileText,
  formatCareProfileBlock,
  parseRestaurantCareInsights,
} from "./restaurant-care-analysis";

describe("restaurant-care-analysis", () => {
  const sampleProfile = {
    roomNumber: "101",
    guestName: "Ayşe Yılmaz",
    summary: "Care About Me: Laktoz intoleransım var, vegan tercih ediyorum",
    structuredData: {
      freetext: "Laktoz intoleransım var, süt ürünü kullanmayın",
      dietKey: "VEGAN",
      sleepKey: "LATE",
      comfortKey: "STANDARD",
      serviceKey: "MINIMAL_DISTURBANCE",
      originalLanguage: "tr-TR",
    },
  };

  it("extracts all care text fields including freetext and preferences", () => {
    const lines = extractCareProfileText(sampleProfile);
    assert.ok(lines.some((l) => l.includes("Laktoz intoleransım var")));
    assert.ok(lines.some((l) => l.includes("Vegan")));
    assert.ok(lines.some((l) => l.includes("Geç yatıyor")));
    assert.ok(lines.some((l) => l.includes("Minimum rahatsızlık")));
  });

  it("formats profile block with room and guest header", () => {
    const block = formatCareProfileBlock(sampleProfile);
    assert.match(block, /Oda 101 \(Ayşe Yılmaz\)/);
    assert.match(block, /Misafir notu:/);
  });

  it("dedupes profiles by room keeping the latest", () => {
    const profiles = dedupeCareProfilesByRoom([
      {
        roomNumber: "101",
        guestName: "Old",
        summary: "eski",
        structuredData: { freetext: "eski not" },
        createdAt: "2026-01-01T10:00:00Z",
      },
      {
        roomNumber: "101",
        guestName: "New",
        summary: "yeni",
        structuredData: { freetext: "yeni not" },
        createdAt: "2026-06-01T10:00:00Z",
      },
      {
        roomNumber: "202",
        guestName: "Other",
        summary: "diğer",
        structuredData: { freetext: "başka" },
        createdAt: "2026-06-01T10:00:00Z",
      },
    ]);
    assert.equal(profiles.length, 2);
    const room101 = profiles.find((p) => p.roomNumber === "101");
    assert.equal(room101?.guestName, "New");
    assert.equal(room101?.structuredData?.freetext, "yeni not");
  });

  it("builds prompt requesting exactly 3 kitchen rules", () => {
    const prompt = buildRestaurantCarePrompt([sampleProfile]);
    assert.match(prompt, /Tam 3 madde/);
    assert.match(prompt, /Laktoz intoleransım var/);
    assert.match(prompt, /JSON dizisi/);
  });

  it("parses valid JSON insight array", () => {
    const parsed = parseRestaurantCareInsights(
      '["Vegan yemeklerde süt ürünü kullanmayın.", "Ayrı kesme tahtası kullanın.", "Sipariş notlarını mutfağa iletin."]',
    );
    assert.equal(parsed?.length, RESTAURANT_CARE_INSIGHT_COUNT);
  });

  it("rejects arrays with wrong length", () => {
    assert.equal(parseRestaurantCareInsights('["one", "two"]'), null);
    assert.equal(parseRestaurantCareInsights('{"tips":["a","b","c"]}'), null);
  });

  it("builds fallback insights from diet keys", () => {
    const tips = buildFallbackCareInsights([
      {
        roomNumber: "101",
        guestName: "Test",
        summary: "",
        structuredData: { dietKey: "GLUTEN_FREE", freetext: "Buğday alerjim var" },
      },
    ]);
    assert.equal(tips.length, RESTAURANT_CARE_INSIGHT_COUNT);
    assert.ok(tips.some((t) => /gluten/i.test(t) || /alerji|not/i.test(t)));
  });
});
