import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  parseCoordinateInput,
  parseGoogleMapsCoordString,
  normalizePlaceCoords,
  isLikelyLatLngSwap,
  isWithinHotelRadius,
} from "./coords";

const HOTEL = { lat: 41.19340286914662, lng: 28.722156405960718 };

describe("parseCoordinateInput", () => {
  it("parses combined lat,lng pasted into lat field", () => {
    const result = parseCoordinateInput("41.072182, 28.734567", "");
    assert.deepEqual(result, { lat: 41.072182, lng: 28.734567 });
  });

  it("parses Google Maps URL", () => {
    const result = parseGoogleMapsCoordString(
      "https://www.google.com/maps/@41.072182,28.734567,17z",
    );
    assert.deepEqual(result, { lat: 41.072182, lng: 28.734567 });
  });
});

describe("normalizePlaceCoords", () => {
  it("auto-swaps reversed lat/lng using hotel anchor", () => {
    const { coords, swapped } = normalizePlaceCoords(28.734567, 41.072182, HOTEL);
    assert.equal(swapped, true);
    assert.ok(Math.abs(coords.lat - 41.072182) < 0.0001);
    assert.ok(Math.abs(coords.lng - 28.734567) < 0.0001);
  });

  it("keeps correct coords unchanged", () => {
    const { coords, swapped } = normalizePlaceCoords(41.072182, 28.734567, HOTEL);
    assert.equal(swapped, false);
    assert.deepEqual(coords, { lat: 41.072182, lng: 28.734567 });
  });
});

describe("isLikelyLatLngSwap", () => {
  it("flags typical Turkey swap pattern", () => {
    assert.equal(isLikelyLatLngSwap(28.734, 41.072), true);
  });
});

describe("isWithinHotelRadius", () => {
  it("accepts nearby Istanbul coords", () => {
    assert.equal(isWithinHotelRadius({ lat: 41.072, lng: 28.734 }, HOTEL), true);
  });

  it("rejects coords far from hotel", () => {
    assert.equal(isWithinHotelRadius({ lat: 41.072, lng: 41.028 }, HOTEL), false);
  });
});
