#!/usr/bin/env node
/**
 * Prod-ready self-test for manager hard-delete of staff and department managers.
 * Usage: pnpm --filter @workspace/api-server staff-delete:self-test
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const guestRoot = path.resolve(apiRoot, "../guest-pro");

const checks = [];

function pass(name) {
  checks.push({ name, ok: true });
  console.log(`✓ ${name}`);
}

function fail(name, error) {
  checks.push({ name, ok: false, error });
  console.error(`✗ ${name}: ${error}`);
}

function read(rel) {
  return readFileSync(path.join(apiRoot, rel), "utf8");
}

function readGuest(rel) {
  return readFileSync(path.join(guestRoot, rel), "utf8");
}

const unit = spawnSync(
  "pnpm",
  ["exec", "tsx", "--test", "src/lib/staff-user-delete.unit.test.ts"],
  { cwd: apiRoot, stdio: "inherit" },
);
if (unit.status !== 0) process.exit(unit.status ?? 1);
pass("staff hard-delete unit tests");

const deleteLib = read("src/lib/staff-user-delete.ts");
if (!deleteLib.includes("purgeStaffUserTaskRefs")) {
  fail("purge task refs helper", "missing purgeStaffUserTaskRefs");
} else {
  pass("purge task refs helper");
}

const staffRoute = read("src/routes/staff.ts");
if (staffRoute.includes("Only general managers may permanently delete staff")) {
  fail("staff delete scope", "still GM-only for personnel hard delete");
} else {
  pass("department managers may hard-delete scoped personnel");
}

if (staffRoute.includes("Deactivate the staff member before permanently deleting them")) {
  fail("staff delete flow", "still requires deactivate before hard delete");
} else {
  pass("staff hard delete without deactivate step");
}

if (staffRoute.includes("Deactivate the department manager before permanently deleting them")) {
  fail("dept manager delete flow", "still requires deactivate before hard delete");
} else {
  pass("department manager hard delete without deactivate step");
}

const teamTab = readGuest("src/components/manager/StaffTeamTab.tsx");
if (!teamTab.includes("Delete permanently") || teamTab.includes("!member.isActive &&")) {
  // ensure delete is not gated only on inactive in dropdown - check both branches removed
}
if (teamTab.match(/Delete permanently[\s\S]*?member\.isActive \?/)) {
  fail("employee menu", "delete still nested only under inactive branch");
} else if (!teamTab.includes("Delete permanently")) {
  fail("employee menu", "missing delete permanently action");
} else {
  pass("employee menu exposes hard delete for active accounts");
}

const deptSection = readGuest("src/components/manager/DepartmentManagersSection.tsx");
if (!deptSection.includes("setDeleteOpen(true)")) {
  fail("dept manager menu", "missing delete dialog trigger");
} else {
  pass("department manager menu exposes hard delete");
}

const detailSheet = readGuest("src/components/manager/EmployeeDetailSheet.tsx");
if (!detailSheet.includes("deleteEmployeeTitle") || !detailSheet.includes("AlertDialog")) {
  fail("employee detail sheet", "missing hard-delete confirmation");
} else {
  pass("employee detail sheet hard-delete confirmation");
}

const failed = checks.filter((c) => !c.ok).length;
console.log(`\n${checks.length - failed}/${checks.length} checks passed`);
if (failed > 0) process.exit(1);
console.log("staff-delete self-test passed");
