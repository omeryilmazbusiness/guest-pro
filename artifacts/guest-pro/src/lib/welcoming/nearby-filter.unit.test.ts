import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { NearbyPlace } from "./types";

/** Mirrors GuestNearbyExplorer filter logic for regression coverage. */
function filterPlaces(
  places: NearbyPlace[],
  filter: "all" | NearbyPlace["type"],
  query: string,
  typeLabelFn: (type: NearbyPlace["type"]) => string,
): NearbyPlace[] {
  let list = places;
  if (filter !== "all") {
    list = list.filter((p) => p.type === filter);
  }
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter((p) => {
    const typeLabel = typeLabelFn(p.type).toLowerCase();
    return p.name.toLowerCase().includes(q) || typeLabel.includes(q);
  });
}

const SAMPLE: NearbyPlace[] = [
  { name: "Migros", type: "market", distance: "5 min", description: "" },
  { name: "City Pharmacy", type: "pharmacy", distance: "8 min", description: "" },
  { name: "Grand Bazaar", type: "bazaar", distance: "12 min", description: "" },
];

describe("nearby place filter", () => {
  it("returns all when filter is all and query empty", () => {
    const out = filterPlaces(SAMPLE, "all", "", () => "");
    assert.equal(out.length, 3);
  });

  it("filters by type", () => {
    const out = filterPlaces(SAMPLE, "pharmacy", "", () => "");
    assert.equal(out.length, 1);
    assert.equal(out[0]?.name, "City Pharmacy");
  });

  it("filters by name query", () => {
    const out = filterPlaces(SAMPLE, "all", "mig", () => "");
    assert.equal(out.length, 1);
    assert.equal(out[0]?.type, "market");
  });

  it("filters by localized type label", () => {
    const out = filterPlaces(SAMPLE, "all", "eczane", (t) =>
      t === "pharmacy" ? "Eczane" : "",
    );
    assert.equal(out.length, 1);
    assert.equal(out[0]?.type, "pharmacy");
  });
});
