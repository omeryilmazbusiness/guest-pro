import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Load repo-root .env when running from artifacts/api-server (pnpm dev)
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const isProd = process.env.NODE_ENV === "production";
// In dev, repo .env wins over stale shell exports (e.g. truncated Gmail app passwords).
dotenv.config({ path: path.join(repoRoot, ".env"), override: !isProd });
import app from "./app";
import { logger } from "./lib/logger";
import { startScheduler } from "./lib/scheduler";
import { closeRedis } from "./lib/redis";
import { pool } from "@workspace/db";
import { runMigrations } from "@workspace/db";

const port = Number(process.env["PORT"] ?? "3000");

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${process.env["PORT"]}"`);
}

// ── T-13: Unhandled rejection / exception handlers ───────────────────────────
// Catch programming errors that escape async boundaries.
// Log at fatal level so they surface in monitoring, then exit with non-zero
// code so the process manager (Docker, PM2, k8s) restarts the pod.
process.on("unhandledRejection", (reason) => {
  logger.fatal({ reason }, "Unhandled promise rejection — shutting down");
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "Uncaught exception — shutting down");
  process.exit(1);
});

// ── T-13: Graceful shutdown ──────────────────────────────────────────────────
// Module-level server reference so the shutdown handler can close it.
let server: ReturnType<typeof app.listen>;

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, "Shutdown signal received — draining connections");

  server.close(async () => {
    try {
      await closeRedis();       // 1. Release Redis connection
      await pool.end();         // 2. Drain the PostgreSQL pool
      logger.info("Shutdown complete");
      process.exit(0);
    } catch (err) {
      logger.error({ err }, "Error during shutdown — forcing exit");
      process.exit(1);
    }
  });

  // Force-kill if graceful shutdown takes more than 15 s
  setTimeout(() => {
    logger.error("Graceful shutdown timed out — forcing exit");
    process.exit(1);
  }, 15_000).unref();
}

process.on("SIGTERM", () => { shutdown("SIGTERM").catch(() => process.exit(1)); });
process.on("SIGINT",  () => { shutdown("SIGINT").catch(() => process.exit(1)); });

// ── Startup ──────────────────────────────────────────────────────────────────
async function bootstrap(): Promise<void> {
  // T-09: Run pending migrations before accepting traffic.
  // runMigrations() is idempotent — already-applied migrations are skipped.
  try {
    logger.info("Running database migrations...");
    await runMigrations();
    const { ensureLogosDirectory } = await import("./lib/hotel-logo-storage");
    await ensureLogosDirectory();
    logger.info("Migrations complete");
    const { getEmailDeliveryMode } = await import("./config/smtp-config");
    if (getEmailDeliveryMode() === "console") {
      logger.warn(
        "Platform OTP emails log to console only — set GMAIL_USER + GMAIL_APP_PASSWORD (or SMTP_*) in .env",
      );
    } else {
      logger.info("Platform OTP email: SMTP configured");
    }
  } catch (err) {
    logger.fatal({ err }, "Migration failed — refusing to start");
    process.exit(1);
  }

  server = app.listen(port, "0.0.0.0", () => {
    logger.info({ port, host: "0.0.0.0" }, `Server listening on 0.0.0.0:${port}`);
    startScheduler();
  });

  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      logger.fatal(
        { port, err },
        `Port ${port} is already in use. Stop the other process or run: pnpm predev`,
      );
    } else {
      logger.fatal({ err }, "HTTP server error");
    }
    process.exit(1);
  });
}

bootstrap();
