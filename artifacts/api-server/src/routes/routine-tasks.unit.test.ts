/**
 * Self-test: routine task delete must detach staff_tasks before removing template.
 * Run: pnpm --filter @workspace/api-server exec tsx --test src/routes/routine-tasks.unit.test.ts
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const routeSrc = readFileSync(
  path.join(apiRoot, "src/routes/routine-tasks.ts"),
  "utf8",
);
const migration = readFileSync(
  path.resolve(apiRoot, "../../lib/db/migrations/0010_routine_task_fk_set_null.sql"),
  "utf8",
);
const schema = readFileSync(
  path.resolve(apiRoot, "../../lib/db/src/schema/staff-tasks.ts"),
  "utf8",
);

describe("routine-tasks delete safety", () => {
  it("DELETE handler detaches staff_tasks in a transaction", () => {
    assert.match(routeSrc, /db\.transaction/);
    assert.match(routeSrc, /routineTaskId: null/);
    assert.match(routeSrc, /delete\(routineTasksTable\)/);
  });

  it("migration sets ON DELETE SET NULL on routine_task_id FK", () => {
    assert.match(migration, /ON DELETE SET NULL/i);
    assert.match(migration, /staff_tasks_routine_task_id_fkey/);
  });

  it("drizzle schema declares onDelete set null", () => {
    assert.match(schema, /onDelete:\s*"set null"/);
  });
});
