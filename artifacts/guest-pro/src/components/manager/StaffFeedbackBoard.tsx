import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listServiceRequests,
  updateServiceRequestStatus,
  deleteServiceRequest,
  type ServiceRequest,
  type ServiceRequestStatus,
} from "@/lib/service-requests";
import {
  getGuestFeedbackKind,
  getGuestFeedbackRating,
  getGuestFeedbackComment,
  isGuestFeedbackRequest,
} from "@/lib/guest-feedback";
import { useStaffLocale } from "@/hooks/use-staff-locale";
import type { TrackingStatus } from "@/lib/tracking";
import {
  RefreshCw,
  Inbox,
  Star,
  MessageSquare,
  Clock,
  Loader2,
  CheckCircle2,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface StaffFeedbackBoardProps {
  presenceMap: Map<number, TrackingStatus>;
  onOpenCountChange?: (count: number) => void;
}

const STATUS_NEXT: Record<ServiceRequestStatus, ServiceRequestStatus | null> = {
  open: "in_progress",
  in_progress: "resolved",
  resolved: null,
};

function formatRelativeTime(dateStr: string, locale: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return locale.startsWith("tr") ? "Az önce" : "Just now";
  if (diff < 3600) {
    const mins = Math.floor(diff / 60);
    return locale.startsWith("tr") ? `${mins} dk önce` : `${mins}m ago`;
  }
  if (diff < 86400) {
    const hrs = Math.floor(diff / 3600);
    return locale.startsWith("tr") ? `${hrs} sa önce` : `${hrs}h ago`;
  }
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(
    new Date(dateStr),
  );
}

function FeedbackCard({
  request,
  onStatusChange,
  onDelete,
  locale,
}: {
  request: ServiceRequest;
  onStatusChange: (updated: ServiceRequest) => void;
  onDelete: (id: number) => void;
  locale: string;
}) {
  const { t } = useStaffLocale();
  const [status, setStatus] = useState(request.status);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deleteState, setDeleteState] = useState<"idle" | "confirming" | "deleting">("idle");

  const kind = getGuestFeedbackKind(request)!;
  const rating = getGuestFeedbackRating(request);
  const body = getGuestFeedbackComment(request);
  const nextStatus = STATUS_NEXT[status];
  const isFeedback = kind === "guest_feedback";

  const statusLabel =
    status === "open"
      ? t.feedbackStatusOpen
      : status === "in_progress"
        ? t.feedbackStatusInProgress
        : t.feedbackStatusResolved;

  const handleStatusAdvance = useCallback(async () => {
    if (!nextStatus) return;
    setIsUpdating(true);
    try {
      const updated = await updateServiceRequestStatus(request.id, nextStatus);
      setStatus(nextStatus);
      onStatusChange(updated);
    } catch {
      toast.error(t.feedbackStatusUpdateFailed);
    } finally {
      setIsUpdating(false);
    }
  }, [nextStatus, onStatusChange, request.id, t.feedbackStatusUpdateFailed]);

  const handleDeleteConfirm = useCallback(async () => {
    setDeleteState("deleting");
    try {
      await deleteServiceRequest(request.id);
      onDelete(request.id);
      toast.success(t.feedbackDeleted);
    } catch {
      toast.error(t.feedbackDeleteFailed);
      setDeleteState("idle");
    }
  }, [onDelete, request.id, t.feedbackDeleteFailed, t.feedbackDeleted]);

  return (
    <article className="overflow-hidden rounded-xl border border-zinc-100 bg-white shadow-sm">
      <div className="px-3.5 pt-3 pb-2.5">
        <div className="mb-1.5 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              {isFeedback ? (
                <span className="inline-flex items-center gap-0.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-3 w-3",
                        rating != null && i < rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-zinc-200",
                      )}
                      strokeWidth={1.5}
                    />
                  ))}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-zinc-500">
                  <MessageSquare className="h-3 w-3" strokeWidth={1.5} />
                  {t.feedbackTypeComplaint}
                </span>
              )}
            </div>
            <p className="mt-1 text-[13px] font-semibold leading-tight text-zinc-800">
              {request.guestFirstName} {request.guestLastName}
            </p>
          </div>
          <span className="shrink-0 font-mono text-[12px] text-zinc-400">{request.roomNumber}</span>
        </div>

        {body && (
          <p className="text-[12px] leading-snug text-zinc-600 line-clamp-4">&ldquo;{body}&rdquo;</p>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-zinc-50 px-3.5 py-2">
        <p className="text-[10px] text-zinc-400">{formatRelativeTime(request.createdAt, locale)}</p>
        <div className="flex items-center gap-1.5">
          {status === "resolved" && (
            <>
              {deleteState === "idle" && (
                <button
                  type="button"
                  onClick={() => setDeleteState("confirming")}
                  className="rounded-lg p-1 text-zinc-300 transition-colors hover:bg-red-50 hover:text-red-500"
                  aria-label={t.feedbackDelete}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
              {deleteState === "confirming" && (
                <div className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 text-red-400" />
                  <button
                    type="button"
                    onClick={handleDeleteConfirm}
                    className="rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-600"
                  >
                    {t.feedbackDeleteConfirm}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteState("idle")}
                    className="rounded-md px-1.5 py-0.5 text-[10px] text-zinc-400"
                  >
                    {t.feedbackDeleteCancel}
                  </button>
                </div>
              )}
              {deleteState === "deleting" && (
                <Loader2 className="h-3 w-3 animate-spin text-zinc-300" />
              )}
            </>
          )}

          <button
            type="button"
            onClick={handleStatusAdvance}
            disabled={isUpdating || !nextStatus}
            className={cn(
              "inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-semibold transition-colors disabled:opacity-50",
              status === "open" && "border-zinc-200 bg-zinc-50 text-zinc-600",
              status === "in_progress" && "border-blue-100 bg-blue-50 text-blue-600",
              status === "resolved" && "border-emerald-100 bg-emerald-50 text-emerald-600",
            )}
          >
            {isUpdating ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : status === "open" ? (
              <Clock className="h-3 w-3" />
            ) : status === "in_progress" ? (
              <Loader2 className="h-3 w-3" />
            ) : (
              <CheckCircle2 className="h-3 w-3" />
            )}
            {statusLabel}
          </button>
        </div>
      </div>
    </article>
  );
}

export function StaffFeedbackBoard({ presenceMap: _presenceMap, onOpenCountChange }: StaffFeedbackBoardProps) {
  const { t, locale } = useStaffLocale();
  const queryClient = useQueryClient();

  const { data: requests, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["service-requests"],
    queryFn: () => listServiceRequests(),
    refetchInterval: 30_000,
    staleTime: 15_000,
    select: (data) => {
      const feedback = data.filter(isGuestFeedbackRequest);
      const openCount = feedback.filter((r) => r.status === "open").length;
      onOpenCountChange?.(openCount);
      return feedback.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    },
  });

  const handleStatusChange = useCallback(
    (updated: ServiceRequest) => {
      queryClient.setQueryData<ServiceRequest[]>(["service-requests"], (prev) =>
        prev?.map((r) => (r.id === updated.id ? updated : r)),
      );
    },
    [queryClient],
  );

  const handleDelete = useCallback(
    (id: number) => {
      queryClient.setQueryData<ServiceRequest[]>(["service-requests"], (prev) =>
        prev?.filter((r) => r.id !== id),
      );
    },
    [queryClient],
  );

  const items = requests ?? [];
  const openCount = items.filter((r) => r.status === "open").length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-[14px] font-semibold text-zinc-700">{t.feedbackBoardTitle}</h2>
          {openCount > 0 && (
            <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-400 px-1.5 text-[11px] font-bold leading-none text-white">
              {openCount}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="rounded-xl p-1.5 text-zinc-300 transition-all hover:bg-zinc-50 hover:text-zinc-600 active:scale-95"
          title={t.feedbackRefresh}
        >
          <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-zinc-100" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-zinc-100 bg-white py-10">
          <Inbox className="h-5 w-5 text-zinc-200" />
          <p className="text-[12px] text-zinc-400">{t.feedbackEmpty}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((request) => (
            <FeedbackCard
              key={request.id}
              request={request}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              locale={locale}
            />
          ))}
        </div>
      )}
    </div>
  );
}
