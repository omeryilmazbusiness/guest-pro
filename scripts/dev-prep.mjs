#!/usr/bin/env node
/**
 * Frees local dev ports before `pnpm dev` so API + Vite can bind cleanly.
 * macOS / Linux: uses lsof. Safe to run when ports are already free.
 */

import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const ports = process.argv.slice(2).length > 0 ? process.argv.slice(2) : ["3000", "5173"];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function pidsOnPort(port) {
  try {
    const out = execSync(`lsof -ti tcp:${port}`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (!out) return [];
    return [...new Set(out.split("\n").map((s) => s.trim()).filter(Boolean))];
  } catch {
    return [];
  }
}

async function freePort(port) {
  const pids = pidsOnPort(port);
  if (pids.length === 0) return;

  console.log(`[dev-prep] freeing port ${port} (PIDs: ${pids.join(", ")})`);
  for (const pid of pids) {
    try {
      process.kill(Number(pid), "SIGTERM");
    } catch {
      /* already gone */
    }
  }

  await sleep(400);

  const remaining = pidsOnPort(port);
  for (const pid of remaining) {
    try {
      process.kill(Number(pid), "SIGKILL");
      console.log(`[dev-prep] force-killed PID ${pid} on port ${port}`);
    } catch {
      /* ignore */
    }
  }
}

for (const port of ports) {
  await freePort(port);
}

// Ensure API bundle includes latest routes before dev-loop starts.
execSync("node ./build.mjs", {
  cwd: path.join(repoRoot, "artifacts/api-server"),
  stdio: "inherit",
});
console.log("[dev-prep] API bundle built");

console.log("[dev-prep] ports ready:", ports.join(", "));
