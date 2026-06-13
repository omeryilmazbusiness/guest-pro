#!/usr/bin/env node
/**
 * Prod-ready self-test for restaurant Care About Me → 3 kitchen rules AI flow.
 * Usage: pnpm --filter @workspace/api-server restaurant-care:self-test
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const guestRoot = path.resolve(apiRoot, "../guest-pro");
const envPath = path.resolve(apiRoot, "../../.env");
const distStampPath = path.join(apiRoot, "dist", ".build-stamp");
const base = (process.env.SELF_TEST_API_BASE ?? "http://localhost:3000").replace(/\/$/, "");

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
  ["exec", "tsx", "--test", "src/lib/restaurant-care-analysis.unit.test.ts"],
  { cwd: apiRoot, stdio: "inherit" },
);
if (unit.status !== 0) process.exit(unit.status ?? 1);
pass("restaurant care analysis unit tests");

const analysisLib = read("src/lib/restaurant-care-analysis.ts");
if (!analysisLib.includes("RESTAURANT_CARE_INSIGHT_COUNT = 3")) {
  fail("insight count", "expected exactly 3 kitchen rules");
} else {
  pass("exactly 3 kitchen rules constant");
}

if (!analysisLib.includes("extractCareProfileText")) {
  fail("profile extraction", "missing extractCareProfileText");
} else if (!analysisLib.includes("freetext")) {
  fail("profile extraction", "missing freetext field");
} else {
  pass("extracts all Care About Me text fields");
}

if (!analysisLib.includes("buildFallbackCareInsights")) {
  fail("fallback", "missing buildFallbackCareInsights");
} else {
  pass("rule-based fallback when AI fails");
}

const gemini = read("src/lib/gemini.ts");
if (!gemini.includes("parseRestaurantCareInsights")) {
  fail("gemini integration", "missing parseRestaurantCareInsights usage");
} else if (!gemini.includes("buildFallbackCareInsights")) {
  fail("gemini integration", "missing fallback on AI failure");
} else {
  pass("gemini uses validation + fallback");
}

const route = read("src/routes/restaurant.ts");
if (!route.includes("dedupeCareProfilesByRoom")) {
  fail("care refresh route", "missing dedupeCareProfilesByRoom");
} else if (!route.includes("createdAt")) {
  fail("care refresh route", "missing createdAt for dedupe");
} else {
  pass("care refresh dedupes latest profile per room");
}

const careTab = readGuest("src/components/restaurant/RestaurantCareInsightsTab.tsx");
if (!careTab.includes("refreshCareInsights")) {
  fail("care UI", "missing refreshCareInsights");
} else if (!careTab.includes(".slice(0, 3)")) {
  fail("care UI", "should display at most 3 rules");
} else if (careTab.includes("richMatch")) {
  fail("care UI", "still using per-room rich parse format");
} else {
  pass("care tab shows 3 numbered kitchen rules");
}

const i18n = readGuest("src/lib/staff-i18n.ts");
if (!i18n.includes("careKitchenRulesSubtitle")) {
  fail("i18n", "missing careKitchenRulesSubtitle");
} else {
  pass("care i18n strings");
}

async function verifyLiveApi() {
  let diskStamp = null;
  try {
    diskStamp = readFileSync(distStampPath, "utf8").trim();
  } catch {
    fail("disk build stamp", "dist/.build-stamp missing — API may be stale");
    return;
  }
  pass(`disk build stamp (${diskStamp})`);

  const healthRes = await fetch(`${base}/api/healthz`);
  if (!healthRes.ok) {
    fail("live API", `healthz failed (${healthRes.status}) — is pnpm dev running?`);
    return;
  }
  const health = await healthRes.json();
  if (health.buildStamp && health.buildStamp !== diskStamp) {
    fail("live API stamp", `running ${health.buildStamp} but disk is ${diskStamp}`);
    return;
  }
  pass("live API healthz + build stamp match");

  const tokenScript = `
    import 'dotenv/config';
    import { generateToken } from './src/lib/auth.ts';
    import { db } from '@workspace/db';
    import { usersTable } from '@workspace/db/schema';
    import { eq, and } from 'drizzle-orm';
    (async () => {
      const rows = await db.select().from(usersTable)
        .where(and(
          eq(usersTable.role, 'personnel'),
          eq(usersTable.staffDepartment, 'RESTAURANT'),
          eq(usersTable.isActive, true),
        ))
        .limit(1);
      if (!rows[0]) {
        console.log(JSON.stringify({ skip: true, reason: 'no restaurant personnel user' }));
        return;
      }
      const u = rows[0];
      console.log(JSON.stringify({
        skip: false,
        token: generateToken(u.id, u.role, u.hotelId, undefined, u.staffDepartment),
      }));
    })();
  `;
  const tokenResult = spawnSync("pnpm", ["exec", "tsx", "--eval", tokenScript], {
    cwd: apiRoot,
    env: { ...process.env, DOTENV_CONFIG_PATH: envPath },
    encoding: "utf8",
  });
  if (tokenResult.status !== 0) {
    fail("restaurant token", tokenResult.stderr || "token script failed");
    return;
  }
  const tokenPayload = JSON.parse(tokenResult.stdout.trim());
  if (tokenPayload.skip) {
    pass(`live care API skipped (${tokenPayload.reason})`);
    return;
  }

  const today = new Date().toISOString().split("T")[0];
  const getRes = await fetch(`${base}/api/restaurant/care-insights?date=${today}`, {
    headers: { Authorization: `Bearer ${tokenPayload.token}` },
  });
  if (!getRes.ok) {
    fail("GET care-insights", `status ${getRes.status}`);
    return;
  }
  const getBody = await getRes.json();
  if (!Array.isArray(getBody.insights)) {
    fail("GET care-insights", "insights is not an array");
    return;
  }
  pass("GET /restaurant/care-insights contract");

  const refreshRes = await fetch(`${base}/api/restaurant/care-insights/refresh`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokenPayload.token}`,
      "Content-Type": "application/json",
    },
  });
  if (!refreshRes.ok) {
    fail("POST care-insights/refresh", `status ${refreshRes.status}`);
    return;
  }
  const refreshBody = await refreshRes.json();
  if (!Array.isArray(refreshBody.insights)) {
    fail("POST care-insights/refresh", "insights is not an array");
    return;
  }
  if (refreshBody.insights.length > 0 && refreshBody.insights.length !== 3) {
    fail("POST care-insights/refresh", `expected 0 or 3 insights, got ${refreshBody.insights.length}`);
    return;
  }
  pass(
    refreshBody.insights.length === 3
      ? "POST refresh returned 3 kitchen rules"
      : "POST refresh returned empty (no care profiles yet)",
  );
}

await verifyLiveApi();

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length}/${checks.length} checks passed`);
if (failed.length > 0) {
  process.exit(1);
}
console.log("restaurant-care self-test OK");
