/**
 * GuestCard — framed premium guest list row.
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
import { GuestTrackingBadge } from "@/components/manager/GuestTrackingBadge";
import type { TrackingStatus } from "@/lib/tracking";
import { cn } from "@/lib/utils";

const LIST_CARD =
  "rounded-xl border border-zinc-200/90 bg-white px-3.5 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-150 hover:border-zinc-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.05)]";

export interface GuestCardProps {
  guest: Guest;
  canEdit: boolean;
  canDelete: boolean;
  canRenew: boolean;
  onEdit: (g: Guest) => void;
  onDelete: (g: Guest) => void;
  onRenew: (g: Guest) => void;
  onSelect?: (g: Guest) => void;
  trackingStatus?: TrackingStatus;
}

function GuestInitialsAvatar({
  firstName,
  lastName,
}: {
  firstName: string;
  lastName: string;
}) {
  const initials =
    `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "?";

  return (
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-[13px] font-semibold tracking-wide text-white shadow-sm shadow-zinc-900/15 ring-1 ring-zinc-900/10"
      aria-hidden
    >
      <span className="font-serif leading-none">{initials}</span>
    </div>
  );
}

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
    [guestKey],
  );

  return (
    <button
      onClick={handleCopy}
      className="shrink-0 p-1 text-zinc-400 transition-colors hover:text-zinc-700 touch-manipulation"
      aria-label="Copy guest key"
    >
      {copied ? (
        <Check className="h-4 w-4 text-emerald-600" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </button>
  );
}

function StayStatusHint({ status }: { status: ReturnType<typeof resolveStayStatus> }) {
  if (status === "upcoming") {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] font-medium text-sky-600">
        <Clock className="h-3 w-3" />
        Upcoming
      </span>
    );
  }
  if (status === "expired") {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] font-medium text-rose-500">
        <CalendarX className="h-3 w-3" />
        Expired
      </span>
    );
  }
  return null;
}

export function GuestCard({
  guest,
  canEdit,
  canDelete,
  canRenew,
  onEdit,
  onDelete,
  onRenew,
  onSelect,
  trackingStatus,
}: GuestCardProps) {
  const raw = guest as Guest & {
    checkInDate?: string | null;
    checkOutDate?: string | null;
    isExtended?: boolean;
  };
  const hasKey = !!guest.guestKey;

  const keyDisplay = guest.guestKey
    ? (() => {
        const parts = guest.guestKey.split("-");
        return parts.length === 3
          ? `${parts[0]}-${parts[1]}-••••••`
          : `${guest.guestKey.slice(0, 10)}…`;
      })()
    : "No active key";

  const checkInDate = raw.checkInDate ?? null;
  const checkOutDate = raw.checkOutDate ?? null;
  const isExtended = raw.isExtended ?? false;
  const hasStayDates = !!(checkInDate || checkOutDate);
  const stayStatus = resolveStayStatus(checkInDate, checkOutDate);
  const hasAnyAction = canEdit || canRenew || hasKey || canDelete;

  return (
    <div
      data-testid={`card-guest-${guest.id}`}
      className={cn(
        LIST_CARD,
        "flex items-center gap-3",
        stayStatus === "expired" && "opacity-70",
      )}
    >
      <GuestInitialsAvatar firstName={guest.firstName} lastName={guest.lastName} />

      <button
        type="button"
        onClick={onSelect ? () => onSelect(guest) : undefined}
        disabled={!onSelect}
        className={cn(
          "min-w-0 flex-1 text-left touch-manipulation",
          onSelect ? "cursor-pointer" : "cursor-default",
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <p className="truncate text-sm font-semibold leading-snug text-zinc-900">
              {guest.firstName} {guest.lastName}
            </p>
            {guest.countryCode && (
              <CountryFlag code={guest.countryCode} size="sm" monochrome />
            )}
          </div>
          {trackingStatus ? <GuestTrackingBadge status={trackingStatus} /> : null}
        </div>

        <p className="mt-0.5 text-[11px] text-zinc-500">
          <span className="font-mono font-semibold text-zinc-700">{guest.roomNumber}</span>
          {hasStayDates && (
            <>
              {" · "}
              {formatStayDate(checkInDate)}
              {" → "}
              {formatStayDate(checkOutDate)}
            </>
          )}
        </p>

        <div className="mt-0.5 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "font-mono text-[10px] tracking-wide",
              hasKey ? "text-zinc-400" : "text-zinc-300",
            )}
          >
            {keyDisplay}
          </span>
          <StayStatusHint status={stayStatus} />
          {isExtended && (
            <span className="inline-flex items-center gap-1 text-[9px] font-medium text-amber-600">
              <CalendarArrowUp className="h-3 w-3" />
              Extended
            </span>
          )}
        </div>
      </button>

      <div className="flex shrink-0 items-center gap-0.5 self-center">
        {hasKey && <CopyKeyButton guestKey={guest.guestKey!} />}

        {hasAnyAction && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="shrink-0 p-1 text-zinc-400 transition-colors hover:text-zinc-700 touch-manipulation"
                aria-label="Guest actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
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
