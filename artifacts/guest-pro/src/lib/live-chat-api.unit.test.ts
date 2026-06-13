import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getVisibleManagerTabs } from "./staff-scope";

describe("live chat reception scope", () => {
  it("includes live_chat tab for reception staff", () => {
    const tabs = getVisibleManagerTabs("reception");
    assert.ok(tabs.includes("live_chat"));
    assert.equal(tabs.indexOf("live_chat"), 1);
  });
});
