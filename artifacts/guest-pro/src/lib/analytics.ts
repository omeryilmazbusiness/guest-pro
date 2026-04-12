/**
 * analytics.ts — client-side API layer for manager analytics.
 * Mirrors the backend route contracts exactly. No business logic here.
 */

import { customFetch } from "@workspace/api-client-react";
import type { ServiceRequestType } from "./service-requests";

// ─── Domain types ─────────────────────────────────────────────────────────────

export interface RequestAnalyticsSnapshot {
  hotelId: number;
  generatedAt: string;
  periodStart: string;
  periodEnd: string;
  totalRequests: number;
  byStatus: { open: number; in_progress: number; resolved: number };
  byType: Record<ServiceRequestType, number>;
  avgResolutionMinutes: number | null;
  longestWaitingMinutes: number | null;
  longestWaitingRequest: {
    id: number;
    summary: string;
    roomNumber: string;
    minutesWaiting: number;
  } | null;
  topRooms: { roomNumber: string; count: number }[];
}

export interface QuickReportResponse extends RequestAnalyticsSnapshot {
  insights: string[];
  recommendations: string[];
}

export interface DailySummaryRecord {
  id: number;
  hotelId: number;
  date: string;
  insights: string[];
  recommendations: string[];
  metricsSnapshot: RequestAnalyticsSnapshot;
  createdAt: string;
}

// ─── API calls ────────────────────────────────────────────────────────────────

export async function getQuickReport(): Promise<QuickReportResponse> {
  return customFetch<QuickReportResponse>("/api/analytics/quick-report");
}

export async function getDailySummaries(): Promise<DailySummaryRecord[]> {
  return customFetch<DailySummaryRecord[]>("/api/analytics/daily-summaries");
}

export async function generateDailySummary(date?: string): Promise<DailySummaryRecord> {
  return customFetch<DailySummaryRecord>("/api/analytics/daily-summaries/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(date ? { date } : {}),
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function formatMinutes(minutes: number | null): string {
  if (minutes === null || minutes === undefined) return "—";
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export const TYPE_LABELS: Record<ServiceRequestType, string> = {
  FOOD_ORDER: "Food Orders",
  SUPPORT_REQUEST: "Support",
  CARE_PROFILE_UPDATE: "Care Profile",
  GENERAL_SERVICE_REQUEST: "General",
};
