/**
 * LiveChatPopup — bottom-right chat window for reception staff.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { X, Minus, Send, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useStaffLocale } from "@/hooks/use-staff-locale";
import { invalidateLiveChatInbox } from "@/hooks/use-live-chat-inbox";
import {
  fetchLiveChatMessages,
  sendLiveChatStaffMessage,
  sendLiveChatStaffTyping,
  clearLiveChatSessionStaff,
  type LiveChatMessage,
} from "@/lib/live-chat-api";
import { createLiveChatPoll, type LiveChatPollHandle } from "@/lib/live-chat-sync-poll";
import {
  appendLiveChatMessage,
  mergeLiveChatMessages,
} from "@/lib/live-chat-messages";
import {
  LiveChatMessageBubble,
  LiveChatStaffInsightBubble,
  LiveChatTypingBubble,
} from "@/components/live-chat/LiveChatMessageBubble";
import { cn } from "@/lib/utils";

export function LiveChatPopup({
  sessionId,
  roomNumber,
  guestName,
  guestLanguage,
  guestUiLocale,
  minimized,
  onMinimize,
  onClose,
}: {
  sessionId: number;
  roomNumber: string;
  guestName: string;
  guestLanguage: string;
  guestUiLocale: string;
  minimized: boolean;
  onMinimize: () => void;
  onClose: () => void;
}) {
  const { t, locale } = useStaffLocale();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [guestTyping, setGuestTyping] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const seenIdsRef = useRef<Set<number>>(new Set());
  const syncPollRef = useRef<LiveChatPollHandle | null>(null);
  const [animatingIds, setAnimatingIds] = useState<Set<number>>(new Set());

  const applyMessages = useCallback(
    (res: Awaited<ReturnType<typeof fetchLiveChatMessages>>) => {
      let merged: LiveChatMessage[] = [];
      setMessages((prev) => {
        merged = mergeLiveChatMessages(prev, res.messages);
        return merged;
      });

      const newIds = new Set<number>();
      for (const m of merged) {
        if (!seenIdsRef.current.has(m.id)) newIds.add(m.id);
      }
      if (newIds.size > 0) {
        setAnimatingIds(newIds);
        setTimeout(() => setAnimatingIds(new Set()), 1000);
      }
      for (const m of merged) seenIdsRef.current.add(m.id);
      setGuestTyping(!!res.session.guestTyping);
      void invalidateLiveChatInbox(queryClient);
    },
    [queryClient],
  );

  useEffect(() => {
    if (minimized) return;

    seenIdsRef.current = new Set();
    syncPollRef.current = createLiveChatPoll(
      async (signal) => {
        const res = await fetchLiveChatMessages(sessionId, locale, signal);
        applyMessages(res);
      },
      { fast: guestTyping },
    );

    return () => {
      syncPollRef.current?.stop();
      syncPollRef.current = null;
    };
  }, [sessionId, locale, minimized, guestTyping, applyMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, guestTyping]);

  const clearTypingPulse = useCallback(() => {
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
  }, []);

  const notifyTyping = useCallback(() => {
    void sendLiveChatStaffTyping(sessionId).catch(() => {});
  }, [sessionId]);

  const handleInputChange = (value: string) => {
    setInput(value);
    clearTypingPulse();
    if (value.trim()) {
      notifyTyping();
      typingTimerRef.current = setTimeout(notifyTyping, 2500);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput("");
    clearTypingPulse();
    try {
      const msg = await sendLiveChatStaffMessage(sessionId, text, locale, guestUiLocale);
      seenIdsRef.current.add(msg.id);
      setAnimatingIds(new Set([msg.id]));
      setTimeout(() => setAnimatingIds(new Set()), 1000);
      setMessages((prev) => appendLiveChatMessage(prev, msg));
      syncPollRef.current?.kick();
      void invalidateLiveChatInbox(queryClient);
    } catch {
      toast.error(t.liveChatSendError);
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  const handleClear = async () => {
    setIsClearing(true);
    try {
      const res = await clearLiveChatSessionStaff(sessionId);
      seenIdsRef.current = new Set(res.messages.map((m) => m.id));
      setAnimatingIds(new Set());
      setMessages(res.messages);
      toast.success(t.liveChatCleared);
    } catch {
      toast.error(t.liveChatSendError);
    } finally {
      setIsClearing(false);
      setShowClearConfirm(false);
    }
  };

  if (minimized) {
    return (
      <button
        type="button"
        onClick={onMinimize}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2.5 text-[12px] font-semibold text-white shadow-lg"
      >
        {roomNumber} · {guestName}
      </button>
    );
  }

  return (
    <>
      <div className="flex h-[min(480px,70dvh)] w-[min(360px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50 px-3 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-zinc-900">
              {t.liveChatRoomLabel.replace("{room}", roomNumber)}
            </p>
            <p className="truncate text-[11px] text-zinc-400">{guestName}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {messages.length > 0 && (
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100"
                aria-label={t.liveChatClearLabel}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={onMinimize}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100"
              aria-label={t.liveChatMinimize}
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100"
              aria-label={t.cancel}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
          {messages.map((msg) => (
            <div key={msg.id} className="space-y-1">
              <LiveChatMessageBubble
                message={msg}
                isGuest={false}
                sentLabel=""
                readLabel=""
                animate={animatingIds.has(msg.id)}
                animateSend={msg.senderRole === "staff" && animatingIds.has(msg.id)}
              />
              {msg.senderRole === "guest" && msg.aiInsight && (
                <LiveChatStaffInsightBubble insight={msg.aiInsight} />
              )}
            </div>
          ))}
          {guestTyping && <LiveChatTypingBubble label={t.liveChatGuestTyping} />}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-zinc-100 p-2.5">
          <div className="flex items-end gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 focus-within:border-zinc-300">
            <textarea
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleSend();
                }
              }}
              rows={1}
              placeholder={t.liveChatInputPlaceholder}
              className="max-h-24 flex-1 resize-none bg-transparent text-[13px] outline-none"
            />
            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={!input.trim() || sending}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white disabled:opacity-40"
            >
              {sending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {showClearConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xs rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="text-[15px] font-semibold text-zinc-900">{t.liveChatClearTitle}</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-zinc-500">{t.liveChatClearMessage}</p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                disabled={isClearing}
                className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-[13px] font-medium text-zinc-600"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={() => void handleClear()}
                disabled={isClearing}
                className="flex-1 rounded-xl bg-zinc-900 py-2.5 text-[13px] font-medium text-white disabled:opacity-50"
              >
                {isClearing ? "…" : t.liveChatClearConfirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
