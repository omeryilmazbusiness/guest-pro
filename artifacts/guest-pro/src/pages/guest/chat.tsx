import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocale } from "@/hooks/use-locale";
import {
  useCreateChatSession,
  useGetChatMessages,
  useSendMessage,
  useGetHotelBranding,
  customFetch,
} from "@workspace/api-client-react";
import { ROUTES } from "@/lib/app-routes";
import { useTenantNav } from "@/hooks/use-tenant-nav";
import { HotelBrandMark } from "@/components/HotelBrandMark";
import { useHotelDisplay } from "@/hooks/use-hotel-display";
import {
  LogOut,
  Send,
  Loader2,
  ArrowLeft,
  MessageSquare,
  AlertCircle,
  Trash2,
  UtensilsCrossed,
  Hammer,
  HeartPulse,
  CheckCircle2,
} from "lucide-react";
import { createServiceRequest } from "@/lib/service-requests";
import { syncMyRequestToCache } from "@/lib/guest-my-requests-cache";
import { markGuestDashboardScrollRestore } from "@/lib/guest-dashboard-scroll";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import type { Message } from "@workspace/api-client-react";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ShimmerBubble } from "@/components/chat/ShimmerBubble";
import { OptimisticUserBubble } from "@/components/chat/OptimisticUserBubble";
import { MicrophoneButton } from "@/components/chat/MicrophoneButton";
import { VoiceConversationPanel } from "@/components/chat/VoiceConversationPanel";
import { ChatActionBar } from "@/components/chat/ChatActionBar";
import { useVoiceConversation } from "@/hooks/use-voice-conversation";
import { preloadPremiumTts } from "@/lib/voice/speech-synthesis";
import { VoiceDiagnosticsLogger } from "@/lib/voice/diagnostics";
import { stripAiMarkup } from "@/lib/chat-sanitize";
import {
  getQuickActionRoutesFromMessage,
  getReplyOptionsFromMessage,
  isAiCapacityLimitedMessage,
} from "@/lib/chat-message-meta";
import { ChatReplyChips } from "@/components/chat/ChatReplyChips";
import { abortAllSpeechSessions } from "@/lib/voice/speech-recognition";
import {
  confirmChatAction,
  type QuickActionRoute,
  type SuggestedChatAction,
} from "@/lib/chat-api";
import { AiCapacityPanel } from "@/components/chat/AiCapacityPanel";
import { tFmt } from "@/lib/i18n";
import { resolveGuestChatStarters, type ResolvedGuestChatStarter } from "@/lib/guest-chat-starters";
import { GuestChatEmptyState } from "@/components/chat/GuestChatEmptyState";
import { useGuestLogout } from "@/contexts/guest-logout-context";
import { GuestLanguageControl } from "@/components/guest/GuestLanguageControl";

export default function GuestChat() {
  const { user, isAuthenticated } = useAuth();
  const goTo = useTenantNav();
  const queryClient = useQueryClient();
  const { appName } = useHotelDisplay();
  const { t, voiceLocale } = useLocale();
  const chatStarters = useMemo(() => resolveGuestChatStarters(t), [t]);

  const createSessionMutation = useCreateChatSession();
  const sendMessageMutation = useSendMessage();

  const { data: branding } = useGetHotelBranding();

  const [sessionId, setSessionId] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [pendingUserMessage, setPendingUserMessage] = useState<string | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [aiCapacityExceeded, setAiCapacityExceeded] = useState(false);
  const [capacityQuickRoutes, setCapacityQuickRoutes] = useState<QuickActionRoute[]>([]);
  const [pendingAutoSend, setPendingAutoSend] = useState<string | null>(null);
  const [voiceAutoStart, setVoiceAutoStart] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [activeChatMode, setActiveChatMode] = useState<"food" | "support" | "care" | "general">("general");
  const [showRequestCreated, setShowRequestCreated] = useState(false);
  const [isCreatingRequest, setIsCreatingRequest] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState<string>(voiceLocale);
  const [pendingAction, setPendingAction] = useState<SuggestedChatAction | null>(null);
  const [isConfirmingAction, setIsConfirmingAction] = useState(false);
  const [replyOptions, setReplyOptions] = useState<string[]>([]);

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
  const convRef = useRef<ReturnType<typeof useVoiceConversation> | null>(null);

  const conv = useVoiceConversation({
    defaultLang: voiceLocale,
    onSpeechResult: (transcript, lang) => {
      setDetectedLanguage(lang);
      handleSend(transcript, lang);
    },
    messages: {
      notSupported: t.voiceNotSupported,
      micDenied: t.micDenied,
    },
  });
  convRef.current = conv;

  const { openLogoutConfirm } = useGuestLogout();

  useEffect(() => {
    return () => {
      convRef.current?.stopConversation();
      abortAllSpeechSessions();
      window.speechSynthesis?.cancel();
    };
  }, []);

  // ── Auth guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) {
      goTo(ROUTES.guestLogin);
    } else if (user?.role !== "guest") {
      goTo(ROUTES.manager);
    }
  }, [isAuthenticated, user, goTo]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "guest") {
      preloadPremiumTts();
    }
  }, [isAuthenticated, user?.role]);

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
      const intros: Record<string, string> = {
        food: t.chatModeIntroFood,
        support: t.chatModeIntroSupport,
        care: t.chatModeIntroCare,
      };
      setPendingAutoSend(intros[mode]);
    }

    window.history.replaceState({}, "", window.location.pathname);
  }, [t.chatModeIntroFood, t.chatModeIntroSupport, t.chatModeIntroCare]);

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

    const voice = convRef.current;
    if (voice?.isActive && newAssistantMessages.length > 0) {
      const latest = newAssistantMessages[newAssistantMessages.length - 1];
      if (!isAiCapacityLimitedMessage(latest)) {
        VoiceDiagnosticsLogger.log("chat:ai-response-speak", latest.content.slice(0, 40));
        voice.speakResponse(stripAiMarkup(latest.content), detectedLanguage);
      }
    }
  }, [messages, detectedLanguage]);

  useEffect(() => {
    if (!messages?.length) {
      setReplyOptions([]);
      return;
    }
    const latestAssistant = [...messages]
      .reverse()
      .find((m: Message) => m.role === "assistant");
    if (latestAssistant) {
      setReplyOptions(getReplyOptionsFromMessage(latestAssistant));
      if (isAiCapacityLimitedMessage(latestAssistant)) {
        setAiCapacityExceeded(true);
        setCapacityQuickRoutes(getQuickActionRoutesFromMessage(latestAssistant));
      }
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

  const handleCapacityRoute = useCallback(
    (route: QuickActionRoute) => {
      if (conv.isActive) conv.stopConversation();
      if (route.chatMessage) {
        goTo(`${route.href}?q=${encodeURIComponent(route.chatMessage)}`);
      } else {
        goTo(route.href);
      }
    },
    [conv, goTo],
  );

  const handleStarterSelect = (starter: ResolvedGuestChatStarter) => {
    setActiveChatMode(starter.mode);
    handleSend(starter.prompt);
  };

  const handleSend = (content: string, lang?: string) => {
    if (!content.trim() || !sessionId || quotaExceeded || aiCapacityExceeded) return;
    const trimmed = content.trim();
    setReplyOptions([]);
    if (conv.isActive) conv.setProcessing();
    setPendingUserMessage(trimmed);
    setInputValue("");
    setPendingAction(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const channel = conv.isActive ? "voice" : "text";

    sendMessageMutation.mutate(
      {
        sessionId,
        data: {
          content: trimmed,
          language: lang ?? detectedLanguage,
          chatMode: activeChatMode,
          channel,
        } as Parameters<typeof sendMessageMutation.mutate>[0]["data"],
      },
      {
        onSuccess: (res) => {
          setPendingUserMessage(null);
          const extras = res as typeof res & import("@/lib/chat-api").SendMessageExtras;
          if (extras.requestCreated) {
            setPendingAction(null);
            setShowRequestCreated(true);
            toast.success(t.chatRequestCreated);
          } else if (
            extras.suggestedAction?.phase === "propose" &&
            extras.suggestedAction.requestType
          ) {
            setPendingAction(extras.suggestedAction);
          } else {
            setPendingAction(null);
          }
          const opts = (extras as { replyOptions?: string[] }).replyOptions;
          if (opts?.length) setReplyOptions(opts);
          if (extras.aiCapacityExceeded) {
            setAiCapacityExceeded(true);
            setCapacityQuickRoutes(extras.quickActionRoutes ?? []);
            if (conv.isActive) conv.stopConversation();
          } else {
            setAiCapacityExceeded(false);
          }
          refetchMessages();
        },
        onError: (err: unknown) => {
          setPendingUserMessage(null);
          const errData = (err as {
            data?: {
              quotaExceeded?: boolean;
              aiUnavailable?: boolean;
              error?: string;
            } | null;
          })?.data;
          if (errData?.quotaExceeded) {
            setQuotaExceeded(true);
            if (conv.isActive) conv.stopConversation();
          } else if (errData?.aiUnavailable) {
            toast.error(errData.error || t.sendFailed);
            void refetchMessages();
            if (conv.isActive && conv.state === "processing") {
              conv.retryListening();
            }
          } else {
            toast.error(errData?.error || t.sendFailed);
            setInputValue(trimmed);
            if (conv.isActive) conv.retryListening();
          }
        },
      }
    );
  };

  const handleConfirmPendingAction = useCallback(async () => {
    if (!sessionId || !pendingAction) return;
    setIsConfirmingAction(true);
    try {
      await confirmChatAction(sessionId, pendingAction, detectedLanguage);
      setPendingAction(null);
      setShowRequestCreated(true);
      toast.success(t.chatRequestCreated);
      await refetchMessages();
      if (conv.isActive) conv.retryListening();
    } catch {
      toast.error(t.sendFailed);
    } finally {
      setIsConfirmingAction(false);
    }
  }, [sessionId, pendingAction, detectedLanguage, conv, t, refetchMessages]);

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

  const handleReplyChip = (label: string) => {
    if (quotaExceeded || sendMessageMutation.isPending) return;
    if (aiCapacityExceeded) {
      const route =
        capacityQuickRoutes.find((r) => r.label === label) ??
        capacityQuickRoutes[0];
      if (route) handleCapacityRoute(route);
      return;
    }
    if (conv.isActive) {
      conv.pauseListeningForOutgoingMessage();
    }
    handleSend(label);
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
      food: t.chatSummaryPrefixFood,
      support: t.chatSummaryPrefixSupport,
      care: t.chatSummaryPrefixCare,
    };

    const rawSummary = lastAiMessages || t.chatSummaryFallback;
    const summary = (summaryPrefixes[activeChatMode] || "") + rawSummary.slice(0, 500);

    try {
      const created = await createServiceRequest({
        requestType: typeMap[activeChatMode],
        summary,
        sourceSessionId: sessionId ?? undefined,
      });
      syncMyRequestToCache(queryClient, created);
      markGuestDashboardScrollRestore();
      setShowRequestCreated(true);
    } catch {
      toast.error(t.chatCreateRequestError);
    } finally {
      setIsCreatingRequest(false);
    }
  }, [sessionId, activeChatMode, messages, t, queryClient]);

  if (!isAuthenticated || user?.role !== "guest") return null;

  const visibleMessages = messages?.filter((m: Message) => m.role !== "system") ?? [];

  const MODE_CONFIG = {
    food: { icon: UtensilsCrossed, label: t.flowFoodLabel, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
    support: { icon: Hammer, label: t.flowSupportLabel, color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200" },
    care: { icon: HeartPulse, label: t.flowCareLabel, color: "text-rose-500", bg: "bg-rose-50", border: "border-rose-200" },
    general: { icon: MessageSquare, label: "", color: "text-zinc-500", bg: "bg-zinc-50", border: "border-zinc-200" },
  };
  const modeConfig = MODE_CONFIG[activeChatMode];
  const isGuidedMode = activeChatMode !== "general";
  const assistantMessageCount = visibleMessages.filter((m: Message) => m.role === "assistant").length;
  const canCreateRequest = isGuidedMode && assistantMessageCount >= 1 && !showRequestCreated;
  const isWaiting = sendMessageMutation.isPending;
  const hasMessages = visibleMessages.length > 0 || !!pendingUserMessage;
  const voiceActive = conv.isActive;
  const latestAssistantId = [...visibleMessages]
    .reverse()
    .find((m: Message) => m.role === "assistant")?.id;

  return (
    <div className="flex flex-col h-[100dvh] bg-[#F8F8F8]">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-zinc-100/80 shrink-0 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 h-[64px] flex items-center gap-3">
          <button
            onClick={() => { if (conv.isActive) conv.stopConversation(); goTo(ROUTES.guest); }}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 transition-all -ms-1"
            aria-label={t.backLabel}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <HotelBrandMark variant="header" framed className="shrink-0" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[15px] font-medium text-zinc-900 truncate">
                {appName || branding?.appName || "Concierge"}
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

          <div className="flex shrink-0 items-center gap-0.5">
            <GuestLanguageControl />
            <button
              data-testid="button-checkout"
              onClick={() =>
                openLogoutConfirm({
                  onBeforeLogout: () => {
                    if (conv.isActive) conv.stopConversation();
                  },
                })
              }
              className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-zinc-50 hover:text-zinc-700"
              aria-label={t.logout}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
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
        ) : !hasMessages && !voiceActive ? (
          <div className="flex min-h-full flex-col items-center justify-center px-1 py-6">
            <GuestChatEmptyState
              welcomeText={tFmt(t.welcome, { name: user.firstName ?? "" })}
              sectionLabel={t.chatStarterSectionLabel}
              starters={chatStarters}
              onSelectStarter={handleStarterSelect}
              hint={t.voiceHint}
              listeningState={t.listeningState}
              transcript={conv.transcript}
              isListening={conv.state === "listening"}
              amplitude={conv.amplitude}
              onMicClick={toggleVoiceConversation}
              micAriaLabel={conv.state === "listening" ? t.cancel : t.voiceLabel}
              sttSupported={conv.capability.sttSupported}
            />
          </div>
        ) : !hasMessages ? null : (
          <div className="space-y-3 pb-2">
            {visibleMessages.map((msg: Message) => (
              <div key={msg.id} className="space-y-0">
                <MessageBubble
                  message={msg}
                  animate={animatingIds.has(msg.id)}
                />
                {msg.role === "assistant" &&
                  msg.id === latestAssistantId &&
                  !pendingAction &&
                  !isWaiting && (
                    <ChatReplyChips
                      options={replyOptions}
                      onSelect={handleReplyChip}
                      disabled={quotaExceeded && !aiCapacityExceeded}
                    />
                  )}
              </div>
            ))}
            {isWaiting && pendingUserMessage && (
              <OptimisticUserBubble content={pendingUserMessage} />
            )}
            {isWaiting && <ShimmerBubble />}
            {aiCapacityExceeded && capacityQuickRoutes.length > 0 && (
              <AiCapacityPanel
                title={t.aiCapacityTitle}
                subtitle={t.aiCapacityHint}
                routes={capacityQuickRoutes}
                onNavigate={handleCapacityRoute}
              />
            )}
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
                    {t.chatCreateRequestCta}
                  </button>
                </div>
              );
            })()}

            {showRequestCreated && (
              <div className="flex justify-center py-2 animate-in fade-in slide-in-from-bottom-2 duration-400">
                <div className="flex items-center gap-2 px-5 py-3 rounded-2xl text-[14px] font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200">
                  <CheckCircle2 className="w-4 h-4" />
                  {t.chatRequestCreated}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} className="h-2" />
          </div>
        )}
        {pendingAction && !showRequestCreated && (
          <ChatActionBar
            action={pendingAction}
            onConfirm={handleConfirmPendingAction}
            onDismiss={() => setPendingAction(null)}
            isLoading={isConfirmingAction}
            title={t.chatActionTitle}
            confirmLabel={t.chatActionConfirm}
            dismissLabel={t.chatActionDismiss}
          />
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
              labels={{
                starting: t.voiceStarting,
                listening: t.voiceListening,
                thinking: t.voiceThinking,
                speaking: t.voiceSpeaking,
                tapInterrupt: t.voiceTapInterrupt,
                tapRetry: t.voiceTapRetry,
                notSupported: t.voiceNotSupported,
                modeLabel: t.voiceModeLabel,
                speakingFooter: t.voiceSpeakingFooter,
                processingFooter: t.voiceProcessingFooter,
                endLabel: t.voiceEndLabel,
              }}
              onStop={conv.stopConversation}
              onInterrupt={conv.interruptAndListen}
              onRetry={conv.retryListening}
            />
          ) : (
            /* ── Text input area ──────────────────────────────────────── */
            <>
              {/* Chat input bar */}
              <div
                className={`flex items-end gap-2 bg-white rounded-3xl border shadow-sm transition-all duration-200 px-4 py-2.5 ${
                  quotaExceeded || aiCapacityExceeded
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
                    aiCapacityExceeded
                      ? t.aiCapacityHint
                      : quotaExceeded
                        ? t.quotaPlaceholder
                        : t.inputPlaceholder
                  }
                  rows={1}
                  className="flex-1 max-h-[120px] bg-transparent border-0 resize-none outline-none focus:ring-0 py-2 text-[15px] text-zinc-900 placeholder:text-zinc-400 leading-relaxed font-sans"
                  disabled={isWaiting || !sessionId || quotaExceeded || aiCapacityExceeded}
                />

                {/* Mic toggle — starts conversation mode */}
                {conv.capability.sttSupported && !quotaExceeded && !aiCapacityExceeded && (
                  <div className="shrink-0 self-end pb-0.5">
                    <MicrophoneButton
                      isConversationActive={false}
                      isSupported={conv.capability.sttSupported}
                      onToggle={toggleVoiceConversation}
                      size="sm"
                      variant="inline"
                    />
                  </div>
                )}

                <div className="shrink-0 self-end pb-0.5">
                  <button
                    data-testid="button-send"
                    disabled={!inputValue.trim() || isWaiting || !sessionId || quotaExceeded}
                    onClick={() => handleSend(inputValue)}
                    className={`flex h-10 w-10 items-center justify-center rounded-2xl transition-all duration-200 active:scale-[0.94] ${
                      inputValue.trim() && !isWaiting && !quotaExceeded
                        ? "bg-black text-white shadow-[0_4px_16px_-4px_rgba(0,0,0,0.5),0_2px_4px_rgba(0,0,0,0.15)] hover:bg-zinc-900 hover:shadow-[0_6px_22px_-4px_rgba(0,0,0,0.55)]"
                        : "bg-zinc-200/80 text-zinc-400"
                    }`}
                  >
                    {isWaiting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-[18px] w-[18px]" strokeWidth={2.25} />
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
