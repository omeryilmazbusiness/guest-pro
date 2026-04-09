/**
 * GuestCard
 *
 * Premium mobile-first guest list item.
 * Compact 2-line horizontal card (~68px) — highly scannable on 375px phones.
 *
 * Layout:
 *   [Avatar] | [Name] [Flag] [Room badge]   [Copy] [⋯]
 *            | [Masked key snippet]
 *
 * Flag display uses CountryFlag (SVG-based, flag-icons library) — never emoji.
 * All country-to-flag resolution is centralized in CountryFlag.tsx.
 * Actions are role-aware — callers pass permission booleans + handlers.
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
import { CountryFlag } from "@/components/ui/CountryFlag";
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
  const hasKey = !!guest.guestKey;

  // Display first two key segments, mask the third: "ABC123-DEF456-••••••"
  const keyDisplay = guest.guestKey
    ? (() => {
        const parts = guest.guestKey.split("-");
        return parts.length === 3
          ? `${parts[0]}-${parts[1]}-••••••`
          : guest.guestKey.slice(0, 10) + "…";
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

      {/* Identity */}
      <div className="flex-1 min-w-0">
        {/* Line 1: name + flag + room badge */}
        <div className="flex items-center gap-1.5 flex-wrap leading-none">
          <span className="font-medium text-[15px] text-zinc-900 leading-tight truncate">
            {guest.firstName} {guest.lastName}
          </span>
          {guest.countryCode && (
            <CountryFlag code={guest.countryCode} size="sm" />
          )}
          <Badge
            variant="secondary"
            className="bg-zinc-100 text-zinc-600 text-[11px] font-mono font-semibold px-2 py-0 h-5 rounded-md border-0 shrink-0 leading-none"
          >
            {guest.roomNumber}
          </Badge>
        </div>

        {/* Line 2: key snippet */}
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
