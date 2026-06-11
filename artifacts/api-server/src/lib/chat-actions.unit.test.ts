/**
 * Chat action parsing tests.
 * Run: pnpm test (from artifacts/api-server)
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isRoadmapRequest, parseAiResponse, stripActionMarkup } from "./chat-action-parse";

describe("stripActionMarkup", () => {
  it("removes complete ACTION blocks", () => {
    const raw =
      'Here are three ideas.\n<ACTION>{"intent":"activity","phase":"propose"}</ACTION>';
    assert.equal(stripActionMarkup(raw), "Here are three ideas.");
  });

  it("removes unclosed ACTION blocks (truncated model output)", () => {
    const raw =
      '<ACTION>{"intent":"activity","phase":"propose","requestType":null,"structuredData":';
    assert.equal(stripActionMarkup(raw), "");
  });
});

describe("isRoadmapRequest", () => {
  it("detects explore and trip starters", () => {
    assert.equal(
      isRoadmapRequest(
        "Create a city roadmap: famous sights, must-try local flavors. Output the full structured ROADMAP.",
      ),
      true,
    );
    assert.equal(isRoadmapRequest("Şehrin ünlü yerlerini içeren gezi yol haritası oluştur."), true);
    assert.equal(isRoadmapRequest("I need extra towels please"), false);
  });
});

describe("parseAiResponse", () => {
  it("drops activity propose with null requestType", () => {
    const raw = `Try the spa or rooftop bar.
<ACTION>{"intent":"activity","phase":"propose","requestType":null,"summary":"bored","urgency":"normal","structuredData":{}}</ACTION>`;
    const { guestText, action, replyOptions } = parseAiResponse(raw);
    assert.equal(action, null);
    assert.match(guestText, /spa|rooftop/i);
    assert.doesNotMatch(guestText, /<ACTION>/i);
    assert.equal(replyOptions.length, 0);
  });

  it("parses OPTIONS tag into replyOptions", () => {
    const raw = `I can help right away.
<OPTIONS>["Room service","Spa","Pool bar"]</OPTIONS>`;
    const { guestText, replyOptions } = parseAiResponse(raw);
    assert.deepEqual(replyOptions, ["Room service", "Spa", "Pool bar"]);
    assert.doesNotMatch(guestText, /<OPTIONS>/i);
  });

  it("keeps valid FOOD_ORDER propose", () => {
    const raw = `Shall I send 2 waters to your room?
<ACTION>{"intent":"food","phase":"propose","requestType":"FOOD_ORDER","summary":"2x water","urgency":"normal","structuredData":{"itemName":"Water","quantity":2}}</ACTION>`;
    const { guestText, action } = parseAiResponse(raw);
    assert.equal(action?.requestType, "FOOD_ORDER");
    assert.equal(action?.phase, "propose");
    assert.match(guestText, /water/i);
  });

  it("recovers guest text when only malformed ACTION was returned", () => {
    const raw =
      '<ACTION>{"intent":"activity","phase":"propose","requestType":null,"summary":"offered activity","urgency":"normal","structuredData":';
    const { guestText, action } = parseAiResponse(raw);
    assert.equal(action, null);
    assert.ok(guestText.length > 0);
    assert.doesNotMatch(guestText, /<ACTION>/i);
  });

  it("extracts numbered lines as options when OPTIONS tag missing", () => {
    const raw = `Pick one:\n1. Spa\n2. Restaurant\n3. Walk`;
    const { replyOptions } = parseAiResponse(raw);
    assert.deepEqual(replyOptions, ["Spa", "Restaurant", "Walk"]);
  });

  it("parses detailed roadmap with categories and tips", () => {
    const raw = `Here is your plan.
<ROADMAP>{"title":"Istanbul Icons","city":"Istanbul, Turkey","summary":"Fast half-day tour","stops":[{"title":"Hagia Sophia","subtitle":"Exterior walk","duration":"45 min","category":"landmark","tip":"Go early"},{"title":"Balık ekmek","subtitle":"Eminönü","duration":"30 min","category":"street_food"}]}</ROADMAP>
<OPTIONS>["Start here","Shorter route"]</OPTIONS>`;
    const { guestText, roadmap } = parseAiResponse(raw);
    assert.match(guestText, /Here is your plan/);
    assert.equal(roadmap?.city, "Istanbul, Turkey");
    assert.equal(roadmap?.summary, "Fast half-day tour");
    assert.equal(roadmap?.stops.length, 2);
    assert.equal(roadmap?.stops[0]?.category, "landmark");
    assert.equal(roadmap?.stops[1]?.category, "street_food");
  });
});
