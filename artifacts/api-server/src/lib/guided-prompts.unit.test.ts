import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildSystemPrompt, detectChatMode } from "./guided-prompts";

describe("guided-prompts", () => {
  it("detects chat modes", () => {
    assert.equal(detectChatMode("food"), "food");
    assert.equal(detectChatMode("support"), "support");
    assert.equal(detectChatMode("care"), "care");
    assert.equal(detectChatMode(undefined), "general");
  });

  it("includes outcome-first and roadmap instructions for general mode", () => {
    const prompt = buildSystemPrompt({
      mode: "general",
      channel: "text",
      guestContextBlock: "GUEST: Room 101",
    });
    assert.match(prompt, /Outcome-first/i);
    assert.match(prompt, /ROADMAP RULES in HOTEL AI KNOWLEDGE/);
    assert.match(prompt, /enabled facilities/i);
    assert.match(prompt, /≤45 words/);
    assert.match(prompt, /<OPTIONS>/);
  });

  it("uses shorter voice limits", () => {
    const prompt = buildSystemPrompt({
      mode: "food",
      channel: "voice",
      guestContextBlock: "GUEST: Room 101",
    });
    assert.match(prompt, /≤30 words/);
    assert.match(prompt, /MODE FOOD/);
    assert.match(prompt, /VOICE/);
  });

  it("adds mandatory roadmap turn rules when requested", () => {
    const prompt = buildSystemPrompt({
      mode: "general",
      channel: "text",
      guestContextBlock: "GUEST",
      roadmapRequested: true,
    });
    assert.match(prompt, /ROADMAP TURN \(mandatory this reply\)/);
    assert.match(prompt, /6–9 stops/);
  });

  it("includes assistant knowledge block when provided", () => {
    const prompt = buildSystemPrompt({
      mode: "general",
      channel: "text",
      guestContextBlock: "GUEST",
      assistantBlock: "HOTEL AI KNOWLEDGE: Spa open 09-21",
    });
    assert.match(prompt, /Spa open 09-21/);
  });
});
