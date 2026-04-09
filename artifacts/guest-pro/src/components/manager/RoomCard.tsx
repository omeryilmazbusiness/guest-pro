/**
 * RoomCard
 *
 * Premium mobile room card for the Rooms tab.
 * Two sides:
 *   Front — room number, guest count. All rooms shown are occupied (no empty state).
 *   Back  — guest list: monochrome flag, name, dates, copy-key action.
 *
 * Interaction:
 *   Tap the card to flip it. Tap ↺ to flip back.
 *   CSS 3D flip — 420ms cubic-bezier, GPU-accelerated, stable on mobile.
 *   Flip state is self-contained — dashboard does not track which card is flipped.
 *
 * Architecture:
 *   Receives RoomSummary from aggregateRooms() — single aggregation source.
 *   CountryFlag(monochrome) for B&W country indicators in ops context.
 *   Pure presentational component — no business logic.
 */

import { useState, useCallback } from "react";
import { DoorOpen, Users, RotateCcw, KeyRound, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { CountryFlag } from "@/components/ui/CountryFlag";
import type { RoomSummary, RoomGuestSnapshot } from "@/lib/rooms";
import { formatStayDate } from "@/lib/stays";

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

// ─── Front face ───────────────────────────────────────────────────────────────

function RoomCardFront({
  roomNumber,
  guestCount,
  guests,
}: Pick<RoomSummary, "roomNumber" | "guestCount" | "guests">) {
  const namePreview =
    guests.length === 0
      ? null
      : guests.length <= 2
      ? guests.map((g) => g.firstName).join(", ")
      : `${guests[0].firstName}, ${guests[1].firstName} +${guests.length - 2}`;

  return (
    <div className="flex flex-col justify-between p-4 h-full bg-white border border-zinc-200 shadow-sm rounded-2xl">
      {/* Top row */}
      <div className="flex items-start justify-between">
        <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
          <DoorOpen style={{ width: 17, height: 17 }} className="text-zinc-700" />
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-1 rounded-lg leading-none bg-zinc-900 text-white">
          In use
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
        <div className="flex items-center gap-1.5 mb-0.5">
          <Users className="w-3 h-3 text-zinc-400" />
          <span className="text-[11px] font-semibold text-zinc-600">
            {guestCount} {guestCount === 1 ? "guest" : "guests"}
          </span>
        </div>
        {namePreview && (
          <p className="text-[11px] text-zinc-400 leading-snug truncate">{namePreview}</p>
        )}
      </div>

      {/* Tap hint */}
      <div className="absolute bottom-2 right-2.5 opacity-25">
        <RotateCcw className="w-3 h-3 text-zinc-500" />
      </div>
    </div>
  );
}

// ─── Copy key button (back face) ──────────────────────────────────────────────

function BackCopyKeyButton({ fullKey }: { fullKey: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(fullKey);
        setCopied(true);
        toast.success("Key copied");
        setTimeout(() => setCopied(false), 2000);
      } catch {
        toast.error("Copy failed");
      }
    },
    [fullKey]
  );

  return (
    <button
      onClick={handleCopy}
      className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-90 transition-all touch-manipulation shrink-0"
      aria-label="Copy guest key"
    >
      {copied ? (
        <Check className="w-3 h-3 text-green-400" />
      ) : (
        <Copy className="w-3 h-3 text-white/50" />
      )}
    </button>
  );
}

// ─── Guest row on back face ───────────────────────────────────────────────────

function BackGuestRow({ guest }: { guest: RoomGuestSnapshot }) {
  const hasDates = !!(guest.checkInDate || guest.checkOutDate);

  return (
    <div className="flex items-center gap-2 py-2 border-b border-white/10 last:border-0">
      {/* Monochrome flag */}
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

      {/* Name + stay info */}
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium text-white leading-tight truncate">
          {guest.firstName} {guest.lastName}
        </p>
        {hasDates ? (
          <p className="text-[9px] text-white/40 leading-none mt-0.5 font-medium">
            {formatStayDate(guest.checkInDate)} – {formatStayDate(guest.checkOutDate)}
            {guest.isExtended && (
              <span className="ml-1.5 text-amber-400">+ext</span>
            )}
          </p>
        ) : guest.hasKey && guest.maskedKey ? (
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

      {/* Copy key action */}
      {guest.hasKey && guest.fullKey && (
        <BackCopyKeyButton fullKey={guest.fullKey} />
      )}
    </div>
  );
}

// ─── Back face ────────────────────────────────────────────────────────────────

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
        <div
          className="overflow-y-auto h-full"
          style={{ scrollbarWidth: "none" }}
          onClick={(e) => e.stopPropagation()}
        >
          {guests.map((g) => (
            <BackGuestRow key={g.id} guest={g} />
          ))}
        </div>
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
  const { roomNumber, guestCount, guests } = room;

  const handleFlip = () => setIsFlipped((f) => !f);

  const handleFlipBack = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFlipped(false);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Room ${roomNumber}, ${guestCount} guest${guestCount !== 1 ? "s" : ""} — tap to see details`}
      onClick={handleFlip}
      onKeyDown={(e) => e.key === "Enter" && handleFlip()}
      data-testid={`card-room-${roomNumber}`}
      style={{ perspective: "900px", aspectRatio: "1 / 1.1" }}
      className="relative select-none cursor-pointer"
    >
      {/* 3D rotating inner */}
      <div style={innerStyle(isFlipped)}>
        {/* ── Front face ── */}
        <div style={faceBase}>
          <RoomCardFront
            roomNumber={roomNumber}
            guestCount={guestCount}
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
