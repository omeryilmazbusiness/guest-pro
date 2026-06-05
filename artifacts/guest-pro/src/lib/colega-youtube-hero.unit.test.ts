import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  GUESTPRO_HERO_YOUTUBE_ID,
  GUESTPRO_HERO_YOUTUBE_URL,
  buildYoutubeHeroEmbedUrl,
  parseYoutubeVideoId,
} from "./colega-youtube-hero.ts";

describe("colega-youtube-hero", () => {
  it("parses youtu.be and watch URLs", () => {
    assert.equal(parseYoutubeVideoId(GUESTPRO_HERO_YOUTUBE_ID), GUESTPRO_HERO_YOUTUBE_ID);
    assert.equal(
      parseYoutubeVideoId(GUESTPRO_HERO_YOUTUBE_URL),
      GUESTPRO_HERO_YOUTUBE_ID,
    );
    assert.equal(
      parseYoutubeVideoId("https://www.youtube.com/watch?v=cdKx1Zv3YKs"),
      GUESTPRO_HERO_YOUTUBE_ID,
    );
    assert.equal(parseYoutubeVideoId("not-a-url"), null);
  });

  it("builds muted autoplay loop embed URL", () => {
    const url = buildYoutubeHeroEmbedUrl(GUESTPRO_HERO_YOUTUBE_ID, "https://guest-pro.com");
    assert.match(url, /^https:\/\/www\.youtube-nocookie\.com\/embed\/cdKx1Zv3YKs\?/);
    const parsed = new URL(url);
    assert.equal(parsed.searchParams.get("autoplay"), "1");
    assert.equal(parsed.searchParams.get("mute"), "1");
    assert.equal(parsed.searchParams.get("loop"), "1");
    assert.equal(parsed.searchParams.get("playlist"), GUESTPRO_HERO_YOUTUBE_ID);
    assert.equal(parsed.searchParams.get("controls"), "0");
    assert.equal(parsed.searchParams.get("origin"), "https://guest-pro.com");
  });
});
