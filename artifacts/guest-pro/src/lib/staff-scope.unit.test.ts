import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getDefaultManagerTab,
  getVisibleManagerTabs,
  resolveStaffScope,
} from "./staff-scope";

describe("reception dashboard scope", () => {
  it("resolves reception personnel (not department manager)", () => {
    assert.equal(
      resolveStaffScope({ role: "personnel", staffDepartment: "RECEPTION" }),
      "reception",
    );
    assert.equal(
      resolveStaffScope({ role: "manager", staffDepartment: "RECEPTION" }),
      "department_manager",
    );
  });

  it("shows guests and requests tabs only", () => {
    assert.deepEqual(getVisibleManagerTabs("reception"), ["guests", "requests"]);
    assert.equal(getDefaultManagerTab("reception"), "guests");
  });
});
