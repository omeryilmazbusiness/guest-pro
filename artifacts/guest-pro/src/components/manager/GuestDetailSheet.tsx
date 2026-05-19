/**
 * GuestDetailSheet — centered guest detail popup (manager dashboard).
 */

import {
  Pencil,
  RefreshCcw,
  Copy,
  Trash2,
  CalendarArrowUp,
  Clock,
  CalendarX,
} from "lucide-react";
import { toast } from "sonner";
import type { Guest } from "@workspace/api-client-react";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { Button } from "@/components/ui/button";
import { ManagerCenterSheet } from "@/components/manager/ManagerCenterSheet";
import { GuestTrackingBadge } from "@/components/manager/GuestTrackingBadge";
import { formatStayDate, resolveStayStatus } from "@/lib/stays";
import type { TrackingStatus } from "@/lib/tracking";
import type { StaffTranslations } from "@/lib/staff-i18n";
import { cn } from "@/lib/utils";

export interface GuestDetailSheetProps {
  guest: Guest | null;
  open: boolean;
  onClose: () => void;
  trackingStatus?: TrackingStatus;
  canEdit: boolean;
  canDelete: boolean;
  canRenew: boolean;
  onEdit: (g: Guest) => void;
  onDelete: (g: Guest) => void;
  onRenew: (g: Guest) => void;
  t: StaffTranslations;
}

export function GuestDetailSheet({
  guest,
  open,
  onClose,
  trackingStatus,
  canEdit,
  canDelete,
  canRenew,
  onEdit,
  onDelete,
  onRenew,
  t,
}: GuestDetailSheetProps) {
  if (!guest) return null;

  const raw = guest as Guest & {
    checkInDate?: string | null;
    checkOutDate?: string | null;
    isExtended?: boolean;
  };
  const checkInDate = raw.checkInDate ?? null;
  const checkOutDate = raw.checkOutDate ?? null;
  const isExtended = raw.isExtended ?? false;
  const stayStatus = resolveStayStatus(checkInDate, checkOutDate);
  const hasKey = !!guest.guestKey;
  const initials = `${guest.firstName[0] ?? ""}${guest.lastName[0] ?? ""}`.toUpperCase();

  const handleCopyKey = async () => {
    if (!guest.guestKey) return;
    try {
      await navigator.clipboard.writeText(guest.guestKey);
      toast.success(t.copyKeyDone);
    } catch {
      toast.error(t.copyKeyFailed);
    }
  };

  return (
    <ManagerCenterSheet
      open={open}
      onClose={onClose}
      ariaLabel={t.guestDetails}
      closeLabel={t.cancel}
    >
      <div className="flex flex-col overflow-y-auto overscroll-contain px-5 pb-5 pt-10">
        <div className="flex items-start gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-zinc-900 font-serif text-lg font-semibold text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-lg font-semibold text-zinc-900">
                {guest.firstName} {guest.lastName}
              </h2>
              {guest.countryCode && (
                <CountryFlag code={guest.countryCode} size="sm" monochrome />
              )}
            </div>
            <p className="mt-0.5 font-mono text-sm font-semibold text-zinc-600">
              {t.room} {guest.roomNumber}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {trackingStatus && <GuestTrackingBadge status={trackingStatus} />}
              {stayStatus === "upcoming" && (
                <span className="inline-flex items-center gap-1 rounded-md border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700">
                  <Clock className="h-2.5 w-2.5" />
                  {t.statusUpcoming}
                </span>
              )}
              {stayStatus === "expired" && (
                <span className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">
                  <CalendarX className="h-2.5 w-2.5" />
                  {t.statusExpired}
                </span>
              )}
              {isExtended && (
                <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                  <CalendarArrowUp className="h-2.5 w-2.5" />
                  Extended
                </span>
              )}
            </div>
          </div>
        </div>

        {(checkInDate || checkOutDate) && (
          <div className="mt-5 rounded-2xl border border-zinc-100 bg-zinc-50/80 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
              Stay
            </p>
            <p className="mt-1 text-sm font-medium text-zinc-800">
              {formatStayDate(checkInDate)} → {formatStayDate(checkOutDate)}
            </p>
          </div>
        )}

        <div className="mt-3 rounded-2xl border border-zinc-100 bg-zinc-50/80 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
            {t.overviewGuestKey}
          </p>
          <p
            className={cn(
              "mt-1 break-all font-mono text-xs tracking-wide",
              hasKey ? "text-zinc-600" : "text-zinc-300",
            )}
          >
            {hasKey ? guest.guestKey : "—"}
          </p>
        </div>

        <div className="mt-5 flex flex-col gap-2">
          {canEdit && (
            <Button
              variant="outline"
              className="h-11 w-full justify-start gap-2.5 rounded-xl border-zinc-200"
              onClick={() => {
                onClose();
                onEdit(guest);
              }}
            >
              <Pencil className="h-4 w-4 text-zinc-500" />
              {stayStatus === "expired" ? "Extend Stay" : t.editGuest}
            </Button>
          )}
          {canRenew && hasKey && (
            <Button
              variant="outline"
              className="h-11 w-full justify-start gap-2.5 rounded-xl border-zinc-200"
              onClick={() => {
                onClose();
                onRenew(guest);
              }}
            >
              <RefreshCcw className="h-4 w-4 text-zinc-500" />
              {t.renewKeyAction}
            </Button>
          )}
          {hasKey && (
            <Button
              variant="outline"
              className="h-11 w-full justify-start gap-2.5 rounded-xl border-zinc-200"
              onClick={handleCopyKey}
            >
              <Copy className="h-4 w-4 text-zinc-500" />
              {t.copyKeyAction}
            </Button>
          )}
          {canDelete && (
            <Button
              variant="outline"
              className="h-11 w-full justify-start gap-2.5 rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => {
                onClose();
                onDelete(guest);
              }}
            >
              <Trash2 className="h-4 w-4" />
              {t.removeGuestAction}
            </Button>
          )}
        </div>
      </div>
    </ManagerCenterSheet>
  );
}
