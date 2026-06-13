import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel: string) => readFileSync(path.join(root, rel), "utf8");

describe("staff hard delete policy", () => {
  it("purges task references before user row removal", () => {
    const mod = read("lib/staff-user-delete.ts");
    assert.match(mod, /purgeStaffUserTaskRefs/);
    assert.match(mod, /staffTasksTable/);
    assert.match(mod, /routineTasksTable/);
    assert.match(mod, /hardDeleteHotelUser/);
  });

  it("allows managers with staff scope to hard-delete personnel", () => {
    const route = read("routes/staff.ts");
    assert.doesNotMatch(
      route,
      /Only general managers may permanently delete staff/,
    );
    assert.match(route, /hardDeleteHotelUser/);
    assert.doesNotMatch(
      route,
      /Deactivate the staff member before permanently deleting them/,
    );
  });

  it("allows GM to hard-delete department managers without deactivate first", () => {
    const route = read("routes/staff.ts");
    assert.doesNotMatch(
      route,
      /Deactivate the department manager before permanently deleting them/,
    );
  });
});
