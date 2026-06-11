#!/usr/bin/env node
/**
 * Prod-ready self-test + self-review for GM setup wizard progress.
 * Usage: pnpm --filter @workspace/api-server hotel-setup:self-test
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.resolve(root, "../../.env");
const distStampPath = path.join(root, "dist", ".build-stamp");
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

function runUnitAndIntegrationTests() {
  const result = spawnSync(
    "pnpm",
    [
      "exec",
      "tsx",
      "--import",
      "dotenv/config",
      "--test",
      "src/lib/hotel-setup/completion.unit.test.ts",
      "src/lib/hotel-setup/hotel-setup.integration.test.ts",
    ],
    {
      cwd: root,
      env: { ...process.env, DOTENV_CONFIG_PATH: envPath },
      stdio: "inherit",
    },
  );
  if (result.status !== 0) process.exit(result.status ?? 1);
  pass("unit + DB integration tests");
}

async function readExpectedFromDb() {
  const script = `
    import 'dotenv/config';
    import { loadHotelSetupContext } from './src/lib/hotel-setup/load-context.ts';
    import { computeHotelSetupCompletion, buildHotelSetupSteps } from './src/lib/hotel-setup/completion.ts';
    (async () => {
      const hotelId = Number(process.env.SELF_TEST_HOTEL_ID ?? 1);
      const ctx = await loadHotelSetupContext(hotelId);
      console.log(JSON.stringify({
        aboutLen: ctx.aboutHotel.trim().length,
        completion: computeHotelSetupCompletion(ctx),
        steps: buildHotelSetupSteps(ctx),
      }));
    })();
  `;
  const result = spawnSync("pnpm", ["exec", "tsx", "--eval", script], {
    cwd: root,
    env: { ...process.env, DOTENV_CONFIG_PATH: envPath },
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || "failed to load DB expectation");
  }
  return JSON.parse(result.stdout.trim());
}

async function generateGmToken(hotelId = 1, userId = 1) {
  const script = `
    import 'dotenv/config';
    import { generateToken } from './src/lib/auth.ts';
    (() => { console.log(generateToken(${userId}, 'manager', ${hotelId})); })();
  `;
  const result = spawnSync("pnpm", ["exec", "tsx", "--eval", script], {
    cwd: root,
    env: { ...process.env, DOTENV_CONFIG_PATH: envPath },
    encoding: "utf8",
  });
  if (result.status !== 0) throw new Error("token generation failed");
  return result.stdout.trim();
}

async function verifyLiveApiContract() {
  let diskStamp = null;
  try {
    diskStamp = readFileSync(distStampPath, "utf8").trim();
  } catch {
    fail("disk build stamp", "dist/.build-stamp missing — run pnpm build in api-server");
    return;
  }
  pass(`disk build stamp (${diskStamp})`);

  let health;
  try {
    const res = await fetch(`${base}/api/healthz`);
    if (!res.ok) throw new Error(`healthz status ${res.status}`);
    health = await res.json();
  } catch (e) {
    fail("live API healthz", `${e.message} — start API with pnpm dev`);
    return;
  }
  pass(`live API reachable (${base})`);

  if (!health.buildStamp) {
    fail("API build stamp exposed", "healthz missing buildStamp — restart API to load latest bundle");
    return;
  }

  if (health.buildStamp !== diskStamp) {
    fail(
      "API bundle freshness",
      `stale API process (disk=${diskStamp}, api=${health.buildStamp}). Restart: pnpm dev or kill port 3000`,
    );
    return;
  }
  pass("API bundle matches disk (not stale)");

  let expected;
  try {
    expected = await readExpectedFromDb();
  } catch (e) {
    fail("DB expectation", e.message);
    return;
  }

  if (expected.aboutLen >= 20 && !expected.completion.completedSteps.includes("about")) {
    fail("DB about step logic", `aboutLen=${expected.aboutLen} but about step incomplete`);
    return;
  }
  pass(`DB expectation (${expected.completion.percent}%, aboutLen=${expected.aboutLen})`);

  let token;
  try {
    token = await generateGmToken();
  } catch (e) {
    fail("GM token", e.message);
    return;
  }

  let live;
  try {
    const res = await fetch(`${base}/api/hotel/setup-wizard`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`setup-wizard status ${res.status}`);
    live = await res.json();
  } catch (e) {
    fail("live setup-wizard", e.message);
    return;
  }

  if (live.completion.percent !== expected.completion.percent) {
    fail(
      "setup-wizard percent",
      `API=${live.completion.percent}% DB=${expected.completion.percent}% — stale bundle or wrong hotel session`,
    );
    return;
  }

  const aboutStep = live.steps.find((s) => s.id === "about");
  const expectedAbout = expected.steps.find((s) => s.id === "about");
  if (aboutStep?.done !== expectedAbout?.done) {
    fail(
      "setup-wizard about step",
      `API done=${aboutStep?.done} DB done=${expectedAbout?.done} (aboutLen=${expected.aboutLen})`,
    );
    return;
  }

  pass(`live setup-wizard matches DB (${live.completion.percent}%, about=${aboutStep?.done ? "done" : "pending"})`);
}

function printSelfReview() {
  console.log("\n--- Self-review ---");
  console.log("• About step counts when about_hotel.trim().length >= 20");
  console.log("• Save/Home on settings pages persist before navigating to dashboard");
  console.log("• API must restart after bundle rebuild (healthz buildStamp === dist/.build-stamp)");
  console.log("• Dashboard wizard refetches on navigation + hotel-setup-changed event");
}

console.log("Hotel setup self-test\n");
runUnitAndIntegrationTests();
await verifyLiveApiContract();
printSelfReview();

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length}/${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
