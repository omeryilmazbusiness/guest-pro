/**
 * GuestQrTokenService
 *
 * Handles issuance, validation, consumption, and revocation of single-use QR
 * auto-login tokens.
 *
 * Security design:
 *   - Raw token = 32 cryptographically-random bytes, hex-encoded (64 chars)
 *   - DB only stores SHA-256(rawToken) — a DB breach yields no usable tokens
 *   - Single-use: `usedAt` is set on consumption; repeat attempts are rejected
 *   - Short-lived: 24-hour expiry from issuance
 *   - Revocable: staff can regenerate QR, which revokes all prior tokens for that guest
 *   - Audit: all issuance and consumption events logged to auditLogsTable
 *
 * IMPORTANT — validate-then-consume pattern:
 *   Validation (lookupValidQrToken) and consumption (consumeValidQrToken) are
 *   intentionally separated.  The caller is responsible for running all
 *   business-logic checks (e.g., stay-window validation) BETWEEN the two steps
 *   so that a token is never burned for a denial that will resolve on its own
 *   (e.g., an "upcoming stay" that becomes active the next day).
 *
 *   Concretely:
 *     1. lookupValidQrToken  — validate token without marking it used
 *     2. load guest, check stay window, check any other business rules
 *     3. consumeValidQrToken — mark token used ONLY if all checks pass
 */

import crypto from "crypto";
import { db, guestQrTokensTable, guestsTable, auditLogsTable } from "@workspace/db";
import { eq, and, isNull } from "drizzle-orm";

export const QR_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

// ---------------------------------------------------------------------------
// Shared rejection audit helper
// ---------------------------------------------------------------------------

function logTokenRejection(
  hotelId: number | null,
  guestId: number | null,
  action: string,
  reason: string,
  meta: { ip: string; userAgent?: string }
): void {
  db.insert(auditLogsTable)
    .values({
      hotelId,
      actorId: null,
      actorType: "guest",
      action,
      targetType: guestId != null ? "guest" : "qr_token",
      targetId: guestId,
      metadata: { reason, ip: meta.ip, userAgent: meta.userAgent ?? null },
    })
    .catch(() => {});
}

// ---------------------------------------------------------------------------
// Issue
// ---------------------------------------------------------------------------

/**
 * Issue a new QR auto-login token for a guest.
 * Revokes all prior active tokens for this guest first (optional clean-slate policy).
 */
export async function issueQrToken(
  guestId: number,
  hotelId: number,
  issuedByUserId: number
): Promise<{ rawToken: string; expiresAt: Date }> {
  // Revoke any previous un-used tokens for this guest so only one QR is valid at a time
  await revokeAllGuestQrTokens(guestId);

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + QR_TOKEN_TTL_MS);

  await db.insert(guestQrTokensTable).values({
    guestId,
    hotelId,
    tokenHash,
    issuedByUserId,
    expiresAt,
  });

  db.insert(auditLogsTable)
    .values({
      hotelId,
      actorId: issuedByUserId,
      actorType: "manager",
      action: "qr_token_issued",
      targetType: "guest",
      targetId: guestId,
      metadata: { expiresAt: expiresAt.toISOString() },
    })
    .catch(() => {});

  return { rawToken, expiresAt };
}

// ---------------------------------------------------------------------------
// Validate (without consuming)
// ---------------------------------------------------------------------------

export interface QrTokenValidation {
  /** Internal DB row id — pass to consumeValidQrToken() after business checks pass */
  rowId: number;
  guestId: number;
  hotelId: number;
}

/**
 * Validate a QR token WITHOUT consuming it (marking it as used).
 *
 * Returns a validation handle on success, or null on any failure.
 * Does not alter any DB state — it is safe to call this even if business-logic
 * checks will subsequently reject the login.
 *
 * After calling this and performing all business checks, call
 * consumeValidQrToken(handle.rowId, meta) to finalize consumption.
 */
export async function lookupValidQrToken(
  rawToken: string,
  meta: { ip: string; userAgent?: string }
): Promise<QrTokenValidation | null> {
  const tokenHash = hashToken(rawToken);
  const now = new Date();

  const [row] = await db
    .select()
    .from(guestQrTokensTable)
    .where(eq(guestQrTokensTable.tokenHash, tokenHash));

  if (!row) {
    logTokenRejection(null, null, "qr_token_invalid", "not_found", meta);
    return null;
  }

  if (row.usedAt) {
    logTokenRejection(row.hotelId, row.guestId, "qr_token_replay", "already_used", meta);
    return null;
  }

  if (row.revokedAt) {
    logTokenRejection(row.hotelId, row.guestId, "qr_token_rejected", "revoked", meta);
    return null;
  }

  if (now > row.expiresAt) {
    logTokenRejection(row.hotelId, row.guestId, "qr_token_expired", "expired", meta);
    return null;
  }

  return { rowId: row.id, guestId: row.guestId, hotelId: row.hotelId };
}

// ---------------------------------------------------------------------------
// Consume (after all business checks have passed)
// ---------------------------------------------------------------------------

/**
 * Mark a previously validated QR token as used (single-use enforcement).
 *
 * This MUST be called only AFTER all business-logic checks (stay-window,
 * guest lookup, etc.) have passed.  Never call this if you intend to return
 * an error to the guest — the token should remain available for a future
 * attempt.
 */
export async function consumeValidQrToken(
  rowId: number,
  meta: { ip: string; userAgent?: string }
): Promise<void> {
  const now = new Date();

  const [row] = await db
    .select()
    .from(guestQrTokensTable)
    .where(eq(guestQrTokensTable.id, rowId));

  if (!row) return; // Should not happen — caller validated first

  await db
    .update(guestQrTokensTable)
    .set({ usedAt: now })
    .where(eq(guestQrTokensTable.id, rowId));

  db.insert(auditLogsTable)
    .values({
      hotelId: row.hotelId,
      actorId: null,
      actorType: "guest",
      action: "qr_token_used",
      targetType: "guest",
      targetId: row.guestId,
      metadata: { ip: meta.ip, userAgent: meta.userAgent ?? null },
    })
    .catch(() => {});
}

// ---------------------------------------------------------------------------
// Legacy combined helper (kept for any future callers outside auth routes)
// ---------------------------------------------------------------------------

/**
 * @deprecated Prefer lookupValidQrToken + business checks + consumeValidQrToken.
 *   This combined helper burns the token before business-logic checks run,
 *   which means a stay-window denial permanently invalidates the QR.
 *   It is retained only for backward-compatibility in case external code calls it.
 */
export async function consumeQrToken(
  rawToken: string,
  meta: { ip: string; userAgent?: string }
): Promise<{ guestId: number; hotelId: number } | null> {
  const validation = await lookupValidQrToken(rawToken, meta);
  if (!validation) return null;
  await consumeValidQrToken(validation.rowId, meta);
  return { guestId: validation.guestId, hotelId: validation.hotelId };
}

// ---------------------------------------------------------------------------
// Revoke
// ---------------------------------------------------------------------------

/**
 * Revoke all active (un-used, un-revoked) QR tokens for a guest.
 * Called before issuing a new token so only one valid QR exists per guest.
 */
export async function revokeAllGuestQrTokens(guestId: number): Promise<void> {
  const now = new Date();
  await db
    .update(guestQrTokensTable)
    .set({ revokedAt: now })
    .where(
      and(
        eq(guestQrTokensTable.guestId, guestId),
        isNull(guestQrTokensTable.usedAt),
        isNull(guestQrTokensTable.revokedAt)
      )
    );
}
