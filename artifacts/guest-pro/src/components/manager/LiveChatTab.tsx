/**
 * LiveChatTab — reception inbox for active guest live chats (mobile-first).
 */
import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MessageCircle, AlertTriangle, Trash2, Loader2, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useStaffLocale } from "@/hooks/use-staff-locale";
import {
  flattenInboxPages,
  invalidateLiveChatInbox,
  useLiveChatInboxInfiniteQuery,
} from "@/hooks/use-live-chat-inbox";
import { useInfiniteScrollSentinel } from "@/hooks/use-infinite-scroll-sentinel";
import { useLiveChatReception } from "@/components/manager/LiveChatReceptionContext";
import { deleteLiveChatSession } from "@/lib/live-chat-api";
import { cn } from "@/lib/utils";

function formatInboxTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 60_000) return "now";
  if (diffMs < 86_400_000) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function LiveChatTab() {
  const { t } = useStaffLocale();
  const queryClient = useQueryClient();
  const { openChat } = useLiveChatReception();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useLiveChatInboxInfiniteQuery();
  const inbox = flattenInboxPages(data);
  const total = data?.pages[0]?.pagination?.total ?? inbox.length;
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const sentinelRef = useInfiniteScrollSentinel(loadMore, {
    enabled: hasNextPage === true && !isFetchingNextPage,
  });

  const handleDelete = async (sessionId: number) => {
    if (deletingId != null) return;
    setDeletingId(sessionId);
    try {
      await deleteLiveChatSession(sessionId);
      await invalidateLiveChatInbox(queryClient);
      toast.success(t.liveChatSessionDeleted);
    } catch {
      toast.error(t.liveChatDeleteError);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
              <MessageCircle className="h-4 w-4" strokeWidth={2.25} />
            </span>
            <h2 className="text-[17px] font-semibold tracking-tight text-zinc-900">
              {t.liveChatTabTitle}
            </h2>
          </div>
          <p className="mt-1.5 ps-10 text-[13px] leading-snug text-zinc-500">
            {t.liveChatInboxSubtitle}
          </p>
        </div>
        {total > 0 && (
          <span className="shrink-0 rounded-full bg-zinc-900 px-2.5 py-1 text-[11px] font-bold text-white">
            {total}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-zinc-300" />
        </div>
      ) : inbox.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/80 px-6 py-14 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
            <MessageCircle className="h-7 w-7 text-zinc-300" />
          </span>
          <p className="mt-4 text-[14px] font-medium text-zinc-700">{t.liveChatInboxEmpty}</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {inbox.map((item) => {
            const guestName =
              [item.guestFirstName, item.guestLastName].filter(Boolean).join(" ") || "—";
            const isEmergency = item.emergencyAt && !item.emergencyAcknowledged;
            const timeLabel = formatInboxTime(item.lastMessageAt);

            return (
              <li
                key={item.sessionId}
                className={cn(
                  "overflow-hidden rounded-2xl border bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
                  isEmergency ? "border-rose-200/90" : "border-zinc-200/80",
                )}
              >
                <div className="flex items-stretch">
                  {isEmergency && (
                    <span className="w-1 shrink-0 bg-rose-500" aria-hidden />
                  )}
                  <button
                    type="button"
                    onClick={() => openChat(item)}
                    className="flex min-h-[76px] min-w-0 flex-1 items-center gap-3 px-3.5 py-3 text-left transition-colors active:bg-zinc-50"
                  >
                    <span
                      className={cn(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[13px] font-bold",
                        isEmergency
                          ? "bg-rose-100 text-rose-600"
                          : "bg-zinc-100 text-zinc-700",
                      )}
                    >
                      {isEmergency ? (
                        <AlertTriangle className="h-5 w-5" strokeWidth={2.25} />
                      ) : (
                        item.roomNumber
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[15px] font-semibold text-zinc-900">
                          {t.liveChatRoomLabel.replace("{room}", item.roomNumber)}
                        </p>
                        {item.hasUnread && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-sky-500" />
                        )}
                      </div>
                      <p className="truncate text-[12px] font-medium text-zinc-500">{guestName}</p>
                      <p
                        className={cn(
                          "mt-1 line-clamp-2 text-[13px] leading-snug",
                          item.hasUnread ? "font-medium text-zinc-800" : "text-zinc-400",
                        )}
                      >
                        {item.lastMessagePreview || "—"}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5 self-center">
                      {timeLabel ? (
                        <span className="text-[11px] font-medium tabular-nums text-zinc-400">
                          {timeLabel}
                        </span>
                      ) : null}
                      <ChevronRight className="h-4 w-4 text-zinc-300" aria-hidden />
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(item.sessionId)}
                    disabled={deletingId === item.sessionId}
                    className="flex w-12 shrink-0 items-center justify-center border-s border-zinc-100 text-zinc-400 transition-colors active:bg-rose-50 active:text-rose-600 disabled:opacity-50"
                    aria-label={t.liveChatDeleteSession}
                  >
                    {deletingId === item.sessionId ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </li>
            );
          })}

          <div ref={sentinelRef} className="h-1" aria-hidden />
          {isFetchingNextPage && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-zinc-300" />
            </div>
          )}
        </ul>
      )}
    </div>
  );
}
