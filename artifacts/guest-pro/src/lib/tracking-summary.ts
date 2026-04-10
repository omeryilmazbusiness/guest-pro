/**
 * tracking-summary.ts — Guest tracking presence summary.
 *
 * Pure functions only — no React, no side effects.
 * The single source of truth for computing how many guests are
 * in-hotel, out-of-hotel, or unknown from real-time presence data.
 *
 * Status grouping:
 *   IN_HOTEL     = IN_HOTEL_AND_ON_WIFI | IN_HOTEL_NOT_ON_WIFI
 *   OUT_OF_HOTEL = OUTSIDE_HOTEL
 *   UNKNOWN      = UNKNOWN or no snapshot yet (guest never sent a heartbeat)
 */

import type { TrackingStatus } from "./tracking";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GuestTrackingSummary {
  /** Total number of active guests in the list. */
  total: number;
  /** Guests whose presence is inside the hotel geofence. */
  inHotel: number;
  /** Guests confirmed to be outside the hotel geofence. */
  outOfHotel: number;
  /** Guests with no data or explicit UNKNOWN status. */
  unknown: number;
  /** 0-1 proportion — inHotel / total. 0 when total is 0. */
  inHotelRate: number;
  /** 0-1 proportion — outOfHotel / total. 0 when total is 0. */
  outOfHotelRate: number;
  /** 0-1 proportion — unknown / total. 1 when total is 0. */
  unknownRate: number;
  /**
   * True if at least one guest has a presence snapshot.
   * False means tracking is not yet active / no heartbeats received.
   */
  hasTrackingData: boolean;
}

// ---------------------------------------------------------------------------
// Core computation
// ---------------------------------------------------------------------------

/**
 * Computes a GuestTrackingSummary from the guest list and the current
 * presence snapshot map.
 *
 * @param guestIds  Array of guest IDs currently shown in the dashboard.
 * @param presenceMap  Map from guestId → TrackingStatus (server snapshots).
 */
export function computeTrackingSummary(
  guestIds: number[],
  presenceMap: Map<number, TrackingStatus>
): GuestTrackingSummary {
  const total = guestIds.length;

  if (total === 0) {
    return {
      total: 0,
      inHotel: 0,
      outOfHotel: 0,
      unknown: 0,
      inHotelRate: 0,
      outOfHotelRate: 0,
      unknownRate: 1,
      hasTrackingData: false,
    };
  }

  let inHotel = 0;
  let outOfHotel = 0;
  let hasTrackingData = false;

  for (const id of guestIds) {
    const status = presenceMap.get(id);
    if (status !== undefined) hasTrackingData = true;

    if (status === "IN_HOTEL_AND_ON_WIFI" || status === "IN_HOTEL_NOT_ON_WIFI") {
      inHotel++;
    } else if (status === "OUTSIDE_HOTEL") {
      outOfHotel++;
    }
    // UNKNOWN or no snapshot → counts toward unknown (implicit)
  }

  const unknown = total - inHotel - outOfHotel;

  return {
    total,
    inHotel,
    outOfHotel,
    unknown,
    inHotelRate: inHotel / total,
    outOfHotelRate: outOfHotel / total,
    unknownRate: unknown / total,
    hasTrackingData,
  };
}
