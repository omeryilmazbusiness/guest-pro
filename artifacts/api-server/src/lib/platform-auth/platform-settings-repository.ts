import { db, platformSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { env } from "../../config/env";

const SETTINGS_ID = 1;

export class PlatformSettingsRepository {
  async getVerificationEmail(): Promise<string> {
    const [row] = await db
      .select({ verificationEmail: platformSettingsTable.verificationEmail })
      .from(platformSettingsTable)
      .where(eq(platformSettingsTable.id, SETTINGS_ID));

    return row?.verificationEmail ?? env.PLATFORM_VERIFICATION_EMAIL_DEFAULT;
  }

  async setVerificationEmail(email: string, updatedBy: number): Promise<string> {
    const normalized = email.trim().toLowerCase();
    const [existing] = await db
      .select({ id: platformSettingsTable.id })
      .from(platformSettingsTable)
      .where(eq(platformSettingsTable.id, SETTINGS_ID));

    if (existing) {
      await db
        .update(platformSettingsTable)
        .set({ verificationEmail: normalized, updatedBy })
        .where(eq(platformSettingsTable.id, SETTINGS_ID));
    } else {
      await db.insert(platformSettingsTable).values({
        id: SETTINGS_ID,
        verificationEmail: normalized,
        updatedBy,
      });
    }
    return normalized;
  }
}

export const platformSettingsRepository = new PlatformSettingsRepository();
