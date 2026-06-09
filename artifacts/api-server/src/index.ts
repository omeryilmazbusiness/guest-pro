import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Load repo-root .env when running from artifacts/api-server (pnpm dev)
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const isProd = process.env.NODE_ENV === "production";
// In dev, repo .env wins over stale shell exports (e.g. truncated Gmail app passwords).
dotenv.config({ path: path.join(repoRoot, ".env"), override: !isProd });
import app from "./app";
import { env } from "./config/env";
import { logger } from "./lib/logger";
import { startScheduler } from "./lib/scheduler";
import { closeRedis, initRedis, redisClient } from "./lib/redis";
import { ensureOAuthMemoryCleanup } from "./lib/oauth-state-store";
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

function isDatabaseUnreachable(err: unknown): boolean {
  const codes = new Set(["ECONNREFUSED", "ENOTFOUND", "ETIMEDOUT", "ECONNRESET"]);
  let current: unknown = err;
  for (let depth = 0; depth < 4 && current; depth++) {
    if (typeof current === "object" && current !== null) {
      const code = (current as { code?: string }).code;
      if (code && codes.has(code)) return true;
      current = (current as { cause?: unknown }).cause;
    } else {
      break;
    }
  }
  return false;
}

// ── Startup ──────────────────────────────────────────────────────────────────
async function bootstrap(): Promise<void> {
  let dbReady = false;

  try {
    await initRedis();
    if (!redisClient) {
      ensureOAuthMemoryCleanup();
    }
  } catch (err) {
    logger.fatal({ err }, "Redis startup failed");
    process.exit(1);
  }

  // T-09: Run pending migrations before accepting traffic (required in production).
  try {
    logger.info("Running database migrations...");
    await runMigrations();
    const { ensureLogosDirectory } = await import("./lib/hotel-logo-storage");
    await ensureLogosDirectory();
    logger.info("Migrations complete");
    dbReady = true;

    if (env.NODE_ENV !== "production") {
      const { ensureDevPlatformAdmin } = await import(
        "./lib/platform-auth/ensure-dev-platform-admin"
      );
      await ensureDevPlatformAdmin();
    }

    const {
      getEmailDeliveryMode,
      getResendFrom,
      validateEmailDeliveryForProduction,
      verifyProductionEmailDelivery,
    } = await import("./config/email-delivery");
    const { verifyResendForProduction } = await import("./config/resend-domains");
    const { platformSettingsRepository } = await import(
      "./lib/platform-auth/platform-settings-repository"
    );
    if (env.NODE_ENV === "production") {
      validateEmailDeliveryForProduction();
      await verifyProductionEmailDelivery();
    }
    const mode = getEmailDeliveryMode();
    const verificationEmail = await platformSettingsRepository.getVerificationEmail();
    if (env.NODE_ENV === "production" && mode === "resend") {
      await verifyResendForProduction(verificationEmail);
      const { resetEmailSender } = await import("./lib/email/create-email-sender");
      resetEmailSender();
    }
    if (mode === "console") {
      logger.warn(
        "Platform OTP emails log to console only — set RESEND_API_KEY or GMAIL_APP_PASSWORD",
      );
    } else {
      logger.info(
        { mode, verificationEmail, from: mode === "resend" ? getResendFrom() : undefined },
        `Platform OTP email: ${mode} configured`,
      );
    }
  } catch (err) {
    if (env.NODE_ENV === "production") {
      logger.fatal({ err }, "Production startup failed after migrations — refusing to start");
      process.exit(1);
    }

    if (isDatabaseUnreachable(err)) {
      logger.warn(
        { err },
        "PostgreSQL unreachable — starting in marketing-only mode (contact form and public routes work). Fix DATABASE_URL or start Postgres for full API.",
      );
    } else {
      logger.warn(
        { err },
        "Database startup failed — HTTP server will start but hotel/app routes may error",
      );
    }
  }

  server = app.listen(port, "0.0.0.0", () => {
    logger.info(
      { port, host: "0.0.0.0", dbReady },
      `Server listening on 0.0.0.0:${port}${dbReady ? "" : " (marketing-only)"}`,
    );
    if (dbReady) {
      startScheduler();
    } else {
      logger.warn("Background scheduler skipped (database unavailable)");
    }
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
