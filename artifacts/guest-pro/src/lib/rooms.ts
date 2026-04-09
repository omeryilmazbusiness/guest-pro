/**
 * Room aggregation domain logic.
 *
 * Pure functions — no React, no hooks, no side effects.
 * Derives room occupancy summaries from guest records since there is no
 * dedicated rooms database table. All components/hooks import from here
 * — logic is not scattered across the UI.
 *
 * Designed to be easily extended when a rooms entity is introduced:
 *   - swap aggregateRooms() to join against a rooms table
 *   - add capacity, floor, room type fields to RoomSummary
 */

import type { Guest } from "@workspace/api-client-react";

// ─── Domain type ──────────────────────────────────────────────────────────────

export interface RoomSummary {
  /** The room number string (e.g. "301", "101A") */
  roomNumber: string;
  /** Number of active guests currently assigned to this room */
  guestCount: number;
  /** True if at least one guest is assigned */
  isOccupied: boolean;
  /** Snapshot of guest identities in this room (for display in tooltips / detail) */
  guests: Array<{ id: number; firstName: string; lastName: string; countryCode: string }>;
}

export type RoomStatusFilter = "all" | "occupied" | "empty";

// ─── Aggregation ──────────────────────────────────────────────────────────────

/**
 * Derives a sorted list of RoomSummary records from a flat guest list.
 * Sorts numerically (Room 2 before Room 10 before Room 101).
 */
export function aggregateRooms(guests: Guest[]): RoomSummary[] {
  const map = new Map<string, RoomSummary>();

  for (const g of guests) {
    const existing = map.get(g.roomNumber);
    const entry = { id: g.id, firstName: g.firstName, lastName: g.lastName, countryCode: g.countryCode };

    if (existing) {
      existing.guestCount += 1;
      existing.guests.push(entry);
    } else {
      map.set(g.roomNumber, {
        roomNumber: g.roomNumber,
        guestCount: 1,
        isOccupied: true,
        guests: [entry],
      });
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true })
  );
}

// ─── Filtering ────────────────────────────────────────────────────────────────

export interface RoomFilterOptions {
  search?: string;
  status?: RoomStatusFilter;
}

/**
 * Filters a room list by search term and/or occupancy status.
 * Input is never mutated.
 */
export function filterRooms(rooms: RoomSummary[], options: RoomFilterOptions): RoomSummary[] {
  let result = rooms;

  if (options.search) {
    const q = options.search.toLowerCase();
    result = result.filter((r) => r.roomNumber.toLowerCase().includes(q));
  }

  if (options.status === "occupied") {
    result = result.filter((r) => r.isOccupied);
  } else if (options.status === "empty") {
    result = result.filter((r) => !r.isOccupied);
  }

  return result;
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export interface RoomStats {
  totalRooms: number;
  occupiedRooms: number;
  emptyRooms: number;
}

export function computeRoomStats(rooms: RoomSummary[]): RoomStats {
  const occupied = rooms.filter((r) => r.isOccupied).length;
  return {
    totalRooms: rooms.length,
    occupiedRooms: occupied,
    emptyRooms: rooms.length - occupied,
  };
}
