/**
 * Guest list domain logic.
 *
 * Pure filtering functions — no React, no hooks.
 * The API already returns guests sorted newest-first (DESC createdAt).
 * These helpers apply client-side search, room, and status filtering on top of
 * the server-ordered list, preserving the newest-first guarantee.
 */

import type { Guest } from "@workspace/api-client-react";
import { resolveStayStatus, type StayStatus } from "./stays";

export interface GuestFilterOptions {
  search?: string;
  roomNumber?: string;
  status?: StayStatus | "all";
}

/**
 * Filters a guest list by name, room number, key, and/or stay status.
 * Preserves the original (newest-first) ordering from the server.
 */
export function filterGuests(guests: Guest[], options: GuestFilterOptions): Guest[] {
  let result = guests;

  if (options.search) {
    const q = options.search.toLowerCase();
    result = result.filter(
      (g) =>
        g.firstName.toLowerCase().includes(q) ||
        g.lastName.toLowerCase().includes(q) ||
        g.roomNumber.toLowerCase().includes(q) ||
        (g.guestKey?.toLowerCase().includes(q) ?? false)
    );
  }

  if (options.roomNumber && options.roomNumber !== "__all__") {
    result = result.filter((g) => g.roomNumber === options.roomNumber);
  }

  if (options.status && options.status !== "all") {
    const targetStatus = options.status;
    result = result.filter((g) => {
      const raw = g as any;
      return resolveStayStatus(raw.checkInDate, raw.checkOutDate) === targetStatus;
    });
  }

  return result;
}

/**
 * Extracts unique room numbers from a guest list, sorted numerically.
 */
export function extractRoomNumbers(guests: Guest[]): string[] {
  return [...new Set(guests.map((g) => g.roomNumber))].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  );
}

/**
 * Count guests per stay status — used for filter badges.
 */
export function countByStatus(guests: Guest[]): Record<"active" | "upcoming" | "expired" | "no_dates", number> {
  const counts = { active: 0, upcoming: 0, expired: 0, no_dates: 0 };
  for (const g of guests) {
    const raw = g as any;
    const status = resolveStayStatus(raw.checkInDate, raw.checkOutDate);
    counts[status]++;
  }
  return counts;
}
