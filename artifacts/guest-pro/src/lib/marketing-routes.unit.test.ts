import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  colegaPageForPath,
  isMarketingSitePath,
  MARKETING_ROUTES,
  marketingContactUrl,
} from "./marketing-routes.ts";

describe("marketing-routes", () => {
  it("maps site paths to colega HTML", () => {
    assert.equal(colegaPageForPath("/"), "index.html");
    assert.equal(colegaPageForPath("/home"), "index.html");
    assert.equal(colegaPageForPath("/about"), "about.html");
    assert.equal(colegaPageForPath("/about/"), "about.html");
    assert.equal(colegaPageForPath("/contact"), "contact.html");
    assert.equal(colegaPageForPath("/contact/"), "contact.html");
    assert.equal(colegaPageForPath("/login"), null);
  });

  it("recognizes marketing site paths", () => {
    assert.equal(isMarketingSitePath("/"), true);
    assert.equal(isMarketingSitePath("/about"), true);
    assert.equal(isMarketingSitePath("/contact"), true);
    assert.equal(isMarketingSitePath("/demo-hotel"), false);
  });

  it("exports stable route constants", () => {
    assert.equal(MARKETING_ROUTES.about, "/about");
    assert.equal(MARKETING_ROUTES.contact, "/contact");
  });

  it("builds contact URL for demo CTAs", () => {
    assert.equal(marketingContactUrl(), "/contact#contact-formular");
    assert.equal(marketingContactUrl(""), "/contact");
  });
});
