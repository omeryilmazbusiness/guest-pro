import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getHotelLogoSrc } from "./hotel-logo";

describe("getHotelLogoSrc", () => {
  it("returns null when logoUrl is missing even if slug is set", () => {
    assert.equal(getHotelLogoSrc("local-hotel", null), null);
    assert.equal(getHotelLogoSrc("local-hotel", undefined), null);
  });

  it("uses explicit API logo path", () => {
    assert.equal(
      getHotelLogoSrc("local-hotel", "/api/public/hotels/local-hotel/logo"),
      "/api/public/hotels/local-hotel/logo",
    );
  });

  it("passes through data URLs", () => {
    const data = "data:image/png;base64,abc";
    assert.equal(getHotelLogoSrc("local-hotel", data), data);
  });

  it("appends cache key query param", () => {
    assert.equal(
      getHotelLogoSrc("local-hotel", "/api/public/hotels/local-hotel/logo", "v1"),
      "/api/public/hotels/local-hotel/logo?v=v1",
    );
  });
});
