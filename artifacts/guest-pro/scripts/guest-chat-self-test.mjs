#!/usr/bin/env node
/**
 * Prod-ready self-test for guest AI chat starters + outcome-focused prompts.
 * Usage: pnpm --filter guest-pro guest-chat:self-test
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const guestProRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const apiRoot = path.resolve(guestProRoot, "../api-server");
const tsxCli = path.resolve(
  guestProRoot,
  "../../node_modules/.pnpm/tsx@4.21.0/node_modules/tsx/dist/cli.mjs",
);

const checks = [];

function pass(name) {
  checks.push({ name, ok: true });
  console.log(`✓ ${name}`);
}

function fail(name, error) {
  checks.push({ name, ok: false, error });
  console.error(`✗ ${name}: ${error}`);
}

function runNodeTest(cwd, args, label) {
  const result = spawnSync("node", [tsxCli, "--test", ...args], {
    cwd,
    stdio: "inherit",
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
  pass(label);
}

console.log("Guest chat self-test\n");

runNodeTest(
  guestProRoot,
  ["src/lib/guest-chat-starters.unit.test.ts"],
  "guest chat starter unit tests",
);

runNodeTest(
  apiRoot,
  [
    "src/lib/guided-prompts.unit.test.ts",
    "src/lib/assistant-config/prompt-block.unit.test.ts",
    "src/lib/assistant-config/city-context.unit.test.ts",
    "src/lib/chat-actions.unit.test.ts",
  ],
  "API chat prompt + roadmap unit tests",
);

const chatPage = readFileSync(
  path.join(guestProRoot, "src/pages/guest/chat.tsx"),
  "utf8",
);
const emptyState = readFileSync(
  path.join(guestProRoot, "src/components/chat/GuestChatEmptyState.tsx"),
  "utf8",
);
if (
  !chatPage.includes("GuestChatEmptyState") ||
  !emptyState.includes("GuestChatStarterGrid") ||
  !emptyState.includes("GuestVoiceMicHero")
) {
  fail(
    "chat empty state UI",
    "GuestChatEmptyState missing starter grid or premium voice mic",
  );
} else {
  pass("iOS starter grid + premium voice mic wired in chat page");
}

const guided = readFileSync(
  path.join(apiRoot, "src/lib/guided-prompts.ts"),
  "utf8",
);
if (!guided.includes("Outcome-first")) {
  fail("outcome-focused prompt", "guided-prompts missing outcome-first rules");
} else {
  pass("outcome-focused AI prompt rules present");
}

const promptBlock = readFileSync(
  path.join(apiRoot, "src/lib/assistant-config/prompt-block.ts"),
  "utf8",
);
if (!promptBlock.includes("Explore base city") || !promptBlock.includes("street_food")) {
  fail("GM-aware roadmap prompt", "prompt-block missing city-anchored roadmap rules");
} else {
  pass("GM city + street food roadmap rules in prompt block");
}

const migration = readFileSync(
  path.join(guestProRoot, "../../lib/db/migrations/0020_hotel_assistant_country_code.sql"),
  "utf8",
);
if (!migration.includes("country_code")) {
  fail("country_code migration", "missing 0020 migration");
} else {
  pass("country_code migration present");
}

console.log(`\n${checks.filter((c) => c.ok).length}/${checks.length} checks passed`);
process.exit(checks.some((c) => !c.ok) ? 1 : 0);
