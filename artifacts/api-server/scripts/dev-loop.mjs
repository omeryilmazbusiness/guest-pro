/**
 * Dev server loop: rebuild + start API; auto-restart after exit (crash or SIGTERM).
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function run(cmd, args, opts = {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { stdio: "inherit", ...opts });
    child.on("exit", (code) => resolve(code ?? 0));
  });
}

async function startApi() {
  const buildCode = await run("pnpm", ["run", "build"], { cwd: apiRoot });
  if (buildCode !== 0) {
    console.error("[dev-loop] Build failed");
    return buildCode;
  }

  return run(
    "node",
    ["--import", "dotenv/config", "--enable-source-maps", "./dist/index.mjs"],
    {
      cwd: apiRoot,
      env: {
        ...process.env,
        NODE_ENV: "development",
        DOTENV_CONFIG_PATH: "../../.env",
      },
    },
  );
}

console.log("[dev-loop] Starting API (auto-restart enabled)…");

const MAX_FATAL_RESTARTS = 8;
let fatalRestarts = 0;

while (true) {
  const code = await startApi();
  if (code === 0) {
    fatalRestarts = 0;
    console.log("[dev-loop] API stopped cleanly.");
    break;
  }

  fatalRestarts += 1;
  if (fatalRestarts >= MAX_FATAL_RESTARTS) {
    console.error(
      "\n[dev-loop] API failed to stay up after",
      MAX_FATAL_RESTARTS,
      "attempts.",
    );
    console.error(
      "[dev-loop] If logs show ECONNREFUSED on DATABASE_URL, start PostgreSQL or run ./setup-local.sh",
    );
    console.error(
      "[dev-loop] Marketing contact form can still run in marketing-only mode once the server listens — check the latest log line.",
    );
    process.exit(code);
  }

  const delaySec = Math.min(2 + fatalRestarts, 15);
  console.log(
    `[dev-loop] API stopped (exit ${code}). Restarting in ${delaySec}s… (${fatalRestarts}/${MAX_FATAL_RESTARTS})`,
  );
  await new Promise((r) => setTimeout(r, delaySec * 1000));
}
