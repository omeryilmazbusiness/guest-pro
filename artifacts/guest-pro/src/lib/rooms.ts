/**
 * Room aggregation domain logic.
 *
 * Pure functions — no React, no hooks, no side effects.
 * Derives room occupancy summaries from guest records since there is no
 * dedicated rooms database table. All components/hooks import from here.
 *
 * Single aggregation source:
 *   Both the room card front side (occupancy count, status) and the back side
 *   (guest list, key info) read from the same `RoomSummary` shape —
 *   no duplication, no separate aggregation in components.
 *
 * Extension points:
 *   When a rooms entity is added to the database:
 *   - Swap `aggregateRooms()` to join against a rooms table
 *   - Add capacity, floor, roomType, cleaningStatus to `RoomSummary`
 *   - UI components don't change — they already consume `RoomSummary`
 */

import type { Guest } from "@workspace/api-client-react";

// ─── Domain types ─────────────────────────────────────────────────────────────

/** Snapshot of a single guest, projected from the full Guest record. */
export interface RoomGuestSnapshot {
  id: number;
  firstName: string;
  lastName: string;
  countryCode: string;
  /** Masked key for display: "ABC123-DEF456-••••••" or null if no key. */
  maskedKey: string | null;
  /** Whether this guest has an active key. */
  hasKey: boolean;
}

/** Aggregated occupancy summary for a single room. */
export interface RoomSummary {
  /** Room number string (e.g. "301", "101A") */
  roomNumber: string;
  /** Number of guests currently in this room */
  guestCount: number;
  /** True if at least one guest is present */
  isOccupied: boolean;
  /** Full guest snapshot list — used for both front count and back detail */
  guests: RoomGuestSnapshot[];
}

export type RoomStatusFilter = "all" | "occupied" | "empty";

// ─── Key masking ──────────────────────────────────────────────────────────────

/**
 * Masks the third segment of a guest key for display.
 * "ABC123-DEF456-GHIJKL" → "ABC123-DEF456-••••••"
 */
function maskKey(key: string | null | undefined): string | null {
  if (!key) return null;
  const parts = key.split("-");
  if (parts.length === 3) return `${parts[0]}-${parts[1]}-••••••`;
  return key.slice(0, 10) + "…";
}

// ─── Aggregation ──────────────────────────────────────────────────────────────

/**
 * Derives a sorted list of RoomSummary records from a flat guest list.
 *
 * Single source of truth — both the room card front and back read from
 * the `RoomSummary.guests[]` list. No secondary aggregation needed.
 *
 * Sorts rooms numerically (Room 2 before Room 10 before Room 101).
 */
export function aggregateRooms(guests: Guest[]): RoomSummary[] {
  const map = new Map<string, RoomSummary>();

  for (const g of guests) {
    const snapshot: RoomGuestSnapshot = {
      id: g.id,
      firstName: g.firstName,
      lastName: g.lastName,
      countryCode: g.countryCode,
      maskedKey: maskKey(g.guestKey),
      hasKey: !!g.guestKey,
    };

    const existing = map.get(g.roomNumber);
    if (existing) {
      existing.guestCount += 1;
      existing.guests.push(snapshot);
    } else {
      map.set(g.roomNumber, {
        roomNumber: g.roomNumber,
        guestCount: 1,
        isOccupied: true,
        guests: [snapshot],
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
export function filterRooms(
  rooms: RoomSummary[],
  options: RoomFilterOptions
): RoomSummary[] {
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
