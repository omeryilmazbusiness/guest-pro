import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildTenantAppUrl, buildTenantPath } from "./app-url";

describe("app-url", () => {
  it("buildTenantPath prefixes slug", () => {
    assert.equal(buildTenantPath("grand-plaza", "/guest/auto-login"), "/grand-plaza/guest/auto-login");
    assert.equal(
      buildTenantPath("grand-plaza", "guest/auto-login?token=abc"),
      "/grand-plaza/guest/auto-login?token=abc",
    );
  });

  it("buildTenantAppUrl combines base and path", () => {
    assert.equal(
      buildTenantAppUrl("https://app.example.com", "demo", "/guest"),
      "https://app.example.com/demo/guest",
    );
  });
});
