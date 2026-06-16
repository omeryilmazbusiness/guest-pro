import { env } from "../config/env";
import { logger } from "./logger";

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

/** Apply schema migrations and ensure writable upload dirs. Fatal in production on failure. */
export async function initializeDatabase(): Promise<boolean> {
  const { runMigrations } = await import("@workspace/db");
  const { ensureLogosDirectory } = await import("./hotel-logo-storage");
  const { getMenuItemsDir, getUploadsRoot } = await import("./uploads-path");
  const fs = await import("node:fs/promises");

  logger.info("Running database migrations...");
  await runMigrations();
  const uploadsRoot = getUploadsRoot();
  await ensureLogosDirectory();
  await fs.mkdir(getMenuItemsDir(), { recursive: true });
  if (env.NODE_ENV === "production" && !process.env.RAILWAY_VOLUME_MOUNT_PATH?.trim()) {
    logger.warn(
      { uploadsRoot },
      "No Railway volume mounted for uploads — logos and menu images are lost on every redeploy. " +
        "Add a volume with mount path /app/uploads in the Railway dashboard.",
    );
  } else {
    logger.info({ uploadsRoot }, "Upload storage ready");
  }
  logger.info("Migrations complete");
  return true;
}

/** Dev-only seeds and non-critical production checks (email, platform settings). Never exits. */
export async function initializeOptionalServices(): Promise<void> {
  if (env.NODE_ENV !== "production") {
    try {
      const { ensureDevPlatformAdmin } = await import(
        "./platform-auth/ensure-dev-platform-admin"
      );
      await ensureDevPlatformAdmin();
    } catch (err) {
      logger.warn({ err, error: errorMessage(err) }, "Dev platform admin seed skipped");
    }
  }

  try {
    const {
      getEmailDeliveryMode,
      getResendFrom,
      validateEmailDeliveryForProduction,
      verifyProductionEmailDelivery,
    } = await import("../config/email-delivery");
    const { verifyResendForProduction } = await import("../config/resend-domains");
    const { platformSettingsRepository } = await import(
      "./platform-auth/platform-settings-repository"
    );

    if (env.NODE_ENV === "production") {
      validateEmailDeliveryForProduction();
      await verifyProductionEmailDelivery();
    }

    const mode = getEmailDeliveryMode();
    const verificationEmail = await platformSettingsRepository.getVerificationEmail();

    if (env.NODE_ENV === "production" && mode === "resend") {
      await verifyResendForProduction(verificationEmail);
      const { resetEmailSender } = await import("./email/create-email-sender");
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
    logger.error(
      { err, error: errorMessage(err) },
      env.NODE_ENV === "production"
        ? "Production email/platform checks failed — server will start; platform OTP may not send until RESEND_API_KEY or Gmail SMTP is configured"
        : "Optional startup checks failed",
    );
  }
}

export { errorMessage };
