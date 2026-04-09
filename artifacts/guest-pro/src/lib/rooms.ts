/**
 * rooms.ts — Room aggregation domain logic.
 *
 * Pure functions — no React, no hooks, no side effects.
 * Derives room occupancy summaries from guest records since there is no
 * dedicated rooms database table. All components/hooks import from here.
 *
 * Single aggregation source:
 *   Both the room card front side (occupancy count) and the back side
 *   (guest list, key info, dates) read from the same `RoomSummary` shape.
 */

import type { Guest } from "@workspace/api-client-react";

// ─── Domain types ─────────────────────────────────────────────────────────────

/** Snapshot of a single guest, projected for the room card back face. */
export interface RoomGuestSnapshot {
  id: number;
  firstName: string;
  lastName: string;
  countryCode: string;
  /** Masked key for display: "ABC123-DEF456-••••••" or null if no key. */
  maskedKey: string | null;
  /** Full display key (guest_keys.key_display) — used for copy actions. */
  fullKey: string | null;
  /** Whether this guest has an active key. */
  hasKey: boolean;
  /** Check-in date in YYYY-MM-DD format or null. */
  checkInDate: string | null;
  /** Check-out date in YYYY-MM-DD format or null. */
  checkOutDate: string | null;
  /** Whether the stay has been extended at least once. */
  isExtended: boolean;
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

// ─── Key masking ──────────────────────────────────────────────────────────────

/**
 * Masks the third segment of a guest key for display.
 * "ABC123-DEF456-GHIJKL" → "ABC123-DEF456-••••••"
 */
export function maskKey(key: string | null | undefined): string | null {
  if (!key) return null;
  const parts = key.split("-");
  if (parts.length === 3) return `${parts[0]}-${parts[1]}-••••••`;
  return key.slice(0, 10) + "…";
}

// ─── Aggregation ──────────────────────────────────────────────────────────────

/**
 * Derives a sorted list of RoomSummary records from a flat guest list.
 *
 * Since all guests in the list are active (isActive=true from API), every
 * derived room is occupied. No empty rooms are ever returned.
 */
export function aggregateRooms(guests: Guest[]): RoomSummary[] {
  const map = new Map<string, RoomSummary>();

  for (const g of guests) {
    // The API now returns date + extension fields. Cast via any for compat with
    // generated client types that may not yet include the new properties.
    const raw = g as any;
    const snapshot: RoomGuestSnapshot = {
      id: g.id,
      firstName: g.firstName,
      lastName: g.lastName,
      countryCode: g.countryCode,
      maskedKey: maskKey(g.guestKey),
      fullKey: g.guestKey ?? null,
      hasKey: !!g.guestKey,
      checkInDate: raw.checkInDate ?? null,
      checkOutDate: raw.checkOutDate ?? null,
      isExtended: raw.isExtended ?? false,
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

/**
 * Filters a room list by search term.
 * Since the API only returns active guests, all derived rooms are occupied —
 * no status filter is needed.
 */
export function filterRooms(rooms: RoomSummary[], search?: string): RoomSummary[] {
  if (!search) return rooms;
  const q = search.toLowerCase();
  return rooms.filter((r) => r.roomNumber.toLowerCase().includes(q));
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export interface RoomStats {
  totalRooms: number;
  occupiedRooms: number;
}

export function computeRoomStats(rooms: RoomSummary[]): RoomStats {
  return {
    totalRooms: rooms.length,
    occupiedRooms: rooms.length,
  };
}
