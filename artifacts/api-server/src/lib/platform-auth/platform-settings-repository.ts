import { db, platformSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { env } from "../../config/env";
import { DEFAULT_PLATFORM_AI } from "../hotel-ai/defaults";
import type { PlatformAiDefaults } from "../hotel-ai/types";

const SETTINGS_ID = 1;

export interface PlatformSettingsDto {
  verificationEmail: string;
  ai: PlatformAiDefaults;
}

export class PlatformSettingsRepository {
  async getSettings(): Promise<PlatformSettingsDto> {
    const [row] = await db
      .select()
      .from(platformSettingsTable)
      .where(eq(platformSettingsTable.id, SETTINGS_ID));

    return {
      verificationEmail: row?.verificationEmail ?? env.PLATFORM_VERIFICATION_EMAIL_DEFAULT,
      ai: row
        ? {
            defaultMonthlyTokenBudget: row.aiDefaultMonthlyTokenBudget,
            starterMonthlyBudget: row.aiStarterMonthlyBudget,
            growthMonthlyBudget: row.aiGrowthMonthlyBudget,
            enterpriseMonthlyBudget: row.aiEnterpriseMonthlyBudget,
            defaultMaxOutputTaskReport: row.aiDefaultMaxOutputTaskReport,
            defaultMaxOutputDailySummary: row.aiDefaultMaxOutputDailySummary,
            defaultMaxOutputQuickReport: row.aiDefaultMaxOutputQuickReport,
          }
        : DEFAULT_PLATFORM_AI,
    };
  }

  async getVerificationEmail(): Promise<string> {
    const settings = await this.getSettings();
    return settings.verificationEmail;
  }

  async setVerificationEmail(email: string, updatedBy: number): Promise<string> {
    const normalized = email.trim().toLowerCase();
    await this.ensureRow(updatedBy);
    await db
      .update(platformSettingsTable)
      .set({ verificationEmail: normalized, updatedBy })
      .where(eq(platformSettingsTable.id, SETTINGS_ID));
    return normalized;
  }

  async updateAiDefaults(
    ai: Partial<PlatformAiDefaults>,
    updatedBy: number,
  ): Promise<PlatformAiDefaults> {
    await this.ensureRow(updatedBy);
    const updates: Partial<typeof platformSettingsTable.$inferInsert> = { updatedBy };
    if (ai.defaultMonthlyTokenBudget !== undefined) {
      updates.aiDefaultMonthlyTokenBudget = ai.defaultMonthlyTokenBudget;
    }
    if (ai.starterMonthlyBudget !== undefined) {
      updates.aiStarterMonthlyBudget = ai.starterMonthlyBudget;
    }
    if (ai.growthMonthlyBudget !== undefined) {
      updates.aiGrowthMonthlyBudget = ai.growthMonthlyBudget;
    }
    if (ai.enterpriseMonthlyBudget !== undefined) {
      updates.aiEnterpriseMonthlyBudget = ai.enterpriseMonthlyBudget;
    }
    if (ai.defaultMaxOutputTaskReport !== undefined) {
      updates.aiDefaultMaxOutputTaskReport = ai.defaultMaxOutputTaskReport;
    }
    if (ai.defaultMaxOutputDailySummary !== undefined) {
      updates.aiDefaultMaxOutputDailySummary = ai.defaultMaxOutputDailySummary;
    }
    if (ai.defaultMaxOutputQuickReport !== undefined) {
      updates.aiDefaultMaxOutputQuickReport = ai.defaultMaxOutputQuickReport;
    }
    await db
      .update(platformSettingsTable)
      .set(updates)
      .where(eq(platformSettingsTable.id, SETTINGS_ID));
    const settings = await this.getSettings();
    return settings.ai;
  }

  private async ensureRow(updatedBy: number): Promise<void> {
    const [existing] = await db
      .select({ id: platformSettingsTable.id })
      .from(platformSettingsTable)
      .where(eq(platformSettingsTable.id, SETTINGS_ID));
    if (existing) return;
    await db.insert(platformSettingsTable).values({
      id: SETTINGS_ID,
      verificationEmail: env.PLATFORM_VERIFICATION_EMAIL_DEFAULT,
      updatedBy,
    });
  }
}

export const platformSettingsRepository = new PlatformSettingsRepository();
