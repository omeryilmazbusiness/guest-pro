/**
 * RoomCard
 *
 * Premium mobile room card for the Rooms tab.
 * Displays room number, occupancy count, and occupied/empty status.
 * Designed for a 2-column grid layout on mobile.
 *
 * Visual direction:
 *   - Square / near-square proportions
 *   - Clean hotel key / door icon
 *   - Occupied: zinc-900 badge (dark, authoritative)
 *   - Empty: zinc-200 / soft (calm, unobtrusive)
 */

import { DoorOpen, DoorClosed, Users } from "lucide-react";
import type { RoomSummary } from "@/lib/rooms";

interface RoomCardProps {
  room: RoomSummary;
}

export function RoomCard({ room }: RoomCardProps) {
  const { roomNumber, guestCount, isOccupied, guests } = room;

  // Compact guest name list (max 2 names + overflow label)
  const nameList =
    guests.length <= 2
      ? guests.map((g) => g.firstName).join(", ")
      : `${guests[0].firstName}, ${guests[1].firstName} +${guests.length - 2}`;

  return (
    <div
      className={`
        relative flex flex-col justify-between
        rounded-2xl border p-4
        transition-all duration-150 active:scale-[0.98] touch-manipulation
        ${isOccupied
          ? "bg-white border-zinc-200 shadow-sm hover:shadow-md hover:border-zinc-300"
          : "bg-zinc-50 border-zinc-100"
        }
      `}
      style={{ aspectRatio: "1 / 1.05" }}
      data-testid={`card-room-${roomNumber}`}
    >
      {/* Top row: icon + status badge */}
      <div className="flex items-start justify-between mb-auto">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center ${
            isOccupied ? "bg-zinc-100" : "bg-zinc-100"
          }`}
        >
          {isOccupied ? (
            <DoorOpen className="w-4.5 h-4.5 text-zinc-700" style={{ width: 18, height: 18 }} />
          ) : (
            <DoorClosed className="w-4.5 h-4.5 text-zinc-400" style={{ width: 18, height: 18 }} />
          )}
        </div>

        <span
          className={`text-[10px] font-semibold uppercase tracking-widest px-2 py-1 rounded-lg ${
            isOccupied
              ? "bg-zinc-900 text-white"
              : "bg-zinc-100 text-zinc-400"
          }`}
        >
          {isOccupied ? "In use" : "Empty"}
        </span>
      </div>

      {/* Room number — the hero element */}
      <div className="mt-4 mb-1">
        <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-widest leading-none mb-1">
          Room
        </p>
        <p className="text-2xl font-semibold text-zinc-900 leading-none font-serif">
          {roomNumber}
        </p>
      </div>

      {/* Guest count + names */}
      <div className="mt-3 pt-3 border-t border-zinc-100">
        {isOccupied ? (
          <>
            <div className="flex items-center gap-1.5 mb-0.5">
              <Users className="w-3 h-3 text-zinc-400" />
              <span className="text-[11px] font-semibold text-zinc-600">
                {guestCount} {guestCount === 1 ? "guest" : "guests"}
              </span>
            </div>
            {guests.length > 0 && (
              <p className="text-[11px] text-zinc-400 leading-snug truncate">
                {nameList}
              </p>
            )}
          </>
        ) : (
          <span className="text-[11px] text-zinc-300 font-medium">No guests assigned</span>
        )}
      </div>
    </div>
  );
}
