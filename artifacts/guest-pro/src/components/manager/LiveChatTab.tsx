/**
 * LiveChatTab — reception inbox for active guest live chats.
 */
import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MessageCircle, AlertTriangle, Trash2, Loader2 } from "lucide-react";
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
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-4 w-4 text-sky-600" />
        <h2 className="text-[14px] font-semibold text-zinc-800">{t.liveChatTabTitle}</h2>
        {total > 0 && (
          <span className="text-[11px] font-mono text-zinc-400">({total})</span>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-300" />
        </div>
      ) : inbox.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-zinc-200/80 bg-white py-12">
          <MessageCircle className="h-8 w-8 text-zinc-200" />
          <p className="mt-3 text-[13px] font-medium text-zinc-600">{t.liveChatInboxEmpty}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {inbox.map((item) => {
            const guestName =
              [item.guestFirstName, item.guestLastName].filter(Boolean).join(" ") || "—";
            const isEmergency = item.emergencyAt && !item.emergencyAcknowledged;

            return (
              <div
                key={item.sessionId}
                className={cn(
                  "flex w-full items-center gap-2 rounded-xl border px-2 py-1 transition-colors",
                  isEmergency
                    ? "border-rose-200 bg-rose-50/80"
                    : "border-zinc-200/80 bg-white",
                )}
              >
                <button
                  type="button"
                  onClick={() => openChat(item)}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-zinc-50/80"
                >
                  <span
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[12px] font-bold",
                      isEmergency ? "bg-rose-100 text-rose-600" : "bg-zinc-100 text-zinc-600",
                    )}
                  >
                    {isEmergency ? <AlertTriangle className="h-4 w-4" /> : item.roomNumber}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-zinc-900">
                      {t.liveChatRoomLabel.replace("{room}", item.roomNumber)} · {guestName}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-zinc-400">
                      {item.lastMessagePreview || "—"}
                    </p>
                  </div>
                  {item.hasUnread && (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-sky-500" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(item.sessionId)}
                  disabled={deletingId === item.sessionId}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                  aria-label={t.liveChatDeleteSession}
                >
                  {deletingId === item.sessionId ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            );
          })}

          <div ref={sentinelRef} className="h-1" aria-hidden />
          {isFetchingNextPage && (
            <div className="flex justify-center py-3">
              <Loader2 className="h-5 w-5 animate-spin text-zinc-300" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
