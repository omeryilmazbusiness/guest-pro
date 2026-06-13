import { useState, useCallback } from "react";
import {
  Clock,
  CheckCircle2,
  Loader2,
  ChevronDown,
  Trash2,
  DoorOpen,
  Circle,
  type LucideIcon,
} from "lucide-react";
import type { ServiceRequest, ServiceRequestStatus } from "@/lib/service-requests";
import {
  updateServiceRequestStatus,
  deleteServiceRequest,
} from "@/lib/service-requests";
import { buildDisplaySummary, buildDetailLines } from "@/lib/request-display";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ITEM_CARD =
  "rounded-lg border border-zinc-200/80 bg-white px-3 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]";

const STATUS_NEXT: Record<ServiceRequestStatus, ServiceRequestStatus | null> = {
  open: "in_progress",
  in_progress: "resolved",
  resolved: null,
};

const STATUS_META: Record<
  ServiceRequestStatus,
  { dot: string; label: string; action: string | null; icon: LucideIcon }
> = {
  open: { dot: "bg-rose-400", label: "Bekliyor", action: "Üstlen", icon: Clock },
  in_progress: { dot: "bg-amber-400", label: "İşlemde", action: "Tamamla", icon: Loader2 },
  resolved: { dot: "bg-emerald-400", label: "Tamam", action: null, icon: CheckCircle2 },
};

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "Az önce";
  if (diff < 3600) return `${Math.floor(diff / 60)} dk`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} sa`;
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" }).format(
    new Date(dateStr),
  );
}

function GuestInitials({
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
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-[11px] font-semibold tracking-wide text-white"
      aria-hidden
    >
      <span className="font-serif leading-none">{initials}</span>
    </div>
  );
}

interface ServiceRequestCardProps {
  request: ServiceRequest;
  onStatusChange?: (updated: ServiceRequest) => void;
  onDelete?: (id: number) => void;
  presenceStatus?: "in_hotel" | "out_of_hotel" | "unknown";
}

export function ServiceRequestCard({
  request,
  onStatusChange,
  onDelete,
  presenceStatus,
}: ServiceRequestCardProps) {
  const [status, setStatus] = useState<ServiceRequestStatus>(request.status);
  const [isUpdating, setIsUpdating] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const meta = STATUS_META[status];
  const StatusIcon = meta.icon;
  const nextStatus = STATUS_NEXT[status];

  const displayText = buildDisplaySummary(request);
  const detailLines = buildDetailLines(request);
  const hasDetails = detailLines.length > 0;

  const handleStatusAdvance = useCallback(async () => {
    if (!nextStatus) return;
    setIsUpdating(true);
    try {
      const updated = await updateServiceRequestStatus(request.id, nextStatus);
      setStatus(nextStatus);
      onStatusChange?.(updated);
    } catch {
      toast.error("Durum güncellenemedi");
    } finally {
      setIsUpdating(false);
    }
  }, [nextStatus, request.id, onStatusChange]);

  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      await deleteServiceRequest(request.id);
      onDelete?.(request.id);
      toast.success("Talep silindi");
    } catch {
      toast.error("Talep silinemedi");
      setIsDeleting(false);
      setDeleteConfirm(false);
    }
  }, [request.id, onDelete]);

  return (
    <article className={ITEM_CARD}>
      <div className="flex items-start gap-2.5">
        <GuestInitials
          firstName={request.guestFirstName}
          lastName={request.guestLastName}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5">
              <p className="truncate text-[13px] font-semibold text-zinc-900">
                {request.guestFirstName} {request.guestLastName}
              </p>
              {presenceStatus === "in_hotel" && (
                <Circle
                  className="h-2 w-2 shrink-0 fill-emerald-400 text-emerald-400"
                  aria-label="Otelde"
                />
              )}
            </div>

            <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-zinc-600">
              <DoorOpen className="h-3 w-3 text-zinc-400" strokeWidth={1.75} />
              {request.roomNumber}
            </span>
          </div>

          <button
            type="button"
            onClick={() => hasDetails && setDetailsOpen((v) => !v)}
            disabled={!hasDetails}
            className={cn(
              "mt-1 flex w-full items-start gap-1 text-left",
              hasDetails && "cursor-pointer touch-manipulation",
            )}
          >
            <p className="flex-1 text-[12px] leading-snug text-zinc-600">{displayText}</p>
            {hasDetails && (
              <ChevronDown
                className={cn(
                  "mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-300 transition-transform duration-200",
                  detailsOpen && "rotate-180",
                )}
                strokeWidth={1.75}
              />
            )}
          </button>

          {detailsOpen && hasDetails && (
            <div className="mt-2 space-y-1 border-t border-zinc-100 pt-2 animate-in fade-in slide-in-from-top-1 duration-150">
              {detailLines.map(({ label, value }) => (
                <div key={label} className="flex items-start gap-2 text-[11px]">
                  <span className="w-14 shrink-0 font-medium uppercase tracking-wide text-zinc-400">
                    {label}
                  </span>
                  <span className="flex-1 text-zinc-600">{value}</span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
              <StatusIcon
                className={cn(
                  "h-3 w-3",
                  status === "in_progress" && "animate-spin text-amber-500",
                  status === "open" && "text-rose-400",
                  status === "resolved" && "text-emerald-500",
                )}
                strokeWidth={1.75}
              />
              <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} aria-hidden />
              <span>{meta.label}</span>
              <span className="text-zinc-300">·</span>
              <span>{formatRelativeTime(request.createdAt)}</span>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              {status === "resolved" && (
                <>
                  {deleteConfirm ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm(false)}
                        className="rounded-md px-2 py-1 text-[10px] font-medium text-zinc-400 hover:text-zinc-600"
                      >
                        İptal
                      </button>
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="rounded-md bg-rose-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                      >
                        {isDeleting ? "…" : "Sil"}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(true)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-300 transition-colors hover:bg-rose-50 hover:text-rose-500"
                      aria-label="Talebi sil"
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </button>
                  )}
                </>
              )}

              {meta.action && (
                <button
                  type="button"
                  onClick={handleStatusAdvance}
                  disabled={isUpdating}
                  className="rounded-lg bg-zinc-900 px-2.5 py-1 text-[10px] font-semibold text-white transition-all hover:bg-zinc-800 active:scale-95 disabled:opacity-60"
                >
                  {isUpdating ? "…" : meta.action}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
