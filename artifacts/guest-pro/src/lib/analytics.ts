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

/** Task performance metrics (shared base). */
export interface StaffPerformanceAnalytics {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionRate: number;
  departments: StaffPerformanceDepartment[];
}

export interface StaffPerformanceEmployee {
  id: number;
  name: string;
  employeeNumber: string | null;
  department: string | null;
  completed: number;
  pending: number;
  overdue: number;
  total: number;
}

export interface StaffPerformanceDepartment {
  department: string;
  label: string;
  completed: number;
  pending: number;
  overdue: number;
  total: number;
  employees: StaffPerformanceEmployee[];
}

export interface DailyTaskInsightRecord {
  id: number;
  hotelId: number;
  staffDepartment: string;
  date: string;
  summary: string;
  finishedOnTime: string[];
  finishedLate: string[];
  notFinished: string[];
  generatedAt: string;
}

export async function getDailyTaskInsight(
  locale = "tr",
  date?: string,
): Promise<DailyTaskInsightRecord | null> {
  const params = new URLSearchParams({ locale });
  if (date) params.set("date", date);
  return customFetch<DailyTaskInsightRecord | null>(`/api/analytics/daily-task-insight?${params}`);
}

export interface TaskPerformanceReportResponse extends StaffPerformanceAnalytics {
  periodStart: string;
  periodEnd: string;
  employees: {
    id: number;
    name: string;
    department: string | null;
    assigned: number;
    completed: number;
    onTimeOrEarly: number;
    lateCompleted: number;
    overdueOpen: number;
    onTimeRate: number;
  }[];
  chart: { name: string; onTimeRate: number; completed: number }[];
  aiSummary: string;
  aiFinishedOnTime: string[];
  aiFinishedLate: string[];
  aiNotFinished: string[];
  aiEmployeeNotes: string[];
  insightId: number | null;
  insightGeneratedAt: string | null;
  insightPending: boolean;
  aiUsage?: HotelAiUsageSnapshot;
  aiBudgetLimited?: boolean;
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

export interface HotelAiUsageSnapshot {
  periodKey: string;
  tokensUsed: number;
  requestCount: number;
  monthlyBudget: number;
  remainingTokens: number;
  usagePercent: number;
  byFeature: {
    taskReport: number;
    dailySummary: number;
    quickReport: number;
  };
}

export async function getTaskPerformanceReport(
  from: string,
  to: string,
  locale = "tr",
): Promise<TaskPerformanceReportResponse> {
  const params = new URLSearchParams({ from, to, locale });
  return customFetch<TaskPerformanceReportResponse>(`/api/analytics/tasks-report?${params}`);
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
