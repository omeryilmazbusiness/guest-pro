/**
 * GuestCard
 *
 * Premium mobile-first guest list item. Replaces the verbose flex-col row
 * with a compact 2-line horizontal card (~68px) that is highly scannable
 * at 375px and scales gracefully to wider screens.
 *
 * Layout:
 *   [Avatar] | [Name + flag] [Room badge]   [Copy] [⋯]
 *            | [Key snippet]
 *
 * Actions are role-aware — callers pass boolean flags + handlers.
 */

import { useState, useCallback } from "react";
import {
  Copy,
  Check,
  MoreHorizontal,
  Pencil,
  Trash2,
  RefreshCcw,
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
import { countryFlag } from "@/lib/locale";
import type { Guest } from "@workspace/api-client-react";

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
    <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center shrink-0">
      <span className="text-[13px] font-semibold text-white font-serif tracking-wide">
        {initials}
      </span>
    </div>
  );
}

// ─── Copy button (inline, small) ─────────────────────────────────────────────

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

// ─── Main component ───────────────────────────────────────────────────────────

export function GuestCard({
  guest,
  canEdit,
  canDelete,
  canRenew,
  onEdit,
  onDelete,
  onRenew,
}: GuestCardProps) {
  const hasKey = !!guest.guestKey;

  // Compact key display: "ABC123-••••••" — shows first segment, masks rest
  const keyDisplay = guest.guestKey
    ? (() => {
        const parts = guest.guestKey.split("-");
        if (parts.length === 3) return `${parts[0]}-${parts[1]}-••••••`;
        return guest.guestKey.slice(0, 8) + "…";
      })()
    : "No active key";

  const hasAnyAction = canEdit || canRenew || hasKey || canDelete;

  return (
    <div
      data-testid={`card-guest-${guest.id}`}
      className="bg-white rounded-2xl border border-zinc-100 shadow-sm hover:shadow-md hover:border-zinc-200 active:scale-[0.99] transition-all duration-150 px-4 py-3.5 flex items-center gap-3 touch-manipulation"
    >
      {/* Avatar */}
      <GuestAvatar firstName={guest.firstName} lastName={guest.lastName} />

      {/* Identity — takes all available space */}
      <div className="flex-1 min-w-0">
        {/* Line 1: name + flag + room */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-[15px] text-zinc-900 leading-tight truncate">
            {guest.firstName} {guest.lastName}
          </span>
          {guest.countryCode && (
            <span className="text-base leading-none shrink-0" title={guest.countryCode}>
              {countryFlag(guest.countryCode)}
            </span>
          )}
          <Badge
            variant="secondary"
            className="bg-zinc-100 text-zinc-600 text-[11px] font-mono font-semibold px-2 py-0 h-5 rounded-md border-0 shrink-0"
          >
            {guest.roomNumber}
          </Badge>
        </div>

        {/* Line 2: key snippet */}
        <div className="mt-0.5">
          <span
            className={`font-mono text-xs tracking-wider ${
              hasKey ? "text-zinc-400" : "text-zinc-300"
            }`}
          >
            {keyDisplay}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Quick copy button — only if key exists */}
        {hasKey && <CopyKeyButton guestKey={guest.guestKey!} />}

        {/* Action menu */}
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
                  Edit Guest
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
