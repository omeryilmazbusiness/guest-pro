import crypto from "crypto";
import { logger } from "../logger";

export type PlatformAuthStage =
  | "login_request"
  | "lockout_check"
  | "credentials_verify"
  | "settings_load"
  | "challenge_reuse"
  | "challenge_create"
  | "email_send"
  | "login_success"
  | "verify_request"
  | "verify_challenge"
  | "verify_success"
  | "auth_error";

export interface PlatformAuthLogger {
  requestId: string;
  stage(stage: PlatformAuthStage, extra?: Record<string, unknown>): void;
  fail(stage: PlatformAuthStage, err: unknown, extra?: Record<string, unknown>): void;
}

export function newRequestId(headerValue?: string | string[]): string {
  const fromHeader = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  if (fromHeader && fromHeader.trim().length >= 8) return fromHeader.trim().slice(0, 64);
  return crypto.randomUUID();
}

export function createPlatformAuthLogger(requestId: string): PlatformAuthLogger {
  const started = Date.now();
  let prev = started;

  const base = { event: "platform_auth", requestId };

  return {
    requestId,
    stage(stage, extra) {
      const now = Date.now();
      logger.info(
        {
          ...base,
          stage,
          msTotal: now - started,
          msStep: now - prev,
          ...extra,
        },
        `platform_auth:${stage}`,
      );
      prev = now;
    },
    fail(stage, err, extra) {
      logger.error(
        {
          ...base,
          stage,
          msTotal: Date.now() - started,
          err,
          errorMessage: err instanceof Error ? err.message : String(err),
          ...extra,
        },
        `platform_auth:${stage}:failed`,
      );
    },
  };
}
