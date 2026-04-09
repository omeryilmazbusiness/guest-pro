/**
 * GuestCard
 *
 * Premium mobile-first guest list item.
 * 3-line horizontal card — highly scannable on 375px phones.
 *
 * Layout:
 *   [Avatar] | [Name] [Monochrome flag]          [Copy] [⋯]
 *            | [Room badge] · [CheckIn → CheckOut] [Status badge?] [Extended?]
 *            | [Masked key snippet]
 *
 * Flag: monochrome for ops context (never emoji, no color).
 * Dates: shown if present; stay status badge for non-active states; extension badge if isExtended.
 * Actions: role-aware via permission booleans from caller.
 */

import { useState, useCallback } from "react";
import {
  Copy,
  Check,
  MoreHorizontal,
  Pencil,
  Trash2,
  RefreshCcw,
  CalendarArrowUp,
  Clock,
  CalendarX,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CountryFlag } from "@/components/ui/CountryFlag";
import type { Guest } from "@workspace/api-client-react";
import { formatStayDate, resolveStayStatus } from "@/lib/stays";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface GuestCardProps {
  guest: Guest;
  canEdit: boolean;
  canDelete: boolean;
  canRenew: boolean;
  onEdit: (g: Guest) => void;
  onDelete: (g: Guest) => void;
  onRenew: (g: Guest) => void;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function GuestAvatar({ firstName, lastName }: { firstName: string; lastName: string }) {
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
  return (
    <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center shrink-0 self-start mt-0.5">
      <span className="text-[13px] font-semibold text-white font-serif tracking-wide">
        {initials}
      </span>
    </div>
  );
}

// ─── Inline copy button ───────────────────────────────────────────────────────

function CopyKeyButton({ guestKey }: { guestKey: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(guestKey);
        setCopied(true);
        toast.success("Key copied");
        setTimeout(() => setCopied(false), 2000);
      } catch {
        toast.error("Copy failed");
      }
    },
    [guestKey]
  );

  return (
    <button
      onClick={handleCopy}
      className="w-8 h-8 rounded-lg flex items-center justify-center border border-zinc-200 bg-white hover:bg-zinc-50 active:scale-95 transition-all shrink-0 touch-manipulation"
      aria-label="Copy guest key"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-green-600" />
      ) : (
        <Copy className="w-3.5 h-3.5 text-zinc-400" />
      )}
    </button>
  );
}

// ─── Stay status badge ────────────────────────────────────────────────────────
// Only rendered for non-normal states (upcoming, expired).
// Active guests have no badge — silence is the default state, reducing noise.

function StayStatusBadge({ status }: { status: ReturnType<typeof resolveStayStatus> }) {
  if (status === "upcoming") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-700 bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded-md leading-none shrink-0">
        <Clock className="w-2.5 h-2.5" />
        Upcoming
      </span>
    );
  }
  if (status === "expired") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-md leading-none shrink-0">
        <CalendarX className="w-2.5 h-2.5" />
        Expired
      </span>
    );
  }
  return null;
}

// ─── Main card ────────────────────────────────────────────────────────────────

export function GuestCard({
  guest,
  canEdit,
  canDelete,
  canRenew,
  onEdit,
  onDelete,
  onRenew,
}: GuestCardProps) {
  // Cast to access new date/extension fields (client types may lag schema)
  const raw = guest as any;
  const hasKey = !!guest.guestKey;

  const keyDisplay = guest.guestKey
    ? (() => {
        const parts = guest.guestKey.split("-");
        return parts.length === 3
          ? `${parts[0]}-${parts[1]}-••••••`
          : guest.guestKey.slice(0, 10) + "…";
      })()
    : "No active key";

  const checkInDate: string | null = raw.checkInDate ?? null;
  const checkOutDate: string | null = raw.checkOutDate ?? null;
  const isExtended: boolean = raw.isExtended ?? false;

  const hasStayDates = !!(checkInDate || checkOutDate);
  const stayStatus = resolveStayStatus(checkInDate, checkOutDate);

  const hasAnyAction = canEdit || canRenew || hasKey || canDelete;

  // Expired guests get a muted left-border accent so they're visually distinct
  // at a glance without being alarmist.
  const cardAccent =
    stayStatus === "expired"
      ? "border-l-2 border-l-red-200"
      : stayStatus === "upcoming"
        ? "border-l-2 border-l-sky-200"
        : "";

  return (
    <div
      data-testid={`card-guest-${guest.id}`}
      className={`bg-white rounded-2xl border border-zinc-100 shadow-sm hover:shadow-md hover:border-zinc-200 active:scale-[0.99] transition-all duration-150 px-4 py-3.5 flex items-start gap-3 touch-manipulation ${cardAccent}`}
    >
      {/* Avatar */}
      <GuestAvatar firstName={guest.firstName} lastName={guest.lastName} />

      {/* Identity */}
      <div className="flex-1 min-w-0">

        {/* Line 1: name + monochrome flag */}
        <div className="flex items-center gap-1.5 leading-none">
          <span className="font-medium text-[15px] text-zinc-900 leading-tight truncate">
            {guest.firstName} {guest.lastName}
          </span>
          {guest.countryCode && (
            <CountryFlag code={guest.countryCode} size="sm" monochrome />
          )}
        </div>

        {/* Line 2: room badge + stay dates + status badges */}
        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
          <Badge
            variant="secondary"
            className="bg-zinc-100 text-zinc-600 text-[11px] font-mono font-semibold px-2 py-0 h-5 rounded-md border-0 shrink-0 leading-none"
          >
            {guest.roomNumber}
          </Badge>
          {hasStayDates && (
            <span className="text-[11px] text-zinc-500 font-medium leading-none">
              {formatStayDate(checkInDate)}
              {" · "}
              {formatStayDate(checkOutDate)}
            </span>
          )}
          <StayStatusBadge status={stayStatus} />
          {isExtended && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md leading-none">
              <CalendarArrowUp className="w-2.5 h-2.5" />
              Extended
            </span>
          )}
        </div>

        {/* Line 3: masked key */}
        <div className="mt-1">
          <span
            className={`font-mono text-xs tracking-wider leading-none ${
              hasKey ? "text-zinc-400" : "text-zinc-300"
            }`}
          >
            {keyDisplay}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {hasKey && <CopyKeyButton guestKey={guest.guestKey!} />}

        {hasAnyAction && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 touch-manipulation"
                aria-label="Guest actions"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-44 rounded-2xl border-zinc-200 shadow-xl p-1.5"
            >
              {canEdit && (
                <DropdownMenuItem
                  onClick={() => onEdit(guest)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 cursor-pointer text-[13px] touch-manipulation"
                >
                  <Pencil className="w-3.5 h-3.5 text-zinc-500" />
                  {stayStatus === "expired" ? "Extend Stay" : "Edit Guest"}
                </DropdownMenuItem>
              )}
              {canRenew && (
                <DropdownMenuItem
                  onClick={() => onRenew(guest)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 cursor-pointer text-[13px] touch-manipulation"
                >
                  <RefreshCcw className="w-3.5 h-3.5 text-zinc-500" />
                  Renew Key & QR
                </DropdownMenuItem>
              )}
              {hasKey && (
                <DropdownMenuItem
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(guest.guestKey!);
                      toast.success("Key copied");
                    } catch {
                      toast.error("Copy failed");
                    }
                  }}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 cursor-pointer text-[13px] touch-manipulation"
                >
                  <Copy className="w-3.5 h-3.5 text-zinc-500" />
                  Copy Full Key
                </DropdownMenuItem>
              )}
              {canDelete && (
                <>
                  <DropdownMenuSeparator className="my-1 bg-zinc-100" />
                  <DropdownMenuItem
                    onClick={() => onDelete(guest)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 cursor-pointer text-[13px] text-red-600 focus:text-red-600 focus:bg-red-50 touch-manipulation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove Guest
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
