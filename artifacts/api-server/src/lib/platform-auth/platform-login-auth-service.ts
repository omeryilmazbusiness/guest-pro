import { db, platformAdminsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authenticatePlatformAdmin, generatePlatformAdminToken } from "../auth";
import { env } from "../../config/env";
import { getEmailDeliveryMode, getEmailSender } from "../email/create-email-sender";
import type { EmailDeliveryMode } from "../../config/smtp-config";
import {
  platformChallengeRepository,
  PLATFORM_OTP_RESEND_COOLDOWN_MS,
} from "./platform-challenge-repository";
import { platformLoginLockout } from "./platform-login-lockout";
import {
  generateOtpCode,
  maskEmail,
  otpExpiresAt,
  PLATFORM_OTP,
  verifyOtpCode,
} from "./platform-otp";
import { platformSettingsRepository } from "./platform-settings-repository";
import type { PlatformAuthLogger } from "./platform-auth-log";

export class PlatformAuthError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly retryAfterMs?: number,
  ) {
    super(message);
    this.name = "PlatformAuthError";
  }
}

export interface LoginChallengeResult {
  challengeId: string;
  expiresAt: string;
  expiresInSeconds: number;
  verificationEmailMasked: string;
  emailDelivery: EmailDeliveryMode;
  /** False when an existing OTP was reused (no second email). */
  resent: boolean;
  requestId?: string;
}

export interface LoginCompleteResult {
  token: string;
  user: {
    id: number;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: "platform_admin";
  };
  requestId?: string;
}

export class PlatformLoginAuthService {
  async startLogin(
    email: string,
    password: string,
    log?: PlatformAuthLogger,
  ): Promise<LoginChallengeResult> {
    const normalized = platformLoginLockout.normalizeEmail(email);
    log?.stage("login_request", { email: normalized });

    log?.stage("lockout_check");
    const lockout = await platformLoginLockout.check(normalized);
    if (!lockout.allowed) {
      throw new PlatformAuthError(
        lockout.message ?? "Too many failed attempts.",
        429,
        lockout.retryAfterMs,
      );
    }

    log?.stage("credentials_verify");
    const admin = await authenticatePlatformAdmin(email, password);
    if (!admin) {
      const afterFail = await platformLoginLockout.recordFailure(normalized);
      if (!afterFail.allowed) {
        throw new PlatformAuthError(
          afterFail.message ?? "Too many failed attempts.",
          429,
          afterFail.retryAfterMs,
        );
      }
      throw new PlatformAuthError("Invalid credentials", 401);
    }

    log?.stage("settings_load", { adminId: admin.id });
    const verificationEmail = await platformSettingsRepository.getVerificationEmail();
    const emailDelivery = getEmailDeliveryMode();
    const verificationEmailMasked = maskEmail(verificationEmail);

    const existing = await platformChallengeRepository.findActiveForAdmin(admin.id);
    if (
      existing &&
      Date.now() - existing.createdAt.getTime() < PLATFORM_OTP_RESEND_COOLDOWN_MS
    ) {
      log?.stage("challenge_reuse", { challengeId: existing.id, emailDelivery });
      return {
        challengeId: existing.id,
        expiresAt: existing.expiresAt.toISOString(),
        expiresInSeconds: Math.max(
          0,
          Math.floor((existing.expiresAt.getTime() - Date.now()) / 1000),
        ),
        verificationEmailMasked,
        emailDelivery,
        resent: false,
        requestId: log?.requestId,
      };
    }

    await platformChallengeRepository.consumePendingForAdmin(admin.id);
    const code = generateOtpCode();
    const expiresAt = otpExpiresAt();
    const challengeId = await platformChallengeRepository.create(admin.id, code, expiresAt);
    log?.stage("challenge_create", { challengeId, emailDelivery });

    if (emailDelivery === "console" && env.NODE_ENV === "production") {
      throw new PlatformAuthError(
        "Email delivery is not configured. Set SMTP or GMAIL_APP_PASSWORD on the server.",
        503,
      );
    }

    const sender = getEmailSender();
    try {
      log?.stage("email_send", { to: maskEmail(verificationEmail), emailDelivery });
      await sender.send({
        to: verificationEmail,
        subject: "Guest Pro — platform sign-in code",
        text: [
          "Your platform sign-in verification code is:",
          "",
          code,
          "",
          "This code expires in 3 minutes.",
          "If you did not request this, ignore this email.",
        ].join("\n"),
        html: `<p>Your platform sign-in verification code is:</p><p style="font-size:28px;font-weight:bold;letter-spacing:4px">${code}</p><p>This code expires in 3 minutes.</p>`,
      });
    } catch (err) {
      log?.fail("email_send", err, { emailDelivery });
      const message =
        err instanceof Error && /timed out/i.test(err.message)
          ? "Verification email timed out. Check SMTP/Gmail settings on the server."
          : err instanceof Error
            ? err.message
            : "Could not send verification email";
      throw new PlatformAuthError(message, 502);
    }

    log?.stage("login_success", { challengeId, resent: true, emailDelivery });
    return {
      challengeId,
      expiresAt: expiresAt.toISOString(),
      expiresInSeconds: Math.floor(PLATFORM_OTP.ttlMs / 1000),
      verificationEmailMasked,
      emailDelivery,
      resent: true,
      requestId: log?.requestId,
    };
  }

  async verifyOtp(
    challengeId: string,
    code: string,
    loginEmail: string,
    log?: PlatformAuthLogger,
  ): Promise<LoginCompleteResult> {
    const normalized = platformLoginLockout.normalizeEmail(loginEmail);
    log?.stage("verify_request", { email: normalized, challengeId });

    const lockout = await platformLoginLockout.check(normalized);
    if (!lockout.allowed) {
      throw new PlatformAuthError(
        lockout.message ?? "Too many failed attempts.",
        429,
        lockout.retryAfterMs,
      );
    }

    log?.stage("verify_challenge");
    const challenge = await platformChallengeRepository.findActive(challengeId);
    if (!challenge) {
      throw new PlatformAuthError("Verification code expired or invalid. Sign in again.", 400);
    }

    if (!verifyOtpCode(code, challenge.codeHash)) {
      const attempts = await platformChallengeRepository.incrementAttempts(challengeId);
      const afterFail = await platformLoginLockout.recordFailure(normalized);
      if (!afterFail.allowed) {
        throw new PlatformAuthError(
          afterFail.message ?? "Too many failed attempts.",
          429,
          afterFail.retryAfterMs,
        );
      }
      if (attempts >= PLATFORM_OTP.maxVerifyAttempts) {
        throw new PlatformAuthError(
          "Too many incorrect codes for this session. Sign in again.",
          400,
        );
      }
      throw new PlatformAuthError("Invalid verification code", 401);
    }

    const [admin] = await db
      .select()
      .from(platformAdminsTable)
      .where(eq(platformAdminsTable.id, challenge.adminId));
    if (!admin || !admin.isActive) {
      throw new PlatformAuthError("Account unavailable", 403);
    }

    await platformChallengeRepository.markConsumed(challengeId);
    await platformLoginLockout.clear(normalized);

    const token = generatePlatformAdminToken(admin.id);
    log?.stage("verify_success", { adminId: admin.id });
    return {
      token,
      user: {
        id: admin.id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: "platform_admin",
      },
      requestId: log?.requestId,
    };
  }
}

export const platformLoginAuthService = new PlatformLoginAuthService();
