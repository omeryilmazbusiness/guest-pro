/**
 * guest-order-analytics.ts — FOOD_ORDER metrics for GM quick report.
 */

import { db, serviceRequestsTable } from "@workspace/db";
import { and, eq, gte, lte } from "drizzle-orm";

export interface GuestOrderRow {
  id: number;
  roomNumber: string;
  guestName: string;
  summary: string;
  status: string;
  minutesWaiting: number | null;
  deliveryMinutes: number | null;
  createdAt: string;
}

export interface GuestOrdersAnalytics {
  totalOrders: number;
  resolvedOrders: number;
  openOrders: number;
  inProgressOrders: number;
  avgDeliveryMinutes: number | null;
  fastestDeliveryMinutes: number | null;
  slowestDeliveryMinutes: number | null;
  orders: GuestOrderRow[];
}

function minutesBetween(a: Date, b: Date): number {
  return Math.round(Math.abs(b.getTime() - a.getTime()) / 60_000);
}

export async function buildGuestOrdersAnalytics(
  hotelId: number,
  periodStart: Date,
  periodEnd: Date,
): Promise<GuestOrdersAnalytics> {
  const rows = await db
    .select()
    .from(serviceRequestsTable)
    .where(
      and(
        eq(serviceRequestsTable.hotelId, hotelId),
        eq(serviceRequestsTable.requestType, "FOOD_ORDER"),
        gte(serviceRequestsTable.createdAt, periodStart),
        lte(serviceRequestsTable.createdAt, periodEnd),
      ),
    )
    .orderBy(serviceRequestsTable.createdAt);

  const now = new Date();
  let resolvedOrders = 0;
  let openOrders = 0;
  let inProgressOrders = 0;
  let totalDelivery = 0;
  let deliveryCount = 0;
  let fastest: number | null = null;
  let slowest: number | null = null;

  const orders: GuestOrderRow[] = rows.map((row) => {
    const createdAt = new Date(row.createdAt);
    const updatedAt = new Date(row.updatedAt);
    const guestName = `${row.guestFirstName} ${row.guestLastName}`.trim();

    if (row.status === "resolved") {
      resolvedOrders++;
      const delivery = minutesBetween(createdAt, updatedAt);
      totalDelivery += delivery;
      deliveryCount++;
      if (fastest === null || delivery < fastest) fastest = delivery;
      if (slowest === null || delivery > slowest) slowest = delivery;
    } else if (row.status === "open") {
      openOrders++;
    } else if (row.status === "in_progress") {
      inProgressOrders++;
    }

    return {
      id: row.id,
      roomNumber: row.roomNumber,
      guestName,
      summary: row.summary,
      status: row.status,
      minutesWaiting:
        row.status === "resolved" ? null : minutesBetween(createdAt, now),
      deliveryMinutes:
        row.status === "resolved" ? minutesBetween(createdAt, updatedAt) : null,
      createdAt: row.createdAt.toISOString(),
    };
  });

  return {
    totalOrders: rows.length,
    resolvedOrders,
    openOrders,
    inProgressOrders,
    avgDeliveryMinutes:
      deliveryCount > 0 ? Math.round(totalDelivery / deliveryCount) : null,
    fastestDeliveryMinutes: fastest,
    slowestDeliveryMinutes: slowest,
    orders: orders.sort((a, b) => {
      const priority = (s: string) =>
        s === "open" ? 0 : s === "in_progress" ? 1 : 2;
      const diff = priority(a.status) - priority(b.status);
      if (diff !== 0) return diff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }),
  };
}
