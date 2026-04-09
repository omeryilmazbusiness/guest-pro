/**
 * Guest list domain logic.
 *
 * Pure filtering functions — no React, no hooks.
 * The API already returns guests sorted newest-first (DESC createdAt).
 * These helpers apply client-side search and room filtering on top of
 * the server-ordered list, preserving the newest-first guarantee.
 *
 * Extension points:
 *   - Add sortBy parameter if additional sort modes are needed
 *   - Add pagination slice helper if list grows beyond ~500 items
 */

import type { Guest } from "@workspace/api-client-react";

export interface GuestFilterOptions {
  search?: string;
  roomNumber?: string;
}

/**
 * Filters a guest list by name, room number, or key.
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
