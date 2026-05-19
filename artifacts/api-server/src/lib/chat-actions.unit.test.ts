/**
 * Chat action parsing tests.
 * Run: pnpm test (from artifacts/api-server)
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseAiResponse, stripActionMarkup } from "./chat-action-parse";

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
});
