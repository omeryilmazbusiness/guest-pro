import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveRoadmapScenery } from "@/lib/roadmap-scenery";

describe("resolveRoadmapScenery", () => {
  it("resolves Istanbul with Turkey theme (no external URL)", () => {
    const s = resolveRoadmapScenery("Istanbul, Turkey");
    assert.equal(s.countryCode, "TR");
    assert.equal(s.accent, "#c2410c");
    assert.match(s.gradientCss, /linear-gradient/);
    assert.doesNotMatch(s.gradientCss, /unsplash/i);
  });

  it("resolves Paris with French theme", () => {
    const s = resolveRoadmapScenery("Paris, France");
    assert.equal(s.accent, "#1d4ed8");
    assert.match(s.gradientCss, /#818cf8|#6366f1/);
  });
});
