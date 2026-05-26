import { db, platformLoginChallengesTable } from "@workspace/db";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { hashOtpCode, PLATFORM_OTP } from "./platform-otp";

/** Do not send another OTP email if the user retries within this window. */
export const PLATFORM_OTP_RESEND_COOLDOWN_MS = 60_000;

export class PlatformChallengeRepository {
  async create(adminId: number, code: string, expiresAt: Date): Promise<string> {
    const [row] = await db
      .insert(platformLoginChallengesTable)
      .values({
        adminId,
        codeHash: hashOtpCode(code),
        expiresAt,
      })
      .returning({ id: platformLoginChallengesTable.id });
    return row!.id;
  }

  /** Latest unconsumed, unexpired challenge for an admin (at most one should be active). */
  async findActiveForAdmin(adminId: number) {
    const [row] = await db
      .select()
      .from(platformLoginChallengesTable)
      .where(
        and(
          eq(platformLoginChallengesTable.adminId, adminId),
          isNull(platformLoginChallengesTable.consumedAt),
          gt(platformLoginChallengesTable.expiresAt, new Date()),
        ),
      )
      .orderBy(desc(platformLoginChallengesTable.createdAt))
      .limit(1);
    return row ?? null;
  }

  async findActive(challengeId: string) {
    const [row] = await db
      .select()
      .from(platformLoginChallengesTable)
      .where(
        and(
          eq(platformLoginChallengesTable.id, challengeId),
          isNull(platformLoginChallengesTable.consumedAt),
          gt(platformLoginChallengesTable.expiresAt, new Date()),
        ),
      );
    return row ?? null;
  }

  async incrementAttempts(challengeId: string): Promise<number> {
    const row = await this.findActive(challengeId);
    if (!row) return PLATFORM_OTP.maxVerifyAttempts;
    const next = row.attemptCount + 1;
    await db
      .update(platformLoginChallengesTable)
      .set({ attemptCount: next })
      .where(eq(platformLoginChallengesTable.id, challengeId));
    return next;
  }

  async markConsumed(challengeId: string): Promise<void> {
    await db
      .update(platformLoginChallengesTable)
      .set({ consumedAt: new Date() })
      .where(eq(platformLoginChallengesTable.id, challengeId));
  }

  /** Invalidate stale OTP sessions before issuing a new code. */
  async consumePendingForAdmin(adminId: number): Promise<void> {
    await db
      .update(platformLoginChallengesTable)
      .set({ consumedAt: new Date() })
      .where(
        and(
          eq(platformLoginChallengesTable.adminId, adminId),
          isNull(platformLoginChallengesTable.consumedAt),
        ),
      );
  }
}

export const platformChallengeRepository = new PlatformChallengeRepository();
