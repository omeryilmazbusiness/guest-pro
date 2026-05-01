import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocale } from "@/hooks/use-locale";
import {
  useCreateChatSession,
  useGetChatMessages,
  useSendMessage,
  useGetHotelBranding,
  useListQuickActions,
  useLogout,
  customFetch,
} from "@workspace/api-client-react";
import { useLocation } from "wouter";
import {
  LogOut,
  Send,
  Loader2,
  MapPin,
  Calendar,
  Phone,
  ArrowLeft,
  MessageSquare,
  AlertCircle,
  Trash2,
  UtensilsCrossed,
  Bell,
  Heart,
  CheckCircle2,
} from "lucide-react";
import { createServiceRequest } from "@/lib/service-requests";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import type { Message, QuickAction } from "@workspace/api-client-react";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ShimmerBubble } from "@/components/chat/ShimmerBubble";
import { OptimisticUserBubble } from "@/components/chat/OptimisticUserBubble";
import { MicrophoneButton } from "@/components/chat/MicrophoneButton";
import { VoiceConversationPanel } from "@/components/chat/VoiceConversationPanel";
import { useVoiceConversation } from "@/hooks/use-voice-conversation";
import { VoiceDiagnosticsLogger } from "@/lib/voice/diagnostics";
import { tFmt } from "@/lib/i18n";

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  "map-pin": MapPin,
  calendar: Calendar,
  phone: Phone,
  activity: Calendar,
};

export default function GuestChat() {
  const { user, isAuthenticated, logoutAuth } = useAuth();
  const [, setLocation] = useLocation();
  const logoutMutation = useLogout();
  const { t, voiceLocale } = useLocale();

  const createSessionMutation = useCreateChatSession();
  const sendMessageMutation = useSendMessage();

  const { data: branding } = useGetHotelBranding();
  const { data: quickActions } = useListQuickActions();

  const [sessionId, setSessionId] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [pendingUserMessage, setPendingUserMessage] = useState<string | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [pendingAutoSend, setPendingAutoSend] = useState<string | null>(null);
  const [voiceAutoStart, setVoiceAutoStart] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [activeChatMode, setActiveChatMode] = useState<"food" | "support" | "care" | "general">("general");
  const [showRequestCreated, setShowRequestCreated] = useState(false);
  const [isCreatingRequest, setIsCreatingRequest] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState<string>(voiceLocale);

  // Sync detectedLanguage when voiceLocale resolves from the async /auth/me call.
  // On first render user.language is not yet loaded, so voiceLocale starts as
  // the fallback (en-US or kiosk locale). This effect fires once when the real
  // DB locale (e.g. "ru-RU") arrives, ensuring AI receives the correct language.
  // After that voiceLocale is stable, so voice-detection overrides are preserved.
  useEffect(() => {
    setDetectedLanguage(voiceLocale);
  }, [voiceLocale]);

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
    query: { enabled: !!sessionId, queryKey: ["chat-messages", sessionId] },
  });

  // ── Voice conversation hook ──────────────────────────────────────────────
  const conv = useVoiceConversation({
    defaultLang: voiceLocale,
    onSpeechResult: (transcript, lang) => {
      setDetectedLanguage(lang);
      // Mark we're processing — the AI response will trigger speakResponse
      conv.setProcessing();
      handleSend(transcript, lang);
    },
    messages: {
      notSupported: t.voiceNotSupported,
      micDenied: t.micDenied,
    },
  });

  // ── Auth guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/");
    } else if (user?.role !== "guest") {
      setLocation("/manager");
    }
  }, [isAuthenticated, user, setLocation]);

  // ── Parse URL params on mount ─────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    const voice = params.get("voice");
    const mode = params.get("mode");

    if (q) setPendingAutoSend(decodeURIComponent(q));
    if (voice === "1") setVoiceAutoStart(true);

    if (mode === "food" || mode === "support" || mode === "care") {
      setActiveChatMode(mode);
      const modeIntros: Record<string, string> = {
        food: "Acıktım, bir şeyler sipariş etmek istiyorum.",
        support: "Destek talebim var, yardımcı olur musunuz?",
        care: "Hizmet tercihlerimi paylaşmak istiyorum.",
      };
      setPendingAutoSend(modeIntros[mode]);
    }

    window.history.replaceState({}, "", window.location.pathname);
  }, []);

  // ── Create session on mount ───────────────────────────────────────────────
  useEffect(() => {
    if (isAuthenticated && user?.role === "guest" && !sessionId) {
      createSessionMutation.mutate(undefined, {
        onSuccess: (session: { id: number }) => setSessionId(session.id),
      });
    }
  }, [isAuthenticated, user, sessionId]);

  // ── Auto-start voice conversation if ?voice=1 ─────────────────────────────
  // NOTE: deliberately does NOT check autoSendFiredRef — the two concerns are
  // independent. If ?q= and ?voice=1 both appear (home mic → chat navigation),
  // the transcript auto-send and the conversation loop must both run.
  // The loop will be in "listening" state; when the AI responds to the auto-sent
  // transcript, the messages useEffect calls speakResponse to close the loop.
  useEffect(() => {
    if (voiceAutoStart && sessionId && !messagesLoading) {
      setVoiceAutoStart(false);
      VoiceDiagnosticsLogger.log("chat:voice-auto-start");
      if (conv.capability.sttSupported) {
        conv.startConversation();
      } else {
        toast.error(t.voiceNotSupported);
      }
    }
  }, [voiceAutoStart, sessionId, messagesLoading]);

  // ── Auto-send ?q= param ───────────────────────────────────────────────────
  useEffect(() => {
    if (sessionId && pendingAutoSend && !autoSendFiredRef.current && !messagesLoading) {
      autoSendFiredRef.current = true;
      const msg = pendingAutoSend;
      setPendingAutoSend(null);
      handleSend(msg, detectedLanguage);
    }
  }, [sessionId, pendingAutoSend, messagesLoading]);

  // ── Track new messages → animation + TTS loop ─────────────────────────────
  useEffect(() => {
    if (!messages) return;

    if (!initialLoadedRef.current) {
      messages.forEach((m: Message) => seenIdsRef.current.add(m.id));
      initialLoadedRef.current = true;
      return;
    }

    const newIds: number[] = [];
    const newAssistantMessages: Message[] = [];

    messages.forEach((m: Message) => {
      if (!seenIdsRef.current.has(m.id)) {
        newIds.push(m.id);
        if (m.role === "assistant") newAssistantMessages.push(m);
        seenIdsRef.current.add(m.id);
      }
    });

    if (newIds.length > 0) {
      setAnimatingIds((prev) => new Set([...prev, ...newIds]));
    }

    // Voice conversation loop: speak AI response then resume listening
    if (conv.isActive && newAssistantMessages.length > 0) {
      const latest = newAssistantMessages[newAssistantMessages.length - 1];
      VoiceDiagnosticsLogger.log("chat:ai-response-speak", latest.content.slice(0, 40));
      conv.speakResponse(latest.content, detectedLanguage);
    }
  }, [messages]);

  // ── Scroll to bottom ──────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pendingUserMessage]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const handleSend = (content: string, lang?: string) => {
    if (!content.trim() || !sessionId || quotaExceeded) return;
    const trimmed = content.trim();
    setPendingUserMessage(trimmed);
    setInputValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    sendMessageMutation.mutate(
      { sessionId, data: { content: trimmed, language: lang ?? detectedLanguage, chatMode: activeChatMode } as Parameters<typeof sendMessageMutation.mutate>[0]["data"] },
      {
        onSuccess: () => {
          setPendingUserMessage(null);
          refetchMessages();
        },
        onError: (err: unknown) => {
          setPendingUserMessage(null);
          const errData = (err as { data?: { quotaExceeded?: boolean; error?: string } | null })?.data;
          if (errData?.quotaExceeded) {
            setQuotaExceeded(true);
            // Can't continue conversation if quota exceeded
            if (conv.isActive) conv.stopConversation();
          } else {
            toast.error(errData?.error || t.sendFailed);
            setInputValue(trimmed);
            // Voice: transition back to listening after error
            if (conv.isActive) conv.retryListening();
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

  const handleClearAll = async () => {
    if (!sessionId) return;
    setIsClearing(true);
    try {
      await customFetch(`/api/chat/sessions/${sessionId}/messages`, { method: "DELETE" });
      seenIdsRef.current = new Set();
      initialLoadedRef.current = false;
      autoSendFiredRef.current = false;
      setAnimatingIds(new Set());
      setQuotaExceeded(false);
      setDetectedLanguage(voiceLocale);
      if (conv.isActive) conv.stopConversation();
      window.speechSynthesis?.cancel();
      await refetchMessages();
      toast.success(t.clearedMessage);
    } catch {
      toast.error(t.sendFailed);
    } finally {
      setIsClearing(false);
      setShowClearConfirm(false);
    }
  };

  const handleLogout = () => {
    if (conv.isActive) conv.stopConversation();
    logoutAuth();
    logoutMutation.mutate(undefined);
    toast.success(t.logoutSuccess);
  };

  const toggleVoiceConversation = () => {
    if (conv.isActive) {
      conv.stopConversation();
    } else {
      conv.startConversation();
    }
  };

  const handleCreateRequest = useCallback(async () => {
    if (!sessionId || activeChatMode === "general") return;
    setIsCreatingRequest(true);

    const lastAiMessages = (messages ?? [])
      .filter((m: Message) => m.role === "assistant")
      .slice(-2)
      .map((m: Message) => m.content)
      .join(" ");

    const typeMap = {
      food: "FOOD_ORDER" as const,
      support: "SUPPORT_REQUEST" as const,
      care: "CARE_PROFILE_UPDATE" as const,
    };

    const summaryPrefixes = {
      food: "Yemek siparişi: ",
      support: "Destek talebi: ",
      care: "Misafir tercihleri: ",
    };

    const rawSummary = lastAiMessages || "Rehberli sohbet tamamlandı.";
    const summary = (summaryPrefixes[activeChatMode] || "") + rawSummary.slice(0, 500);

    try {
      await createServiceRequest({
        requestType: typeMap[activeChatMode],
        summary,
        sourceSessionId: sessionId ?? undefined,
      });
      setShowRequestCreated(true);
    } catch {
      toast.error("Talep oluşturulurken bir hata oluştu.");
    } finally {
      setIsCreatingRequest(false);
    }
  }, [sessionId, activeChatMode, messages]);

  if (!isAuthenticated || user?.role !== "guest") return null;

  const visibleMessages = messages?.filter((m: Message) => m.role !== "system") ?? [];

  const MODE_CONFIG = {
    food: { icon: UtensilsCrossed, label: "Yemek Siparişi", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
    support: { icon: Bell, label: "Destek Talebi", color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200" },
    care: { icon: Heart, label: "Care About Me", color: "text-rose-500", bg: "bg-rose-50", border: "border-rose-200" },
    general: { icon: MessageSquare, label: "", color: "text-zinc-500", bg: "bg-zinc-50", border: "border-zinc-200" },
  };
  const modeConfig = MODE_CONFIG[activeChatMode];
  const isGuidedMode = activeChatMode !== "general";
  const assistantMessageCount = visibleMessages.filter((m: Message) => m.role === "assistant").length;
  const canCreateRequest = isGuidedMode && assistantMessageCount >= 1 && !showRequestCreated;
  const isWaiting = sendMessageMutation.isPending;
  const hasMessages = visibleMessages.length > 0 || !!pendingUserMessage;
  const voiceActive = conv.isActive;

  return (
    <div className="flex flex-col h-[100dvh] bg-[#F8F8F8]">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-zinc-100/80 shrink-0 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 h-[64px] flex items-center gap-3">
          <button
            onClick={() => { if (conv.isActive) conv.stopConversation(); setLocation("/guest"); }}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 transition-all -ml-1"
            aria-label={t.backLabel}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[15px] font-medium text-zinc-900 truncate">
                {branding?.appName || "Concierge"}
              </p>
              {isGuidedMode && (
                <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${modeConfig.bg} ${modeConfig.color} ${modeConfig.border}`}>
                  {modeConfig.label}
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400 uppercase tracking-wide font-medium">
              {tFmt(t.headerRoom, {
                name: user.firstName ?? "",
                room: user.roomNumber ?? "",
              })}
            </p>
          </div>

          {hasMessages && !voiceActive && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 transition-all"
              aria-label={t.clearChatLabel}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            data-testid="button-checkout"
            onClick={handleLogout}
            className="text-zinc-400 hover:text-zinc-700 transition-colors p-1"
            aria-label={t.logout}
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
          /* Empty state — show hero mic */
          <div className="h-full flex flex-col items-center justify-center text-center gap-5 animate-in fade-in duration-500">
            <div className="w-16 h-16 rounded-full bg-white border border-zinc-100 shadow-sm flex items-center justify-center">
              <MessageSquare className="w-7 h-7 text-zinc-300" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-[18px] font-serif text-zinc-800">{t.emptyTitle}</h2>
              <p className="text-zinc-400 text-[14px] leading-relaxed max-w-xs">
                {t.emptySubtitle}
              </p>
            </div>
            {conv.capability.sttSupported && (
              <MicrophoneButton
                isConversationActive={voiceActive}
                isListening={conv.state === "listening"}
                amplitude={conv.amplitude}
                isSupported={conv.capability.sttSupported}
                onToggle={toggleVoiceConversation}
                variant="hero"
                size="lg"
              />
            )}
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
                    {t.quotaMessage}
                  </p>
                </div>
              </div>
            )}

            {/* Guided mode: Create Request CTA */}
            {canCreateRequest && !isWaiting && (() => {
              const ModeIcon = modeConfig.icon;
              return (
                <div className="flex justify-center py-2 animate-in fade-in slide-in-from-bottom-2 duration-400">
                  <button
                    onClick={handleCreateRequest}
                    disabled={isCreatingRequest}
                    className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[14px] font-semibold shadow-sm transition-all active:scale-95 ${modeConfig.bg} ${modeConfig.color} border ${modeConfig.border}`}
                  >
                    {isCreatingRequest ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ModeIcon className="w-4 h-4" />
                    )}
                    Talebi Oluştur ve Personeli Bildir
                  </button>
                </div>
              );
            })()}

            {showRequestCreated && (
              <div className="flex justify-center py-2 animate-in fade-in slide-in-from-bottom-2 duration-400">
                <div className="flex items-center gap-2 px-5 py-3 rounded-2xl text-[14px] font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200">
                  <CheckCircle2 className="w-4 h-4" />
                  Talebiniz iletildi, personelimiz yakında ilgilenecek.
                </div>
              </div>
            )}

            <div ref={messagesEndRef} className="h-2" />
          </div>
        )}
      </main>

      {/* Bottom area — voice panel OR text input */}
      <div className="shrink-0 sticky bottom-0 z-20 bg-[#F8F8F8]/95 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 md:px-8 pt-2 pb-6 space-y-3">

          {voiceActive ? (
            /* ── Voice Conversation Panel ─────────────────────────────── */
            <VoiceConversationPanel
              state={conv.state}
              transcript={conv.transcript}
              amplitude={conv.amplitude}
              capability={conv.capability}
              errorMessage={conv.errorMessage}
              onStop={conv.stopConversation}
              onInterrupt={conv.interruptAndListen}
              onRetry={conv.retryListening}
            />
          ) : (
            /* ── Text input area ──────────────────────────────────────── */
            <>
              {/* Quick actions (empty state only) */}
              {!messagesLoading && !hasMessages && quickActions && quickActions.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none snap-x">
                  {quickActions.map((action: QuickAction) => {
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

              {/* Chat input bar */}
              <div
                className={`flex items-end gap-2 bg-white rounded-3xl border shadow-sm transition-all duration-200 px-4 py-2.5 ${
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
                    quotaExceeded ? t.quotaPlaceholder : t.inputPlaceholder
                  }
                  rows={1}
                  className="flex-1 max-h-[120px] bg-transparent border-0 resize-none outline-none focus:ring-0 py-2 text-[15px] text-zinc-900 placeholder:text-zinc-400 leading-relaxed font-sans"
                  disabled={isWaiting || !sessionId || quotaExceeded}
                />

                {/* Mic toggle — starts conversation mode */}
                {conv.capability.sttSupported && !quotaExceeded && (
                  <div className="shrink-0 pb-1">
                    <MicrophoneButton
                      isConversationActive={false}
                      isSupported={conv.capability.sttSupported}
                      onToggle={toggleVoiceConversation}
                      size="sm"
                      variant="inline"
                    />
                  </div>
                )}

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
            </>
          )}
        </div>
      </div>

      {/* Clear confirmation overlay */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
            <div className="text-center space-y-2 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-5 h-5 text-zinc-400" />
              </div>
              <h3 className="text-[17px] font-serif font-medium text-zinc-900">
                {t.clearTitle}
              </h3>
              <p className="text-[14px] text-zinc-500 leading-relaxed">
                {t.clearMessage}
              </p>
            </div>
            <div className="space-y-2">
              <button
                onClick={handleClearAll}
                disabled={isClearing}
                className="w-full bg-zinc-900 text-white rounded-2xl py-3.5 text-[15px] font-medium flex items-center justify-center gap-2 active:scale-[0.99] transition-all disabled:opacity-50"
              >
                {isClearing ? <Loader2 className="w-4 h-4 animate-spin" /> : t.clearConfirm}
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                disabled={isClearing}
                className="w-full text-zinc-500 rounded-2xl py-3 text-[15px] font-medium hover:text-zinc-700 transition-colors"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
