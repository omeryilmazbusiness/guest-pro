import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  fixDuplicateTenantSlugPath,
  getLogoutNavigateTarget,
  hotelPath,
  normalizeTenantSegment,
  tenantNavigatePath,
} from "./tenant-path";

describe("tenant-path", () => {
  it("normalizeTenantSegment strips duplicate slug prefix", () => {
    assert.equal(normalizeTenantSegment("ramada-arn", "/ramada-arn/login"), "/login");
  });

  it("hotelPath does not double slug", () => {
    assert.equal(hotelPath("ramada-arn", "/ramada-arn/login"), "/ramada-arn/login");
    assert.equal(hotelPath("ramada-arn", "/login"), "/ramada-arn/login");
  });

  it("fixDuplicateTenantSlugPath repairs bad URLs", () => {
    assert.equal(
      fixDuplicateTenantSlugPath("/ramada-arn/ramada-arn/login"),
      "/ramada-arn/login",
    );
    assert.equal(
      fixDuplicateTenantSlugPath("/test-hotel/test-hotel/login"),
      "/test-hotel/login",
    );
  });

  it("tenantNavigatePath returns nest-relative segment for wouter", () => {
    assert.equal(tenantNavigatePath("test-hotel", "/test-hotel/login"), "/login");
    assert.equal(tenantNavigatePath("test-hotel", "/manager"), "/manager");
  });

  it("getLogoutNavigateTarget returns tenant login from manager URL", () => {
    assert.equal(getLogoutNavigateTarget("/test-hotel/manager"), "~/test-hotel/login");
  });
});
