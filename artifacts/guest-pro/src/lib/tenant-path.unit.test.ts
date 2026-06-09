import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  fixDuplicateTenantSlugPath,
  getLogoutLoginSegment,
  getLogoutNavigateTarget,
  hotelPath,
  inferLogoutLoginSegment,
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

  it("getLogoutLoginSegment maps roles to login screens", () => {
    assert.equal(getLogoutLoginSegment("manager"), "/manager-login");
    assert.equal(getLogoutLoginSegment("personnel"), "/personel-login");
    assert.equal(getLogoutLoginSegment("guest"), "/guest-login");
  });

  it("inferLogoutLoginSegment uses app area when role is missing", () => {
    assert.equal(inferLogoutLoginSegment("/test-hotel/manager"), "/manager-login");
    assert.equal(inferLogoutLoginSegment("/test-hotel/staff"), "/personel-login");
    assert.equal(inferLogoutLoginSegment("/test-hotel/restaurant"), "/personel-login");
    assert.equal(inferLogoutLoginSegment("/test-hotel/guest"), "/guest-login");
    assert.equal(inferLogoutLoginSegment("/test-hotel/guest/chat"), "/guest-login");
  });

  it("getLogoutNavigateTarget returns role-specific tenant login", () => {
    assert.equal(
      getLogoutNavigateTarget("/test-hotel/manager", "manager"),
      "~/test-hotel/manager-login",
    );
    assert.equal(
      getLogoutNavigateTarget("/test-hotel/staff", "personnel"),
      "~/test-hotel/personel-login",
    );
    assert.equal(
      getLogoutNavigateTarget("/test-hotel/guest/chat", "guest"),
      "~/test-hotel/guest-login",
    );
    assert.equal(getLogoutNavigateTarget("/test-hotel/manager"), "~/test-hotel/manager-login");
  });
});
