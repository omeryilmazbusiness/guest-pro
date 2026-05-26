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

while (true) {
  const code = await startApi();
  console.log(`[dev-loop] API stopped (exit ${code}). Restarting in 2s…`);
  await new Promise((r) => setTimeout(r, 2000));
}
