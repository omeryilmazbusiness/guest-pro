/**
 * analytics.ts — client-side API layer for manager analytics.
 * Mirrors the backend route contracts exactly. No business logic here.
 */

import { customFetch } from "@workspace/api-client-react";
import type { ServiceRequestType } from "./service-requests";

// ─── Domain types ─────────────────────────────────────────────────────────────

export interface ActiveIssue {
  id: number;
  requestType: ServiceRequestType;
  status: "open" | "in_progress";
  summary: string;
  roomNumber: string;
  guestName: string;
  minutesWaiting: number;
  isUrgent: boolean;
}

export interface HotRoom {
  roomNumber: string;
  totalCount: number;
  openCount: number;
  summaries: string[];
}

export interface RequestAnalyticsSnapshot {
  hotelId: number;
  generatedAt: string;
  periodStart: string;
  periodEnd: string;
  totalRequests: number;
  byStatus: { open: number; in_progress: number; resolved: number };
  byType: Record<ServiceRequestType, number>;
  avgResolutionMinutes: number | null;
  avgResolutionByType: Partial<Record<ServiceRequestType, number>>;
  longestWaitingMinutes: number | null;
  longestWaitingRequest: {
    id: number;
    summary: string;
    roomNumber: string;
    minutesWaiting: number;
    requestType: ServiceRequestType;
  } | null;
  activeIssues: ActiveIssue[];
  urgentIssues: ActiveIssue[];
  hotRooms: HotRoom[];
  topRooms: { roomNumber: string; count: number }[];
  complaintCount: number;
  unresolverdRatio: number;
}

/** The enriched quick-report response with 4-section AI output */
export interface QuickReportResponse extends RequestAnalyticsSnapshot {
  summary: string[];
  complaintAnalysis: string[];
  timingInsights: string[];
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

export function formatMinutes(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return "—";
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export const TYPE_LABELS: Record<ServiceRequestType, string> = {
  FOOD_ORDER: "Food",
  SUPPORT_REQUEST: "Support",
  CARE_PROFILE_UPDATE: "Care",
  GENERAL_SERVICE_REQUEST: "General",
};

export const TYPE_COLORS: Record<ServiceRequestType, string> = {
  FOOD_ORDER: "bg-amber-100 text-amber-700",
  SUPPORT_REQUEST: "bg-red-100 text-red-700",
  CARE_PROFILE_UPDATE: "bg-violet-100 text-violet-700",
  GENERAL_SERVICE_REQUEST: "bg-zinc-100 text-zinc-600",
};
