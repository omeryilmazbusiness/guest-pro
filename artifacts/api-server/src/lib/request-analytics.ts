/**
 * request-analytics.ts
 * Aggregates raw service-request rows into a structured analytics snapshot.
 * Pure computation — no AI, no routes, no UI logic.
 *
 * Key design decisions:
 * - activeIssues: all open+in_progress rows sorted oldest-first (urgent = aged)
 * - urgentIssues: subset older than URGENT_THRESHOLD_MINUTES
 * - hotRooms: rooms with 2+ requests, enriched with their summaries
 * - avgResolutionByType: per-category resolution timing for resolved requests
 * - requestRows: full enriched rows passed to AI pipeline (up to 40, oldest first)
 */

import { db, serviceRequestsTable } from "@workspace/db";
import { eq, and, gte, lte } from "drizzle-orm";
import type { ServiceRequestType } from "@workspace/db";

// ─── Constants ────────────────────────────────────────────────────────────────

const URGENT_THRESHOLD_MINUTES = 45;

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

export interface RequestRow {
  id: number;
  requestType: ServiceRequestType;
  status: string;
  summary: string;
  roomNumber: string;
  guestName: string;
  createdAt: string;
  updatedAt: string;
  minutesSinceCreated: number;
  resolutionMinutes: number | null;
}

export interface RequestAnalyticsSnapshot {
  hotelId: number;
  generatedAt: string;
  periodStart: string;
  periodEnd: string;

  // ── Counts ────────────────────────────────────────────────────────────────
  totalRequests: number;
  byStatus: { open: number; in_progress: number; resolved: number };
  byType: Record<ServiceRequestType, number>;

  // ── Timing ────────────────────────────────────────────────────────────────
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

  // ── Complaint / issue focus ───────────────────────────────────────────────
  activeIssues: ActiveIssue[];
  urgentIssues: ActiveIssue[];
  hotRooms: HotRoom[];
  complaintCount: number;
  unresolverdRatio: number;

  // ── For AI pipeline ───────────────────────────────────────────────────────
  topRooms: { roomNumber: string; count: number }[];
  requestRows: RequestRow[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function minutesBetween(a: Date, b: Date): number {
  return Math.round(Math.abs(b.getTime() - a.getTime()) / 60_000);
}

function guestName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}

// ─── Main aggregator ─────────────────────────────────────────────────────────

export async function buildAnalyticsSnapshot(
  hotelId: number,
  periodStart: Date,
  periodEnd: Date
): Promise<RequestAnalyticsSnapshot> {
  const rows = await db
    .select()
    .from(serviceRequestsTable)
    .where(
      and(
        eq(serviceRequestsTable.hotelId, hotelId),
        gte(serviceRequestsTable.createdAt, periodStart),
        lte(serviceRequestsTable.createdAt, periodEnd)
      )
    );

  const now = new Date();

  const byStatus = { open: 0, in_progress: 0, resolved: 0 };
  const byType: Record<ServiceRequestType, number> = {
    FOOD_ORDER: 0,
    SUPPORT_REQUEST: 0,
    CARE_PROFILE_UPDATE: 0,
    GENERAL_SERVICE_REQUEST: 0,
  };

  // ── Per-type resolution accumulators ─────────────────────────────────────
  const resolutionByType: Partial<Record<ServiceRequestType, { total: number; count: number }>> = {};

  let totalResolutionMinutes = 0;
  let resolvedCount = 0;
  let longestWaiting: RequestAnalyticsSnapshot["longestWaitingRequest"] = null;
  let longestWaitingMinutes: number | null = null;

  const roomMap: Map<string, { total: number; open: number; summaries: string[] }> = new Map();
  const requestRows: RequestRow[] = [];
  const activeIssues: ActiveIssue[] = [];

  for (const row of rows) {
    byStatus[row.status as keyof typeof byStatus]++;
    byType[row.requestType]++;

    const createdAt = new Date(row.createdAt);
    const updatedAt = new Date(row.updatedAt);
    const minutesSinceCreated = minutesBetween(createdAt, now);
    const resolutionMinutes =
      row.status === "resolved" ? minutesBetween(createdAt, updatedAt) : null;

    // ── Resolution timing ─────────────────────────────────────────────────
    if (row.status === "resolved") {
      const minutes = minutesBetween(createdAt, updatedAt);
      totalResolutionMinutes += minutes;
      resolvedCount++;

      const existing = resolutionByType[row.requestType] ?? { total: 0, count: 0 };
      resolutionByType[row.requestType] = {
        total: existing.total + minutes,
        count: existing.count + 1,
      };
    }

    // ── Active issues (open + in_progress) ────────────────────────────────
    if (row.status === "open" || row.status === "in_progress") {
      const isUrgent = minutesSinceCreated >= URGENT_THRESHOLD_MINUTES;

      if (longestWaitingMinutes === null || minutesSinceCreated > longestWaitingMinutes) {
        longestWaitingMinutes = minutesSinceCreated;
        longestWaiting = {
          id: row.id,
          summary: row.summary,
          roomNumber: row.roomNumber,
          minutesWaiting: minutesSinceCreated,
          requestType: row.requestType,
        };
      }

      activeIssues.push({
        id: row.id,
        requestType: row.requestType,
        status: row.status as "open" | "in_progress",
        summary: row.summary,
        roomNumber: row.roomNumber,
        guestName: guestName(row.guestFirstName, row.guestLastName),
        minutesWaiting: minutesSinceCreated,
        isUrgent,
      });
    }

    // ── Room tracking ─────────────────────────────────────────────────────
    const roomEntry = roomMap.get(row.roomNumber) ?? { total: 0, open: 0, summaries: [] };
    roomEntry.total++;
    if (row.status !== "resolved") roomEntry.open++;
    if (roomEntry.summaries.length < 3) roomEntry.summaries.push(row.summary);
    roomMap.set(row.roomNumber, roomEntry);

    requestRows.push({
      id: row.id,
      requestType: row.requestType,
      status: row.status,
      summary: row.summary,
      roomNumber: row.roomNumber,
      guestName: guestName(row.guestFirstName, row.guestLastName),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      minutesSinceCreated,
      resolutionMinutes,
    });
  }

  // ── Sort active issues oldest-first (most urgent) ─────────────────────────
  activeIssues.sort((a, b) => b.minutesWaiting - a.minutesWaiting);
  const urgentIssues = activeIssues.filter((i) => i.isUrgent);

  // ── Hot rooms (2+ total requests) ────────────────────────────────────────
  const hotRooms: HotRoom[] = Array.from(roomMap.entries())
    .filter(([, v]) => v.total >= 2)
    .map(([roomNumber, v]) => ({
      roomNumber,
      totalCount: v.total,
      openCount: v.open,
      summaries: v.summaries,
    }))
    .sort((a, b) => b.totalCount - a.totalCount);

  // ── Top rooms (for backwards compat + quick UI chips) ────────────────────
  const topRooms = Array.from(roomMap.entries())
    .map(([roomNumber, v]) => ({ roomNumber, count: v.total }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // ── Avg resolution per type ────────────────────────────────────────────────
  const avgResolutionByType: Partial<Record<ServiceRequestType, number>> = {};
  for (const [type, acc] of Object.entries(resolutionByType) as [ServiceRequestType, { total: number; count: number }][]) {
    if (acc.count > 0) avgResolutionByType[type] = Math.round(acc.total / acc.count);
  }

  // ── Sort requestRows: active oldest-first, then resolved ─────────────────
  const sortedRows = [
    ...requestRows.filter((r) => r.status !== "resolved").sort((a, b) => b.minutesSinceCreated - a.minutesSinceCreated),
    ...requestRows.filter((r) => r.status === "resolved").sort((a, b) => b.minutesSinceCreated - a.minutesSinceCreated),
  ].slice(0, 40);

  const unresolved = byStatus.open + byStatus.in_progress;
  const total = rows.length;

  return {
    hotelId,
    generatedAt: now.toISOString(),
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    totalRequests: total,
    byStatus,
    byType,
    avgResolutionMinutes: resolvedCount > 0 ? Math.round(totalResolutionMinutes / resolvedCount) : null,
    avgResolutionByType,
    longestWaitingMinutes,
    longestWaitingRequest: longestWaiting,
    activeIssues,
    urgentIssues,
    hotRooms,
    topRooms,
    complaintCount: byType.SUPPORT_REQUEST,
    unresolverdRatio: total > 0 ? Math.round((unresolved / total) * 100) : 0,
    requestRows: sortedRows,
  };
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

export function todayRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
  return { start, end };
}

export function utcDateString(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}
