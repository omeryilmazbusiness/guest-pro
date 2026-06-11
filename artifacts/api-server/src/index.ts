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
import {
  errorMessage,
  initializeDatabase,
  initializeOptionalServices,
} from "./lib/startup-services";
import { elevenLabsConfig } from "./lib/elevenlabs/config";
import { isElevenLabsApiKeyValid } from "./lib/elevenlabs/api-key-verify";

const port = Number(process.env["PORT"] ?? "3000");

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${process.env["PORT"]}"`);
}

// ── T-13: Unhandled rejection / exception handlers ───────────────────────────
process.on("unhandledRejection", (reason) => {
  logger.fatal({ reason }, "Unhandled promise rejection — shutting down");
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "Uncaught exception — shutting down");
  process.exit(1);
});

// ── T-13: Graceful shutdown ──────────────────────────────────────────────────
let server: ReturnType<typeof app.listen>;

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, "Shutdown signal received — draining connections");

  server.close(async () => {
    try {
      await closeRedis();
      await pool.end();
      logger.info("Shutdown complete");
      process.exit(0);
    } catch (err) {
      logger.error({ err }, "Error during shutdown — forcing exit");
      process.exit(1);
    }
  });

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

  try {
    dbReady = await initializeDatabase();
  } catch (err) {
    if (env.NODE_ENV === "production") {
      logger.fatal(
        { err, error: errorMessage(err) },
        "Database migration failed — refusing to start",
      );
      process.exit(1);
    }

    if (isDatabaseUnreachable(err)) {
      logger.warn(
        { err },
        "PostgreSQL unreachable — starting in marketing-only mode (contact form and public routes work). Fix DATABASE_URL or start Postgres for full API.",
      );
    } else {
      logger.warn(
        { err, error: errorMessage(err) },
        "Database startup failed — HTTP server will start but hotel/app routes may error",
      );
    }
  }

  if (dbReady) {
    await initializeOptionalServices();
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

    if (elevenLabsConfig.isConfigured) {
      void isElevenLabsApiKeyValid().then((valid) => {
        if (valid) {
          logger.info(
            {
              voiceId: elevenLabsConfig.voiceId,
              modelId: elevenLabsConfig.modelId,
              monthlyCharLimit: elevenLabsConfig.monthlyCharLimit,
            },
            "ElevenLabs TTS enabled",
          );
        } else {
          logger.warn(
            "ElevenLabs TTS misconfigured — check ELEVENLABS_API_KEY on Railway (invalid or rejected)",
          );
        }
      });
    } else {
      logger.info("ElevenLabs TTS disabled (ELEVENLABS_API_KEY not set)");
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
