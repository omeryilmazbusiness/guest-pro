/**
 * GuestQrTokenService
 *
 * Handles issuance, consumption, and revocation of single-use QR auto-login tokens.
 *
 * Security design:
 *   - Raw token = 32 cryptographically-random bytes, hex-encoded (64 chars)
 *   - DB only stores SHA-256(rawToken) — a DB breach yields no usable tokens
 *   - Single-use: `usedAt` is set on consumption; repeat attempts are rejected
 *   - Short-lived: 24-hour expiry from issuance
 *   - Revocable: staff can regenerate QR, which revokes all prior tokens for that guest
 *   - Audit: all issuance and consumption events logged to auditLogsTable
 */

import crypto from "crypto";
import { db, guestQrTokensTable, guestsTable, auditLogsTable } from "@workspace/db";
import { eq, and, isNull } from "drizzle-orm";

export const QR_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

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

/**
 * Consume a QR auto-login token (single-use).
 * Returns the associated guest record on success, or null on any failure.
 */
export async function consumeQrToken(
  rawToken: string,
  meta: { ip: string; userAgent?: string }
): Promise<{ guestId: number; hotelId: number } | null> {
  const tokenHash = hashToken(rawToken);
  const now = new Date();

  const [row] = await db
    .select()
    .from(guestQrTokensTable)
    .where(eq(guestQrTokensTable.tokenHash, tokenHash));

  if (!row) {
    db.insert(auditLogsTable)
      .values({
        hotelId: null,
        actorId: null,
        actorType: "guest",
        action: "qr_token_invalid",
        targetType: "qr_token",
        targetId: null,
        metadata: { reason: "not_found", ip: meta.ip },
      })
      .catch(() => {});
    return null;
  }

  if (row.usedAt) {
    db.insert(auditLogsTable)
      .values({
        hotelId: row.hotelId,
        actorId: null,
        actorType: "guest",
        action: "qr_token_replay",
        targetType: "guest",
        targetId: row.guestId,
        metadata: { reason: "already_used", usedAt: row.usedAt.toISOString(), ip: meta.ip },
      })
      .catch(() => {});
    return null;
  }

  if (row.revokedAt) {
    db.insert(auditLogsTable)
      .values({
        hotelId: row.hotelId,
        actorId: null,
        actorType: "guest",
        action: "qr_token_rejected",
        targetType: "guest",
        targetId: row.guestId,
        metadata: { reason: "revoked", ip: meta.ip },
      })
      .catch(() => {});
    return null;
  }

  if (now > row.expiresAt) {
    db.insert(auditLogsTable)
      .values({
        hotelId: row.hotelId,
        actorId: null,
        actorType: "guest",
        action: "qr_token_expired",
        targetType: "guest",
        targetId: row.guestId,
        metadata: { reason: "expired", expiresAt: row.expiresAt.toISOString(), ip: meta.ip },
      })
      .catch(() => {});
    return null;
  }

  // Mark as used (single-use enforcement)
  await db
    .update(guestQrTokensTable)
    .set({ usedAt: now })
    .where(eq(guestQrTokensTable.id, row.id));

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

  return { guestId: row.guestId, hotelId: row.hotelId };
}

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
