/**
 * Dev server loop: esbuild watch + auto-restart API when bundle changes.
 */
import { spawn, execSync } from "node:child_process";
import path from "node:path";
import { statSync, watch } from "node:fs";
import { fileURLToPath } from "node:url";

const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distEntry = path.join(apiRoot, "dist", "index.mjs");
const buildStamp = path.join(apiRoot, "dist", ".build-stamp");
const apiPort = Number(process.env["PORT"] ?? "3000");

function freeListenPort(port) {
  try {
    const out = execSync(`lsof -ti :${port}`, { encoding: "utf8" }).trim();
    if (!out) return;
    for (const pid of out.split("\n")) {
      if (!pid) continue;
      const n = Number(pid);
      if (n === process.pid) continue;
      console.log(`[dev-loop] Port ${port} in use — stopping PID ${pid}`);
      process.kill(n, "SIGTERM");
    }
  } catch {
    // Port is free.
  }
}

function isPortListening(port) {
  try {
    const out = execSync(`lsof -ti :${port}`, { encoding: "utf8" }).trim();
    return Boolean(out);
  } catch {
    return false;
  }
}

function run(cmd, args, opts = {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { stdio: "inherit", ...opts });
    child.on("exit", (code) => resolve(code ?? 0));
  });
}

function startWatchBuild() {
  const child = spawn("node", ["./build.mjs", "--watch"], {
    cwd: apiRoot,
    stdio: ["inherit", "pipe", "inherit"],
    env: process.env,
  });
  child.stdout.on("data", (chunk) => {
    process.stdout.write(chunk);
    if (chunk.toString().includes("build finished")) {
      scheduleApiRestart("esbuild: build finished");
    }
  });
  return child;
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
let pendingRestartTimer = null;
let pendingRestartReason = null;
let manualRestart = false;
let lastRestartAt = 0;
let lastBundleMtime = 0;
let launching = false;

function stopApi() {
  if (!apiProcess) return;
  manualRestart = true;
  apiProcess.kill("SIGTERM");
}

let ignoreWatchUntil = 0;

function launchApi() {
  if (launching) return;
  launching = true;
  freeListenPort(apiPort);
  apiProcess = startApiProcess();
  ignoreWatchUntil = Date.now() + 2000;
  launching = false;

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
      `[dev-loop] API exited (${code ?? signal}). Restarting in ${delaySec}s… (${fatalRestarts}/${MAX_FATAL_RESTARTS})`,
    );
    setTimeout(launchApi, delaySec * 1000);
  });
}

function queuePendingRestart(reason, waitMs, detail) {
  pendingRestartReason = reason;
  if (pendingRestartTimer) return;
  pendingRestartTimer = setTimeout(() => {
    pendingRestartTimer = null;
    const queued = pendingRestartReason;
    pendingRestartReason = null;
    if (queued) scheduleApiRestart(queued);
  }, waitMs);
  console.log(`[dev-loop] restart deferred (${reason}): ${detail}`);
}

function scheduleApiRestart(reason) {
  if (Date.now() < ignoreWatchUntil) {
    queuePendingRestart(
      reason,
      ignoreWatchUntil - Date.now() + 100,
      "API just launched",
    );
    return;
  }
  if (Date.now() - lastRestartAt < 2500) {
    queuePendingRestart(
      reason,
      2500 - (Date.now() - lastRestartAt) + 100,
      "debounce",
    );
    return;
  }

  if (restartTimer) clearTimeout(restartTimer);
  restartTimer = setTimeout(() => {
    restartTimer = null;
    lastRestartAt = Date.now();
    console.log(`[dev-loop] ${reason} — restarting API…`);
    stopApi();
    setTimeout(launchApi, 400);
  }, 400);
}

function readDiskBuildStamp() {
  try {
    return statSync(buildStamp).mtimeMs;
  } catch {
    return 0;
  }
}

function ensureApiRunning() {
  const diskStampMtime = readDiskBuildStamp();
  if (diskStampMtime > lastBundleMtime) {
    lastBundleMtime = diskStampMtime;
    scheduleApiRestart("bundle stamp newer than tracked mtime");
    return;
  }

  if (apiProcess && isPortListening(apiPort)) return;
  if (!apiProcess && isPortListening(apiPort)) {
    console.log("[dev-loop] Port busy but no managed API — reclaiming port…");
    freeListenPort(apiPort);
  }
  if (launching) return;
  if (Date.now() - lastRestartAt < 2500) return;
  console.log("[dev-loop] API not listening — starting…");
  lastRestartAt = Date.now();
  stopApi();
  launchApi();
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

  for (const file of [distEntry, buildStamp]) {
    try {
      lastBundleMtime = Math.max(lastBundleMtime, statSync(file).mtimeMs);
    } catch {
      /* not created yet */
    }
  }

  const onBundleChange = () => {
    scheduleApiRestart("Bundle rebuilt");
  };

  for (const watched of [distEntry, buildStamp]) {
    try {
      watch(watched, onBundleChange);
    } catch {
      /* file may not exist yet */
    }
  }

  setInterval(() => {
    let mtime = 0;
    for (const file of [distEntry, buildStamp]) {
      try {
        mtime = Math.max(mtime, statSync(file).mtimeMs);
      } catch {
        /* file may not exist yet */
      }
    }
    if (mtime > lastBundleMtime) {
      lastBundleMtime = mtime;
      onBundleChange();
    }
  }, 1500);

  setInterval(ensureApiRunning, 5000);
}

function shutdown() {
  if (restartTimer) clearTimeout(restartTimer);
  if (pendingRestartTimer) clearTimeout(pendingRestartTimer);
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
