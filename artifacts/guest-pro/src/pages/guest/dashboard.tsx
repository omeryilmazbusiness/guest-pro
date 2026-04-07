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
import { LogOut, Send, Loader2, MapPin, Calendar, Sparkles, Phone, AlertCircle } from "lucide-react";
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

export default function GuestDashboard() {
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

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/");
    } else if (user?.role !== "guest") {
      setLocation("/manager");
    }
  }, [isAuthenticated, user, setLocation]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "guest" && !sessionId) {
      createSessionMutation.mutate(undefined, {
        onSuccess: (session: { id: number }) => {
          setSessionId(session.id);
        },
      });
    }
  }, [isAuthenticated, user, sessionId]);

  useEffect(() => {
    if (!messages) return;

    if (!initialLoadedRef.current) {
      messages.forEach((m: Message) => seenIdsRef.current.add(m.id));
      initialLoadedRef.current = true;
      return;
    }

    const newAnimatingIds: number[] = [];
    messages.forEach((m: Message) => {
      if (!seenIdsRef.current.has(m.id)) {
        newAnimatingIds.push(m.id);
        seenIdsRef.current.add(m.id);
      }
    });

    if (newAnimatingIds.length > 0) {
      setAnimatingIds((prev) => new Set([...prev, ...newAnimatingIds]));
    }
  }, [messages]);

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
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

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
            toast.error(err.data?.error || "Failed to send message. Please try again.");
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
        <div className="max-w-3xl mx-auto px-5 md:px-8 h-[72px] flex items-center justify-between">
          <div>
            <h1 className="font-serif text-[19px] font-medium text-zinc-900 tracking-tight">
              {branding?.appName || "Guest Pro"}
            </h1>
            <p className="text-[11px] text-zinc-400 font-medium tracking-wide uppercase mt-0.5">
              {user.firstName} &middot; Room {user.roomNumber}
            </p>
          </div>
          <button
            data-testid="button-checkout"
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-700 transition-colors text-sm py-2 px-1 -mr-1"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto w-full max-w-3xl mx-auto px-4 md:px-8 py-6">
        {!sessionId || messagesLoading ? (
          <div className="space-y-5">
            <Skeleton className="h-20 w-3/4 max-w-sm rounded-3xl rounded-tl-sm bg-zinc-100" />
            <div className="flex justify-end">
              <Skeleton className="h-14 w-2/3 max-w-xs rounded-3xl rounded-tr-sm bg-zinc-100" />
            </div>
            <Skeleton className="h-28 w-5/6 max-w-md rounded-3xl rounded-tl-sm bg-zinc-100" />
          </div>
        ) : !hasMessages ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-5 animate-in fade-in duration-700">
            <div className="w-20 h-20 rounded-full bg-white shadow-md shadow-zinc-200/60 flex items-center justify-center border border-zinc-50">
              <Sparkles className="w-8 h-8 text-zinc-300" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-serif text-zinc-800">
                {branding?.welcomeText
                  ? branding.welcomeText.split("!")[0] + "!"
                  : `Good to see you, ${user.firstName}`}
              </h2>
              <p className="text-zinc-400 max-w-xs mx-auto text-[15px] leading-relaxed">
                I'm your personal concierge. How can I make your stay exceptional today?
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 pb-2">
            {/* Persisted messages */}
            {visibleMessages.map((msg: Message) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                animate={animatingIds.has(msg.id)}
              />
            ))}

            {/* Optimistic user message — animates while AI is thinking */}
            {isWaiting && pendingUserMessage && (
              <OptimisticUserBubble content={pendingUserMessage} />
            )}

            {/* Premium shimmer loading bubble — AI is thinking */}
            {isWaiting && <ShimmerBubble />}

            {/* Quota exceeded — shown inline as a system message */}
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

      {/* Input bar */}
      <div className="shrink-0 sticky bottom-0 z-20 bg-[#F8F8F8]/95 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 md:px-8 pt-2 pb-6 space-y-3">

          {/* Quick actions — only before first message */}
          {!messagesLoading && !hasMessages && quickActions && quickActions.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory">
              {quickActions.map((action: { id: number; icon?: string; label: string }) => {
                const IconComponent = ICON_MAP[action.icon ?? ""] ?? MapPin;
                return (
                  <button
                    key={action.id}
                    data-testid={`quick-action-${action.id}`}
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
              placeholder={quotaExceeded ? "Daily limit reached. See you tomorrow." : "Ask for anything…"}
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
