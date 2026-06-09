/**
 * Dev server loop: esbuild watch + auto-restart API when bundle changes.
 */
import { spawn, execSync } from "node:child_process";
import path from "node:path";
import { watch } from "node:fs";
import { fileURLToPath } from "node:url";

const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distEntry = path.join(apiRoot, "dist", "index.mjs");
const apiPort = Number(process.env["PORT"] ?? "3000");

function freeListenPort(port) {
  try {
    const out = execSync(`lsof -ti :${port}`, { encoding: "utf8" }).trim();
    if (!out) return;
    for (const pid of out.split("\n")) {
      if (!pid) continue;
      console.log(`[dev-loop] Port ${port} in use — stopping PID ${pid}`);
      process.kill(Number(pid), "SIGTERM");
    }
  } catch {
    // Port is free.
  }
}

function run(cmd, args, opts = {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { stdio: "inherit", ...opts });
    child.on("exit", (code) => resolve(code ?? 0));
  });
}

function startWatchBuild() {
  return spawn("node", ["./build.mjs", "--watch"], {
    cwd: apiRoot,
    stdio: "inherit",
    env: process.env,
  });
}

function startApiProcess() {
  return spawn(
    "node",
    ["--import", "dotenv/config", "--enable-source-maps", "./dist/index.mjs"],
    {
      cwd: apiRoot,
      env: {
        ...process.env,
        NODE_ENV: "development",
        DOTENV_CONFIG_PATH: "../../.env",
      },
      stdio: "inherit",
    },
  );
}

console.log("[dev-loop] Starting API (watch build + auto-restart)…");

const MAX_FATAL_RESTARTS = 8;
let fatalRestarts = 0;
let watchBuild = null;
let apiProcess = null;
let restartTimer = null;
let manualRestart = false;

function stopApi() {
  if (!apiProcess) return;
  manualRestart = true;
  apiProcess.kill("SIGTERM");
}

let ignoreWatchUntil = 0;

function launchApi() {
  freeListenPort(apiPort);
  apiProcess = startApiProcess();
  ignoreWatchUntil = Date.now() + 800;
  apiProcess.on("exit", (code, signal) => {
    const wasManual = manualRestart;
    manualRestart = false;
    apiProcess = null;

    if (wasManual) return;

    if (code === 0) {
      fatalRestarts = 0;
      console.log("[dev-loop] API stopped cleanly.");
      process.exit(0);
    }

    fatalRestarts += 1;
    if (fatalRestarts >= MAX_FATAL_RESTARTS) {
      console.error(
        "\n[dev-loop] API failed to stay up after",
        MAX_FATAL_RESTARTS,
        "attempts.",
      );
      process.exit(code ?? 1);
    }

    const delaySec = Math.min(2 + fatalRestarts, 15);
    console.log(
      `[dev-loop] API crashed (exit ${code ?? signal}). Restarting in ${delaySec}s… (${fatalRestarts}/${MAX_FATAL_RESTARTS})`,
    );
    setTimeout(launchApi, delaySec * 1000);
  });
}

function scheduleApiRestart(reason) {
  if (restartTimer) clearTimeout(restartTimer);
  restartTimer = setTimeout(() => {
    restartTimer = null;
    console.log(`[dev-loop] ${reason} — restarting API…`);
    stopApi();
    setTimeout(launchApi, 900);
  }, 500);
}

async function main() {
  const buildCode = await run("node", ["./build.mjs"], { cwd: apiRoot });
  if (buildCode !== 0) {
    console.error("[dev-loop] Initial build failed");
    process.exit(buildCode);
  }

  watchBuild = startWatchBuild();
  watchBuild.on("exit", (code) => {
    console.error("[dev-loop] esbuild watch exited with code", code);
    if (apiProcess) apiProcess.kill("SIGTERM");
    process.exit(code ?? 1);
  });

  launchApi();

  // Restart API whenever esbuild rebuilds the bundle. Skip fs.watch noise right
  // after each API boot (macOS often emits a spurious change event on watch()).
  watch(distEntry, () => {
    if (Date.now() < ignoreWatchUntil) return;
    scheduleApiRestart("Bundle rebuilt");
  });
}

function shutdown() {
  if (restartTimer) clearTimeout(restartTimer);
  if (watchBuild) watchBuild.kill("SIGTERM");
  if (apiProcess) apiProcess.kill("SIGTERM");
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

main().catch((err) => {
  console.error("[dev-loop] Fatal error:", err);
  process.exit(1);
});
