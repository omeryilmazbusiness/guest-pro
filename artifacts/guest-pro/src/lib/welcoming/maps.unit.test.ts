import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildGoogleMapsHotelEmbedUrl,
  buildGoogleMapsDirectionsLink,
  buildGuestNearbyMapEmbedUrl,
  buildOsmBoundsEmbedUrl,
  coordSpanDegrees,
  computeNearbyMapZoom,
} from "./maps";

const HOTEL = { lat: 41.19340286914662, lng: 28.722156405960718 };
const NEARBY = { lat: 41.07218278174797, lng: 28.734 };
const FAR_BAD = { lat: 41.07218278174797, lng: 41.028 };

describe("buildGoogleMapsHotelEmbedUrl", () => {
  it("pins hotel coordinates on the embed map", () => {
    const url = buildGoogleMapsHotelEmbedUrl(HOTEL, 15);
    assert.match(url, /q=41\.19340286914662,28\.722156405960718/);
    assert.match(url, /output=embed/);
    assert.doesNotMatch(url, /saddr=/);
    assert.doesNotMatch(url, /daddr=/);
  });

  it("includes hotel label in q parameter", () => {
    const url = buildGoogleMapsHotelEmbedUrl(HOTEL, 15, "Local Hotel");
    assert.match(url, /Local\+Hotel/);
  });
});

describe("buildGuestNearbyMapEmbedUrl", () => {
  it("defaults to hotel-only embed without a selected place", () => {
    const url = buildGuestNearbyMapEmbedUrl(HOTEL, { hotelLabel: "Local Hotel" });
    assert.ok(url);
    assert.match(url!, /q=41\.19340286914662,28\.722156405960718/);
    assert.doesNotMatch(url!, /saddr=/);
  });

  it("uses bounds embed for a nearby selected place", () => {
    const url = buildGuestNearbyMapEmbedUrl(HOTEL, { selectedPlace: NEARBY });
    assert.ok(url);
    assert.match(url!, /openstreetmap\.org\/export\/embed\.html/);
    assert.match(url!, /marker=41\.07218278174797,28\.734/);
  });

  it("keeps hotel pin when selected place coords are invalid/far", () => {
    const url = buildGuestNearbyMapEmbedUrl(HOTEL, { selectedPlace: FAR_BAD });
    assert.ok(url);
    assert.match(url!, /maps\.google\.com\/maps\?q=41\.19340286914662,28\.722156405960718/);
    assert.doesNotMatch(url!, /saddr=/);
    assert.doesNotMatch(url!, /daddr=/);
  });
});

describe("coordSpanDegrees", () => {
  it("detects large span for bad coordinates", () => {
    assert.ok(coordSpanDegrees(HOTEL, FAR_BAD) > 2);
    assert.ok(coordSpanDegrees(HOTEL, NEARBY) < 2);
  });
});

describe("buildGoogleMapsDirectionsLink", () => {
  it("uses lat,lng destination without invalid place_id param", () => {
    const url = buildGoogleMapsDirectionsLink(NEARBY, "Pharmacy", HOTEL);
    assert.match(url, /destination=41\.07218278174797%2C28\.734/);
    assert.match(url, /origin=41\.19340286914662%2C28\.722156405960718/);
    assert.doesNotMatch(url, /destination_place_id/);
  });
});

describe("buildOsmBoundsEmbedUrl", () => {
  it("frames both hotel and place with selected place marker", () => {
    const url = buildOsmBoundsEmbedUrl(HOTEL, NEARBY, 0.006, NEARBY);
    assert.match(url, /bbox=/);
    assert.match(url, /marker=41\.07218278174797,28\.734/);
  });
});

describe("computeNearbyMapZoom", () => {
  it("zooms out for moderately spaced points", () => {
    assert.ok(computeNearbyMapZoom(HOTEL, NEARBY) <= 15);
  });
});
