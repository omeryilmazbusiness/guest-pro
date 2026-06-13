/**
 * Dev server loop: esbuild watch + auto-restart API when bundle changes.
 */
import { spawn, execSync } from "node:child_process";
import path from "node:path";
import { statSync, watch } from "node:fs";
import { fileURLToPath } from "node:url";

const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(apiRoot, "../..");
const dotenvPath = path.join(repoRoot, ".env");
const distEntry = path.join(apiRoot, "dist", "index.mjs");
const buildStamp = path.join(apiRoot, "dist", ".build-stamp");
const apiPort = Number(process.env["PORT"] ?? "3000");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pidsOnPort(port) {
  try {
    const out = execSync(`lsof -ti :${port}`, { encoding: "utf8" }).trim();
    if (!out) return [];
    return out.split("\n").map((s) => Number(s.trim())).filter(Boolean);
  } catch {
    return [];
  }
}

function isPortListening(port) {
  return pidsOnPort(port).length > 0;
}

async function freeListenPort(port, { keepPid } = {}) {
  const pids = pidsOnPort(port).filter((pid) => pid !== keepPid && pid !== process.pid);
  if (pids.length === 0) return;

  for (const pid of pids) {
    console.log(`[dev-loop] Port ${port} in use — stopping PID ${pid}`);
    try {
      process.kill(pid, "SIGTERM");
    } catch {
      /* already gone */
    }
  }

  for (let i = 0; i < 40; i++) {
    const remaining = pidsOnPort(port).filter((pid) => pid !== keepPid && pid !== process.pid);
    if (remaining.length === 0) return;
    await sleep(100);
  }

  for (const pid of pidsOnPort(port).filter((p) => p !== keepPid && p !== process.pid)) {
    try {
      process.kill(pid, "SIGKILL");
      console.log(`[dev-loop] Force-killed PID ${pid} on port ${port}`);
    } catch {
      /* ignore */
    }
  }
  await sleep(200);
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
        DOTENV_CONFIG_PATH: dotenvPath,
      },
      stdio: "inherit",
    },
  );
}

console.log("[dev-loop] Starting API (watch build + auto-restart)…");

let watchBuild = null;
let apiProcess = null;
let stoppingApi = false;
let restartTimer = null;
let pendingRestartTimer = null;
let pendingRestartReason = null;
let lastRestartAt = 0;
let lastBundleMtime = 0;
let launching = false;
let crashRestarts = 0;

let ignoreWatchUntil = 0;

function attachApiExitHandler(child) {
  child.on("exit", (code, signal) => {
    if (apiProcess === child) apiProcess = null;
    if (stoppingApi) return;

    if (code === 0) {
      crashRestarts = 0;
      return;
    }

    crashRestarts += 1;
    const delaySec = Math.min(2 + crashRestarts, 15);
    console.log(
      `[dev-loop] API crashed (${code ?? signal}). Restarting in ${delaySec}s… (attempt ${crashRestarts})`,
    );
    setTimeout(() => void launchApi(), delaySec * 1000);
  });
}

async function stopApi() {
  if (!apiProcess) return;
  const child = apiProcess;
  stoppingApi = true;
  apiProcess = null;
  child.kill("SIGTERM");

  await new Promise((resolve) => {
    const timeout = setTimeout(resolve, 4000);
    child.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });
  });

  stoppingApi = false;
}

async function launchApi() {
  if (launching) return;
  launching = true;
  try {
    await stopApi();
    await freeListenPort(apiPort);
    const child = startApiProcess();
    apiProcess = child;
    crashRestarts = 0;
    ignoreWatchUntil = Date.now() + 3000;
    attachApiExitHandler(child);
  } finally {
    launching = false;
  }
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
      ignoreWatchUntil - Date.now() + 200,
      "API just launched",
    );
    return;
  }
  if (Date.now() - lastRestartAt < 3000) {
    queuePendingRestart(
      reason,
      3000 - (Date.now() - lastRestartAt) + 200,
      "debounce",
    );
    return;
  }

  if (restartTimer) clearTimeout(restartTimer);
  restartTimer = setTimeout(() => {
    restartTimer = null;
    lastRestartAt = Date.now();
    console.log(`[dev-loop] ${reason} — restarting API…`);
    void launchApi();
  }, 500);
}

function readDiskBuildStamp() {
  try {
    return statSync(buildStamp).mtimeMs;
  } catch {
    return 0;
  }
}

function ensureApiRunning() {
  if (launching || stoppingApi) return;

  const diskStampMtime = readDiskBuildStamp();
  if (diskStampMtime > lastBundleMtime) {
    lastBundleMtime = diskStampMtime;
    scheduleApiRestart("bundle stamp newer than tracked mtime");
    return;
  }

  if (apiProcess) {
    const alive = apiProcess.pid && !apiProcess.killed;
    if (alive && isPortListening(apiPort)) return;
    if (!alive) apiProcess = null;
  }

  if (isPortListening(apiPort)) return;

  if (Date.now() - lastRestartAt < 3000) return;

  console.log("[dev-loop] API not listening — starting…");
  lastRestartAt = Date.now();
  void launchApi();
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
    void stopApi().finally(() => process.exit(code ?? 1));
  });

  await launchApi();

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
  }, 2000);

  setInterval(ensureApiRunning, 8000);
}

async function shutdown() {
  if (restartTimer) clearTimeout(restartTimer);
  if (pendingRestartTimer) clearTimeout(pendingRestartTimer);
  if (watchBuild) watchBuild.kill("SIGTERM");
  await stopApi();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());

main().catch((err) => {
  console.error("[dev-loop] Fatal error:", err);
  process.exit(1);
});
