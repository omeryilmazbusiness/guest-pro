/**
 * request-analytics.ts
 * Aggregates raw service-request rows into a clean, structured analytics
 * snapshot. All computation lives here — no logic in routes or UI.
 */

import { db, serviceRequestsTable } from "@workspace/db";
import { eq, and, gte, lte } from "drizzle-orm";
import type { ServiceRequestType } from "@workspace/db";

// ─── Domain types ────────────────────────────────────────────────────────────

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
  requestRows: {
    id: number;
    requestType: ServiceRequestType;
    status: string;
    summary: string;
    roomNumber: string;
    createdAt: string;
    updatedAt: string;
    minutesSinceCreated: number;
  }[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function minutesBetween(a: Date, b: Date): number {
  return Math.round(Math.abs(b.getTime() - a.getTime()) / 60_000);
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

  let totalResolutionMinutes = 0;
  let resolvedCount = 0;
  let longestWaiting: RequestAnalyticsSnapshot["longestWaitingRequest"] = null;
  let longestWaitingMinutes: number | null = null;

  const roomCount: Map<string, number> = new Map();

  const requestRows: RequestAnalyticsSnapshot["requestRows"] = [];

  for (const row of rows) {
    byStatus[row.status as keyof typeof byStatus]++;
    byType[row.requestType]++;

    const createdAt = new Date(row.createdAt);
    const updatedAt = new Date(row.updatedAt);
    const minutesSinceCreated = minutesBetween(createdAt, now);

    if (row.status === "resolved") {
      totalResolutionMinutes += minutesBetween(createdAt, updatedAt);
      resolvedCount++;
    }

    if (row.status !== "resolved") {
      if (longestWaitingMinutes === null || minutesSinceCreated > longestWaitingMinutes) {
        longestWaitingMinutes = minutesSinceCreated;
        longestWaiting = {
          id: row.id,
          summary: row.summary,
          roomNumber: row.roomNumber,
          minutesWaiting: minutesSinceCreated,
        };
      }
    }

    roomCount.set(row.roomNumber, (roomCount.get(row.roomNumber) ?? 0) + 1);

    requestRows.push({
      id: row.id,
      requestType: row.requestType,
      status: row.status,
      summary: row.summary,
      roomNumber: row.roomNumber,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      minutesSinceCreated,
    });
  }

  const topRooms = Array.from(roomCount.entries())
    .map(([roomNumber, count]) => ({ roomNumber, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    hotelId,
    generatedAt: now.toISOString(),
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    totalRequests: rows.length,
    byStatus,
    byType,
    avgResolutionMinutes: resolvedCount > 0 ? Math.round(totalResolutionMinutes / resolvedCount) : null,
    longestWaitingMinutes,
    longestWaitingRequest: longestWaiting,
    topRooms,
    requestRows,
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
