/**
 * RoomCard
 *
 * Premium mobile room card for the Rooms tab.
 * Two sides:
 *   Front — room number, occupancy count, status badge
 *   Back  — guest list with monochrome country indicators and key info
 *
 * Interaction:
 *   Tap the card to flip it. Tap again (or tap ✕) to flip back.
 *   CSS 3D flip — 420ms cubic-bezier, GPU-accelerated, stable on mobile.
 *   Flip state is self-contained (isFlipped: boolean in component) —
 *   dashboard does not track which card is flipped.
 *
 * Visual direction:
 *   Front  — white dominant, door icon, clean typography
 *   Back   — zinc-900 dark, guest rows with monochrome flags
 *   Both   — soft rounded corners, premium hospitality operations feel
 *
 * Layout:
 *   2-column mobile grid (rendered by the parent grid)
 *   Square / near-square aspect ratio
 *   Both faces position: absolute, filling the same container
 *   → layout is perfectly stable; nothing reflows on flip
 *
 * Architecture:
 *   Receives RoomSummary from aggregateRooms() — single aggregation source
 *   CountryFlag(monochrome) for B&W country indicators
 *   No logic — pure presentational component
 */

import { useState } from "react";
import { DoorOpen, DoorClosed, Users, RotateCcw, KeyRound } from "lucide-react";
import { CountryFlag } from "@/components/ui/CountryFlag";
import type { RoomSummary, RoomGuestSnapshot } from "@/lib/rooms";

// ─── Flip CSS constants ───────────────────────────────────────────────────────

const FLIP_TRANSITION = "transform 0.42s cubic-bezier(0.4, 0, 0.2, 1)";

const innerStyle = (isFlipped: boolean): React.CSSProperties => ({
  transformStyle: "preserve-3d",
  transition: FLIP_TRANSITION,
  transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
  position: "relative",
  width: "100%",
  height: "100%",
});

const faceBase: React.CSSProperties = {
  backfaceVisibility: "hidden",
  WebkitBackfaceVisibility: "hidden",
  position: "absolute",
  inset: 0,
  borderRadius: "1rem",
  overflow: "hidden",
};

const backFaceStyle: React.CSSProperties = {
  ...faceBase,
  transform: "rotateY(180deg)",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

/**
 * Front face — room summary with status and guest count.
 */
function RoomCardFront({
  roomNumber,
  guestCount,
  isOccupied,
  guests,
}: Pick<RoomSummary, "roomNumber" | "guestCount" | "isOccupied" | "guests">) {
  const namePreview =
    guests.length === 0
      ? null
      : guests.length <= 2
      ? guests.map((g) => g.firstName).join(", ")
      : `${guests[0].firstName}, ${guests[1].firstName} +${guests.length - 2}`;

  return (
    <div
      className={`
        flex flex-col justify-between p-4 h-full
        border rounded-2xl transition-shadow duration-150
        ${isOccupied
          ? "bg-white border-zinc-200 shadow-sm"
          : "bg-zinc-50/80 border-zinc-100"
        }
      `}
    >
      {/* Top row */}
      <div className="flex items-start justify-between">
        <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
          {isOccupied ? (
            <DoorOpen style={{ width: 17, height: 17 }} className="text-zinc-700" />
          ) : (
            <DoorClosed style={{ width: 17, height: 17 }} className="text-zinc-400" />
          )}
        </div>
        <span
          className={`text-[10px] font-semibold uppercase tracking-widest px-2 py-1 rounded-lg leading-none ${
            isOccupied
              ? "bg-zinc-900 text-white"
              : "bg-zinc-100 text-zinc-400"
          }`}
        >
          {isOccupied ? "In use" : "Empty"}
        </span>
      </div>

      {/* Room number */}
      <div className="mt-2">
        <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest leading-none mb-1.5">
          Room
        </p>
        <p className="text-[26px] font-semibold text-zinc-900 leading-none font-serif">
          {roomNumber}
        </p>
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-zinc-100 mt-auto">
        {isOccupied ? (
          <>
            <div className="flex items-center gap-1.5 mb-0.5">
              <Users className="w-3 h-3 text-zinc-400" />
              <span className="text-[11px] font-semibold text-zinc-600">
                {guestCount} {guestCount === 1 ? "guest" : "guests"}
              </span>
            </div>
            {namePreview && (
              <p className="text-[11px] text-zinc-400 leading-snug truncate">{namePreview}</p>
            )}
          </>
        ) : (
          <span className="text-[11px] text-zinc-300 font-medium">No guests assigned</span>
        )}
      </div>

      {/* Tap hint — only on occupied cards */}
      {isOccupied && (
        <div className="absolute bottom-2 right-2.5 opacity-30">
          <RotateCcw className="w-3 h-3 text-zinc-500" />
        </div>
      )}
    </div>
  );
}

// ─── Guest row on back face ───────────────────────────────────────────────────

function BackGuestRow({ guest }: { guest: RoomGuestSnapshot }) {
  return (
    <div className="flex items-center gap-2.5 py-2 border-b border-white/10 last:border-0">
      {/* Monochrome country indicator */}
      <div className="shrink-0">
        {guest.countryCode ? (
          <CountryFlag code={guest.countryCode} size="sm" monochrome />
        ) : (
          <span
            className="inline-flex items-center justify-center bg-white/10 rounded-sm text-[9px] text-white/40 font-mono"
            style={{ width: 18, height: 14 }}
          >
            –
          </span>
        )}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium text-white leading-tight truncate">
          {guest.firstName} {guest.lastName}
        </p>
        {/* Key indicator */}
        {guest.hasKey && guest.maskedKey ? (
          <div className="flex items-center gap-1 mt-0.5">
            <KeyRound className="w-2.5 h-2.5 text-white/30 shrink-0" />
            <span className="font-mono text-[9px] text-white/30 tracking-widest truncate leading-none">
              {guest.maskedKey}
            </span>
          </div>
        ) : (
          <span className="text-[9px] text-white/25 font-medium mt-0.5 block">No active key</span>
        )}
      </div>
    </div>
  );
}

/**
 * Back face — guest list for this room.
 */
function RoomCardBack({
  roomNumber,
  guests,
  onFlipBack,
}: {
  roomNumber: string;
  guests: RoomGuestSnapshot[];
  onFlipBack: (e: React.MouseEvent) => void;
}) {
  return (
    <div className="flex flex-col h-full bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div>
          <p className="text-[9px] font-semibold text-zinc-500 uppercase tracking-widest leading-none mb-1">
            Room
          </p>
          <p className="text-lg font-semibold text-white leading-none font-serif">
            {roomNumber}
          </p>
        </div>
        {/* Flip-back button */}
        <button
          onClick={onFlipBack}
          className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/15 active:scale-90 transition-all touch-manipulation shrink-0"
          aria-label="Flip back"
        >
          <RotateCcw className="w-3.5 h-3.5 text-white/60" />
        </button>
      </div>

      {/* Guest list */}
      <div className="flex-1 overflow-hidden">
        {guests.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 py-2">
            <DoorClosed className="w-6 h-6 text-white/15" />
            <p className="text-[10px] text-white/25 font-medium text-center">
              No guests assigned
            </p>
          </div>
        ) : (
          <div
            className="overflow-y-auto h-full"
            style={{ scrollbarWidth: "none" }}
          >
            {guests.map((g) => (
              <BackGuestRow key={g.id} guest={g} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main card ────────────────────────────────────────────────────────────────

interface RoomCardProps {
  room: RoomSummary;
}

export function RoomCard({ room }: RoomCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const { roomNumber, guestCount, isOccupied, guests } = room;

  const handleFlip = () => {
    if (!isOccupied) return; // Empty rooms don't flip
    setIsFlipped((f) => !f);
  };

  const handleFlipBack = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFlipped(false);
  };

  return (
    <div
      role="button"
      tabIndex={isOccupied ? 0 : -1}
      aria-label={
        isOccupied
          ? `Room ${roomNumber}, ${guestCount} guest${guestCount !== 1 ? "s" : ""} — tap to see details`
          : `Room ${roomNumber}, empty`
      }
      onClick={handleFlip}
      onKeyDown={(e) => e.key === "Enter" && handleFlip()}
      data-testid={`card-room-${roomNumber}`}
      style={{ perspective: "900px", aspectRatio: "1 / 1.1" }}
      className={`relative select-none ${isOccupied ? "cursor-pointer" : "cursor-default"}`}
    >
      {/* 3D rotating inner */}
      <div style={innerStyle(isFlipped)}>
        {/* ── Front face ── */}
        <div style={faceBase}>
          <RoomCardFront
            roomNumber={roomNumber}
            guestCount={guestCount}
            isOccupied={isOccupied}
            guests={guests}
          />
        </div>

        {/* ── Back face ── */}
        <div style={backFaceStyle}>
          <RoomCardBack
            roomNumber={roomNumber}
            guests={guests}
            onFlipBack={handleFlipBack}
          />
        </div>
      </div>
    </div>
  );
}
