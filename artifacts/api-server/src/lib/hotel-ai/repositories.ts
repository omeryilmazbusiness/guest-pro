import {
  db,
  hotelAiConfigsTable,
  hotelAiUsageTable,
  hotelsTable,
  platformSettingsTable,
} from "@workspace/db";
import { and, eq } from "drizzle-orm";
import type { HotelPlanTier } from "../hotel-provisioning";
import {
  currentPeriodKey,
  DEFAULT_PLATFORM_AI,
  planTierMonthlyBudget,
} from "./defaults";
import type {
  HotelAiConfigDto,
  HotelAiFeature,
  HotelAiUsageSnapshot,
  PlatformAiDefaults,
} from "./types";

const SETTINGS_ID = 1;

export class HotelAiConfigRepository {
  async getPlatformDefaults(): Promise<PlatformAiDefaults> {
    const [row] = await db.select().from(platformSettingsTable).where(eq(platformSettingsTable.id, SETTINGS_ID));
    if (!row) return DEFAULT_PLATFORM_AI;
    return {
      defaultMonthlyTokenBudget: row.aiDefaultMonthlyTokenBudget,
      starterMonthlyBudget: row.aiStarterMonthlyBudget,
      growthMonthlyBudget: row.aiGrowthMonthlyBudget,
      enterpriseMonthlyBudget: row.aiEnterpriseMonthlyBudget,
      defaultMaxOutputTaskReport: row.aiDefaultMaxOutputTaskReport,
      defaultMaxOutputDailySummary: row.aiDefaultMaxOutputDailySummary,
      defaultMaxOutputQuickReport: row.aiDefaultMaxOutputQuickReport,
    };
  }

  async ensureConfig(hotelId: number): Promise<void> {
    const [existing] = await db
      .select({ id: hotelAiConfigsTable.id })
      .from(hotelAiConfigsTable)
      .where(eq(hotelAiConfigsTable.hotelId, hotelId));
    if (existing) return;
    await db.insert(hotelAiConfigsTable).values({ hotelId });
  }

  async getConfig(hotelId: number): Promise<HotelAiConfigDto | null> {
    const [row] = await db
      .select()
      .from(hotelAiConfigsTable)
      .where(eq(hotelAiConfigsTable.hotelId, hotelId));
    if (!row) return null;
    return mapConfig(row);
  }

  async upsertConfig(
    hotelId: number,
    patch: Partial<Omit<HotelAiConfigDto, "hotelId">>,
  ): Promise<HotelAiConfigDto> {
    await this.ensureConfig(hotelId);
    const updates: Partial<typeof hotelAiConfigsTable.$inferInsert> = {};
    if (patch.monthlyTokenBudget !== undefined) {
      updates.monthlyTokenBudget = patch.monthlyTokenBudget;
    }
    if (patch.maxOutputTokensTaskReport !== undefined) {
      updates.maxOutputTokensTaskReport = patch.maxOutputTokensTaskReport;
    }
    if (patch.maxOutputTokensDailySummary !== undefined) {
      updates.maxOutputTokensDailySummary = patch.maxOutputTokensDailySummary;
    }
    if (patch.maxOutputTokensQuickReport !== undefined) {
      updates.maxOutputTokensQuickReport = patch.maxOutputTokensQuickReport;
    }
    if (patch.taskReportsEnabled !== undefined) {
      updates.taskReportsEnabled = patch.taskReportsEnabled;
    }
    if (patch.dailySummariesEnabled !== undefined) {
      updates.dailySummariesEnabled = patch.dailySummariesEnabled;
    }
    if (patch.quickReportsEnabled !== undefined) {
      updates.quickReportsEnabled = patch.quickReportsEnabled;
    }
    if (Object.keys(updates).length > 0) {
      await db
        .update(hotelAiConfigsTable)
        .set(updates)
        .where(eq(hotelAiConfigsTable.hotelId, hotelId));
    }
    const updated = await this.getConfig(hotelId);
    if (!updated) throw new Error("Failed to save AI config");
    return updated;
  }

  async getHotelPlanTier(hotelId: number): Promise<HotelPlanTier> {
    const [hotel] = await db
      .select({ planTier: hotelsTable.planTier })
      .from(hotelsTable)
      .where(eq(hotelsTable.id, hotelId));
    return (hotel?.planTier ?? "starter") as HotelPlanTier;
  }
}

export class HotelAiUsageRepository {
  async getUsage(hotelId: number, periodKey = currentPeriodKey()): Promise<HotelAiUsageSnapshot> {
    const defaults = await hotelAiConfigRepository.getPlatformDefaults();
    const planTier = await hotelAiConfigRepository.getHotelPlanTier(hotelId);
    const config = await hotelAiConfigRepository.getConfig(hotelId);
    await hotelAiConfigRepository.ensureConfig(hotelId);

    const monthlyBudget =
      config?.monthlyTokenBudget ?? planTierMonthlyBudget(planTier, defaults);

    const [row] = await db
      .select()
      .from(hotelAiUsageTable)
      .where(
        and(
          eq(hotelAiUsageTable.hotelId, hotelId),
          eq(hotelAiUsageTable.periodKey, periodKey),
        ),
      );

    const tokensUsed = row?.tokensUsed ?? 0;
    const remainingTokens = Math.max(0, monthlyBudget - tokensUsed);

    return {
      periodKey,
      tokensUsed,
      requestCount: row?.requestCount ?? 0,
      monthlyBudget,
      remainingTokens,
      usagePercent: monthlyBudget > 0 ? Math.round((tokensUsed / monthlyBudget) * 100) : 0,
      byFeature: {
        taskReport: row?.taskReportTokens ?? 0,
        dailySummary: row?.dailySummaryTokens ?? 0,
        quickReport: row?.quickReportTokens ?? 0,
      },
    };
  }

  async addUsage(
    hotelId: number,
    feature: HotelAiFeature,
    tokens: number,
    periodKey = currentPeriodKey(),
  ): Promise<void> {
    if (tokens <= 0) return;

    const [existing] = await db
      .select()
      .from(hotelAiUsageTable)
      .where(
        and(
          eq(hotelAiUsageTable.hotelId, hotelId),
          eq(hotelAiUsageTable.periodKey, periodKey),
        ),
      );

    if (existing) {
      await db
        .update(hotelAiUsageTable)
        .set({
          tokensUsed: existing.tokensUsed + tokens,
          requestCount: existing.requestCount + 1,
          taskReportTokens:
            existing.taskReportTokens + (feature === "task_report" ? tokens : 0),
          dailySummaryTokens:
            existing.dailySummaryTokens + (feature === "daily_summary" ? tokens : 0),
          quickReportTokens:
            existing.quickReportTokens + (feature === "quick_report" ? tokens : 0),
        })
        .where(eq(hotelAiUsageTable.id, existing.id));
      return;
    }

    await db.insert(hotelAiUsageTable).values({
      hotelId,
      periodKey,
      tokensUsed: tokens,
      requestCount: 1,
      taskReportTokens: feature === "task_report" ? tokens : 0,
      dailySummaryTokens: feature === "daily_summary" ? tokens : 0,
      quickReportTokens: feature === "quick_report" ? tokens : 0,
    });
  }
}

function mapConfig(row: typeof hotelAiConfigsTable.$inferSelect): HotelAiConfigDto {
  return {
    hotelId: row.hotelId,
    monthlyTokenBudget: row.monthlyTokenBudget,
    maxOutputTokensTaskReport: row.maxOutputTokensTaskReport,
    maxOutputTokensDailySummary: row.maxOutputTokensDailySummary,
    maxOutputTokensQuickReport: row.maxOutputTokensQuickReport,
    taskReportsEnabled: row.taskReportsEnabled,
    dailySummariesEnabled: row.dailySummariesEnabled,
    quickReportsEnabled: row.quickReportsEnabled,
  };
}

export const hotelAiConfigRepository = new HotelAiConfigRepository();
export const hotelAiUsageRepository = new HotelAiUsageRepository();
