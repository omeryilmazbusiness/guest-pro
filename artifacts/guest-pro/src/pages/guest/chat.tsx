import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  useCreateChatSession,
  useGetChatMessages,
  useSendMessage,
  useGetHotelBranding,
  useListQuickActions,
  useLogout,
} from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { LogOut, Send, Loader2, MapPin, Calendar, Phone, ArrowLeft, MessageSquare, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import type { Message } from "@workspace/api-client-react/generated/api.schemas";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ShimmerBubble } from "@/components/chat/ShimmerBubble";
import { OptimisticUserBubble } from "@/components/chat/OptimisticUserBubble";

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  "map-pin": MapPin,
  "calendar": Calendar,
  "phone": Phone,
  "activity": Calendar,
};

export default function GuestChat() {
  const { user, isAuthenticated, logoutAuth } = useAuth();
  const [, setLocation] = useLocation();
  const logoutMutation = useLogout();

  const createSessionMutation = useCreateChatSession();
  const sendMessageMutation = useSendMessage();

  const { data: branding } = useGetHotelBranding();
  const { data: quickActions } = useListQuickActions();

  const [sessionId, setSessionId] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [pendingUserMessage, setPendingUserMessage] = useState<string | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [pendingAutoSend, setPendingAutoSend] = useState<string | null>(null);
  const autoSendFiredRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const seenIdsRef = useRef<Set<number>>(new Set());
  const initialLoadedRef = useRef(false);
  const [animatingIds, setAnimatingIds] = useState<Set<number>>(new Set());

  const {
    data: messages,
    isLoading: messagesLoading,
    refetch: refetchMessages,
  } = useGetChatMessages(sessionId!, {
    query: { enabled: !!sessionId },
  });

  // Auth guard
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/");
    } else if (user?.role !== "guest") {
      setLocation("/manager");
    }
  }, [isAuthenticated, user, setLocation]);

  // Parse ?q= param from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (q) {
      setPendingAutoSend(decodeURIComponent(q));
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // Create session on mount
  useEffect(() => {
    if (isAuthenticated && user?.role === "guest" && !sessionId) {
      createSessionMutation.mutate(undefined, {
        onSuccess: (session: { id: number }) => {
          setSessionId(session.id);
        },
      });
    }
  }, [isAuthenticated, user, sessionId]);

  // Auto-send when session + messages are ready
  useEffect(() => {
    if (sessionId && pendingAutoSend && !autoSendFiredRef.current && !messagesLoading) {
      autoSendFiredRef.current = true;
      const msg = pendingAutoSend;
      setPendingAutoSend(null);
      handleSend(msg);
    }
  }, [sessionId, pendingAutoSend, messagesLoading]);

  // Track new message IDs for animation
  useEffect(() => {
    if (!messages) return;
    if (!initialLoadedRef.current) {
      messages.forEach((m: Message) => seenIdsRef.current.add(m.id));
      initialLoadedRef.current = true;
      return;
    }
    const newIds: number[] = [];
    messages.forEach((m: Message) => {
      if (!seenIdsRef.current.has(m.id)) {
        newIds.push(m.id);
        seenIdsRef.current.add(m.id);
      }
    });
    if (newIds.length > 0) {
      setAnimatingIds((prev) => new Set([...prev, ...newIds]));
    }
  }, [messages]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pendingUserMessage]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const handleSend = (content: string) => {
    if (!content.trim() || !sessionId || quotaExceeded) return;
    const trimmed = content.trim();
    setPendingUserMessage(trimmed);
    setInputValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    sendMessageMutation.mutate(
      { sessionId, data: { content: trimmed } },
      {
        onSuccess: () => {
          setPendingUserMessage(null);
          refetchMessages();
        },
        onError: (err: { data?: { quotaExceeded?: boolean; error?: string } }) => {
          setPendingUserMessage(null);
          if (err.data?.quotaExceeded) {
            setQuotaExceeded(true);
          } else {
            toast.error(err.data?.error || "Failed to send. Please try again.");
            setInputValue(trimmed);
          }
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(inputValue);
    }
  };

  const handleLogout = () => {
    logoutAuth();
    logoutMutation.mutate(undefined);
    toast.success("You've checked out. Safe travels!");
  };

  if (!isAuthenticated || user?.role !== "guest") return null;

  const visibleMessages = messages?.filter((m: Message) => m.role !== "system") ?? [];
  const isWaiting = sendMessageMutation.isPending;
  const hasMessages = visibleMessages.length > 0 || !!pendingUserMessage;

  return (
    <div className="flex flex-col h-[100dvh] bg-[#F8F8F8]">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-zinc-100/80 shrink-0 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 h-[64px] flex items-center gap-3">
          <button
            onClick={() => setLocation("/guest")}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 transition-all -ml-1"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-medium text-zinc-900 truncate">
              {branding?.appName || "Concierge"}
            </p>
            <p className="text-[11px] text-zinc-400 uppercase tracking-wide font-medium">
              {user.firstName} &middot; Room {user.roomNumber}
            </p>
          </div>
          <button
            data-testid="button-checkout"
            onClick={handleLogout}
            className="text-zinc-400 hover:text-zinc-700 transition-colors p-1"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto w-full max-w-3xl mx-auto px-4 md:px-8 py-5">
        {!sessionId || messagesLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-18 w-3/4 max-w-sm rounded-3xl rounded-tl-sm bg-zinc-100" />
            <div className="flex justify-end">
              <Skeleton className="h-12 w-2/3 max-w-xs rounded-3xl rounded-tr-sm bg-zinc-100" />
            </div>
            <Skeleton className="h-24 w-5/6 max-w-md rounded-3xl rounded-tl-sm bg-zinc-100" />
          </div>
        ) : !hasMessages ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-4 animate-in fade-in duration-500">
            <div className="w-16 h-16 rounded-full bg-white border border-zinc-100 shadow-sm flex items-center justify-center">
              <MessageSquare className="w-7 h-7 text-zinc-300" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-[18px] font-serif text-zinc-800">
                How can I help?
              </h2>
              <p className="text-zinc-400 text-[14px] leading-relaxed max-w-xs">
                Ask me anything about your stay, the hotel, or local tips.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 pb-2">
            {visibleMessages.map((msg: Message) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                animate={animatingIds.has(msg.id)}
              />
            ))}
            {isWaiting && pendingUserMessage && (
              <OptimisticUserBubble content={pendingUserMessage} />
            )}
            {isWaiting && <ShimmerBubble />}
            {quotaExceeded && (
              <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-400">
                <div className="max-w-[88%] px-5 py-4 bg-white rounded-3xl rounded-tl-sm border border-zinc-100 shadow-sm flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-zinc-400 shrink-0 mt-0.5" />
                  <p className="text-[15px] text-zinc-600 leading-relaxed">
                    Bugünkü mesaj limitiniz doldu. Lütfen yarın tekrar deneyin.
                  </p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-2" />
          </div>
        )}
      </main>

      {/* Input area */}
      <div className="shrink-0 sticky bottom-0 z-20 bg-[#F8F8F8]/95 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 md:px-8 pt-2 pb-6 space-y-3">
          {/* Quick actions — shown only before first message */}
          {!messagesLoading && !hasMessages && quickActions && quickActions.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none snap-x">
              {quickActions.map((action: { id: number; icon?: string; label: string }) => {
                const IconComponent = ICON_MAP[action.icon ?? ""] ?? MapPin;
                return (
                  <button
                    key={action.id}
                    onClick={() => handleSend(action.label)}
                    className="shrink-0 snap-start bg-white border border-zinc-200 shadow-sm px-4 py-2.5 rounded-full text-[13px] font-medium text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300 active:scale-95 transition-all whitespace-nowrap flex items-center gap-1.5"
                  >
                    <IconComponent className="w-3.5 h-3.5 text-zinc-400" />
                    {action.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Chat input */}
          <div
            className={`flex items-end gap-3 bg-white rounded-3xl border shadow-sm transition-all duration-200 px-4 py-2.5 ${
              quotaExceeded
                ? "border-zinc-100 opacity-60"
                : "border-zinc-200 focus-within:border-zinc-300 focus-within:shadow-md"
            }`}
          >
            <textarea
              ref={textareaRef}
              data-testid="input-message"
              value={inputValue}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={
                quotaExceeded
                  ? "Daily limit reached. See you tomorrow."
                  : "Ask for anything…"
              }
              rows={1}
              className="flex-1 max-h-[120px] bg-transparent border-0 resize-none outline-none focus:ring-0 py-2 text-[15px] text-zinc-900 placeholder:text-zinc-400 leading-relaxed font-sans"
              disabled={isWaiting || !sessionId || quotaExceeded}
            />
            <div className="shrink-0 pb-1">
              <button
                data-testid="button-send"
                disabled={!inputValue.trim() || isWaiting || !sessionId || quotaExceeded}
                onClick={() => handleSend(inputValue)}
                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200 active:scale-95 ${
                  inputValue.trim() && !isWaiting && !quotaExceeded
                    ? "bg-zinc-900 text-white shadow-sm hover:bg-zinc-800"
                    : "bg-zinc-100 text-zinc-400"
                }`}
              >
                {isWaiting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
