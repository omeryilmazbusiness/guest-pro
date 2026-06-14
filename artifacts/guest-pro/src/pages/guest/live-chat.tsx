/**
 * Guest live chat with reception — intro, TTS, read receipts, typing indicator.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useSearch } from "wouter";
import {
  ArrowLeft,
  Send,
  Siren,
  Volume2,
  MessageSquare,
  Loader2,
  Trash2,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useLocale } from "@/hooks/use-locale";
import { useLiveChatDictation } from "@/hooks/use-live-chat-dictation";
import { ROUTES } from "@/lib/app-routes";
import { tFmt } from "@/lib/i18n";
import { HotelBrandMark } from "@/components/HotelBrandMark";
import {
  startLiveChatSession,
  syncLiveChatSession,
  sendLiveChatGuestMessage,
  sendLiveChatGuestLocation,
  triggerLiveChatEmergency,
  clearLiveChatSession,
  type LiveChatMessage,
} from "@/lib/live-chat-api";
import { createLiveChatPoll, type LiveChatPollHandle } from "@/lib/live-chat-sync-poll";
import {
  appendLiveChatMessage,
  mergeLiveChatMessages,
} from "@/lib/live-chat-messages";
import { readPositionOnce } from "@/lib/geolocation";
import {
  LiveChatMessageBubble,
  LiveChatTypingBubble,
} from "@/components/live-chat/LiveChatMessageBubble";
import { OptimisticUserBubble } from "@/components/chat/OptimisticUserBubble";
import { MicrophoneButton } from "@/components/chat/MicrophoneButton";
import {
  cancelSpeech,
  primeTts,
  preloadPremiumTts,
  synthesize,
} from "@/lib/voice/speech-synthesis";
import { refreshTtsStatus } from "@/lib/voice/tts-api";
import { abortAllSpeechSessions } from "@/lib/voice/speech-recognition";
import { cn } from "@/lib/utils";

const INTRO_KEY = "guest_live_chat_intro_seen";
const EMERGENCY_COOLDOWN_MS = 30_000;
const URGENT_EMERGENCY_SENT_KEY = "live_chat_urgent_emergency_sent";

export default function GuestLiveChatPage() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const isUrgentMode = new URLSearchParams(search).get("urgent") === "1";
  const { isAuthenticated, user } = useAuth();
  const { t, voiceLocale, uiLocale } = useLocale();

  const [showIntro, setShowIntro] = useState(() => {
    if (
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("urgent") === "1"
    ) {
      return false;
    }
    try {
      return !sessionStorage.getItem(INTRO_KEY);
    } catch {
      return true;
    }
  });
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [staffTyping, setStaffTyping] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [emergencySending, setEmergencySending] = useState(false);
  const [emergencyCooldownUntil, setEmergencyCooldownUntil] = useState<number | null>(null);
  const [locationSending, setLocationSending] = useState(false);
  const emergencyClientIdRef = useRef<string | null>(null);
  const urgentTriggeredRef = useRef(false);
  const syncPollRef = useRef<LiveChatPollHandle | null>(null);

  const isEmergencyOnCooldown =
    emergencyCooldownUntil != null && Date.now() < emergencyCooldownUntil;

  useEffect(() => {
    if (emergencyCooldownUntil == null) return;
    const remaining = emergencyCooldownUntil - Date.now();
    if (remaining <= 0) {
      setEmergencyCooldownUntil(null);
      return;
    }
    const id = setTimeout(() => setEmergencyCooldownUntil(null), remaining);
    return () => clearTimeout(id);
  }, [emergencyCooldownUntil]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const lastSpokenIdRef = useRef(0);
  const ttsPrimedRef = useRef(false);
  const seenIdsRef = useRef<Set<number>>(new Set());
  const dictationRef = useRef<ReturnType<typeof useLiveChatDictation> | null>(null);
  const [animatingIds, setAnimatingIds] = useState<Set<number>>(new Set());
  const [sendAnimatingIds, setSendAnimatingIds] = useState<Set<number>>(new Set());

  const speakMessage = useCallback(
    (text: string, messageId: number) => {
      if (!text.trim() || messageId <= lastSpokenIdRef.current) return;
      lastSpokenIdRef.current = messageId;
      setSpeaking(true);
      synthesize(text, voiceLocale, {
        onEnd: () => setSpeaking(false),
        onError: () => setSpeaking(false),
      });
    },
    [voiceLocale],
  );

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleSend = useCallback(
    async (rawText?: string) => {
      const text = (rawText ?? input).trim();
      if (!text || !sessionId || sending) return;

      const fromVoice = rawText != null;
      if (!fromVoice) {
        dictationRef.current?.pauseForOutgoingMessage();
      }
      abortAllSpeechSessions();

      if (!ttsPrimedRef.current) {
        primeTts();
        ttsPrimedRef.current = true;
      }

      setSending(true);
      setPendingMessage(text);
      if (!rawText) setInput("");

      try {
        const msg = await sendLiveChatGuestMessage(sessionId, text, uiLocale);
        seenIdsRef.current.add(msg.id);
        setAnimatingIds(new Set([msg.id]));
        setSendAnimatingIds(new Set([msg.id]));
        setTimeout(() => {
          setAnimatingIds(new Set());
          setSendAnimatingIds(new Set());
        }, 1200);
        setMessages((prev) => appendLiveChatMessage(prev, msg));
        syncPollRef.current?.kick();
      } catch {
        toast.error(t.liveChatSendError);
        if (!rawText) setInput(text);
      } finally {
        setPendingMessage(null);
        setSending(false);
        if (!fromVoice) {
          dictationRef.current?.resumeAfterOutgoingMessage();
        }
      }
    },
    [input, sessionId, sending, uiLocale, t.liveChatSendError],
  );

  const dictation = useLiveChatDictation({
    lang: voiceLocale,
    disabled: sending || !sessionId,
    onUtteranceComplete: async (transcript) => {
      await handleSend(transcript);
    },
  });
  dictationRef.current = dictation;

  const toggleVoiceInput = useCallback(() => {
    if (dictation.active) {
      dictation.stop();
      return;
    }
    primeTts();
    preloadPremiumTts();
    ttsPrimedRef.current = true;
    dictation.start();
  }, [dictation]);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "guest") {
      setLocation(ROUTES.guestLogin);
    }
  }, [isAuthenticated, user, setLocation]);

  useEffect(() => {
    void refreshTtsStatus(true);
  }, []);

  useEffect(() => {
    return () => {
      dictationRef.current?.stop();
      abortAllSpeechSessions();
      cancelSpeech();
    };
  }, []);

  const uiLocaleRef = useRef(uiLocale);
  uiLocaleRef.current = uiLocale;

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "guest") return;

    let cancelled = false;
    (async () => {
      try {
        const res = await startLiveChatSession(uiLocaleRef.current);
        if (cancelled) return;
        setSessionId(res.session.id);
        setMessages(res.messages);
        setStaffTyping(res.session.staffTyping);
        seenIdsRef.current = new Set(res.messages.map((m) => m.id));
        const maxId = res.messages.reduce((max, m) => Math.max(max, m.id), 0);
        lastSpokenIdRef.current = maxId;
      } catch {
        toast.error(t.liveChatStartError);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.role, t.liveChatStartError]);

  useEffect(() => {
    if (!sessionId || showIntro) return;
    syncPollRef.current?.kick();
  }, [uiLocale, sessionId, showIntro]);

  const applySyncMessages = useCallback(
    (res: { staffTyping: boolean; messages: LiveChatMessage[] }) => {
      setStaffTyping(res.staffTyping);

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

      for (const m of merged) {
        if (
          newIds.has(m.id) &&
          (m.senderRole === "staff" || m.senderRole === "system")
        ) {
          speakMessage(m.content, m.id);
        }
      }
    },
    [speakMessage],
  );

  useEffect(() => {
    if (!sessionId || showIntro) return;

    syncPollRef.current = createLiveChatPoll(
      async (signal) => {
        const res = await syncLiveChatSession(sessionId, uiLocale, signal);
        applySyncMessages(res);
      },
    );

    return () => {
      syncPollRef.current?.stop();
      syncPollRef.current = null;
    };
  }, [sessionId, showIntro, uiLocale, applySyncMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, staffTyping, pendingMessage, scrollToBottom]);

  const handleStart = () => {
    try {
      sessionStorage.setItem(INTRO_KEY, "1");
    } catch {
      /* ignore */
    }
    primeTts();
    preloadPremiumTts();
    ttsPrimedRef.current = true;
    setShowIntro(false);

    const welcome = messages.find((m) => m.senderRole === "system");
    if (welcome) {
      speakMessage(welcome.content, welcome.id);
    }
  };

  const handleEmergency = useCallback(
    async (options?: { skipCooldown?: boolean }) => {
      if (emergencySending) return false;
      if (!options?.skipCooldown && isEmergencyOnCooldown) return false;

      if (!emergencyClientIdRef.current) {
        emergencyClientIdRef.current =
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `em-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      }
      const clientEventId = emergencyClientIdRef.current;
      setEmergencySending(true);

      let activeSessionId = sessionId;
      try {
        if (!activeSessionId) {
          const res = await startLiveChatSession(uiLocale);
          activeSessionId = res.session.id;
          setSessionId(res.session.id);
          setMessages(res.messages);
          for (const m of res.messages) seenIdsRef.current.add(m.id);
        }

        const { eventId } = await triggerLiveChatEmergency(activeSessionId, clientEventId);
        if (eventId <= 0) throw new Error("Invalid emergency event");
        emergencyClientIdRef.current = null;
        setEmergencyCooldownUntil(Date.now() + EMERGENCY_COOLDOWN_MS);
        toast.success(t.liveChatEmergencySent);
        if (showIntro) handleStart();
        return true;
      } catch {
        toast.error(t.liveChatEmergencyError);
        return false;
      } finally {
        setEmergencySending(false);
      }
    },
    [
      emergencySending,
      isEmergencyOnCooldown,
      sessionId,
      uiLocale,
      t.liveChatEmergencySent,
      t.liveChatEmergencyError,
      showIntro,
    ],
  );

  const sendUrgentAutoMessage = useCallback(
    async (activeSessionId: number) => {
      const text = t.liveChatUrgentAutoMessage;
      let alreadySent = false;
      setMessages((prev) => {
        alreadySent = prev.some(
          (m) => m.senderRole === "guest" && m.content.trim() === text.trim(),
        );
        return prev;
      });
      if (alreadySent) return;

      const msg = await sendLiveChatGuestMessage(activeSessionId, text, uiLocale);
      seenIdsRef.current.add(msg.id);
      setAnimatingIds(new Set([msg.id]));
      setSendAnimatingIds(new Set([msg.id]));
      setTimeout(() => {
        setAnimatingIds(new Set());
        setSendAnimatingIds(new Set());
      }, 1200);
      setMessages((prev) => appendLiveChatMessage(prev, msg));
      syncPollRef.current?.kick();
    },
    [t.liveChatUrgentAutoMessage, uiLocale],
  );

  useEffect(() => {
    if (!sessionId || !isUrgentMode || urgentTriggeredRef.current || showIntro || loading) return;
    urgentTriggeredRef.current = true;

    void (async () => {
      let emergencyOk = false;
      try {
        const preSent =
          typeof sessionStorage !== "undefined" &&
          sessionStorage.getItem(URGENT_EMERGENCY_SENT_KEY) === String(sessionId);
        if (preSent) {
          sessionStorage.removeItem(URGENT_EMERGENCY_SENT_KEY);
          emergencyOk = true;
        } else {
          emergencyOk = await handleEmergency({ skipCooldown: true });
        }
        if (emergencyOk) {
          await sendUrgentAutoMessage(sessionId);
        }
      } catch {
        toast.error(t.liveChatSendError);
      }
    })();
  }, [
    sessionId,
    isUrgentMode,
    showIntro,
    loading,
    handleEmergency,
    sendUrgentAutoMessage,
    t.liveChatSendError,
  ]);

  const handleSendLocation = async () => {
    if (!sessionId || locationSending) return;
    setLocationSending(true);
    try {
      const outcome = await readPositionOnce();
      if (!outcome.ok) {
        if (outcome.reason === "denied" || outcome.reason === "unsupported") {
          toast.error(t.liveChatLocationError);
        } else {
          toast.info(t.liveChatLocationUnavailable);
        }
        return;
      }
      const msg = await sendLiveChatGuestLocation(sessionId, outcome.position, uiLocale);
      seenIdsRef.current.add(msg.id);
      setMessages((prev) => appendLiveChatMessage(prev, msg));
      syncPollRef.current?.kick();
      toast.success(t.liveChatLocationSent);
    } catch {
      toast.error(t.liveChatLocationError);
    } finally {
      setLocationSending(false);
    }
  };

  const handleClearAll = async () => {
    if (!sessionId) return;
    setIsClearing(true);
    dictation.stop();
    abortAllSpeechSessions();
    cancelSpeech();
    try {
      const res = await clearLiveChatSession(sessionId, uiLocale);
      seenIdsRef.current = new Set(res.messages.map((m) => m.id));
      setAnimatingIds(new Set());
      setSendAnimatingIds(new Set());
      setMessages(res.messages);
      const maxId = res.messages.reduce((max, m) => Math.max(max, m.id), 0);
      lastSpokenIdRef.current = maxId;
      toast.success(t.clearedMessage);
    } catch {
      toast.error(t.liveChatClearError);
    } finally {
      setIsClearing(false);
      setShowClearConfirm(false);
    }
  };

  if (!isAuthenticated || user?.role !== "guest") return null;

  const hasMessages = messages.length > 0 || !!pendingMessage;
  const voiceActive = dictation.active;

  return (
    <div className="flex h-[100dvh] flex-col bg-[#F4F4F5]">
      <header className="sticky top-0 z-20 shrink-0 border-b border-zinc-200/80 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-2.5 px-3 sm:h-[60px] sm:gap-3 sm:px-4">
          <button
            type="button"
            onClick={() => {
              dictation.stop();
              abortAllSpeechSessions();
              cancelSpeech();
              setLocation(ROUTES.guest);
            }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-zinc-500 transition-colors active:bg-zinc-100"
            aria-label={t.liveChatBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <HotelBrandMark variant="header" framed className="hidden shrink-0 sm:block" />

          <div className="min-w-0 flex-1">
            <p className="truncate text-[16px] font-semibold tracking-tight text-zinc-900">
              {t.liveChatTitle}
            </p>
            <p className="truncate text-[12px] text-zinc-500">
              {tFmt(t.headerRoom, {
                name: user.firstName ?? "",
                room: user.roomNumber ?? "",
              })}
            </p>
          </div>

          {hasMessages && !voiceActive && (
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-zinc-400 transition-colors active:bg-zinc-100"
              aria-label={t.clearChatLabel}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}

          <button
            type="button"
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors",
              speaking ? "bg-rose-50 text-rose-600" : "bg-zinc-100 text-zinc-500",
            )}
            aria-label={speaking ? t.liveChatVoiceSpeaking : t.liveChatVoiceChat}
            title={speaking ? t.liveChatVoiceSpeaking : t.liveChatVoiceChat}
          >
            {speaking ? (
              <Volume2 className="h-4 w-4 animate-pulse" />
            ) : (
              <MessageSquare className="h-4 w-4" />
            )}
          </button>
        </div>
      </header>

      <main className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col">
        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-3 py-4 sm:px-4 md:px-8">
              {messages.map((msg) => (
                <LiveChatMessageBubble
                  key={msg.id}
                  message={msg}
                  isGuest
                  sentLabel={t.liveChatStatusSent}
                  readLabel={t.liveChatStatusRead}
                  locationLabel={t.liveChatLocationShared}
                  openMapLabel={t.liveChatOpenMap}
                  animate={
                    animatingIds.has(msg.id) &&
                    (msg.senderRole === "staff" || msg.senderRole === "system")
                  }
                  animateSend={sendAnimatingIds.has(msg.id)}
                />
              ))}
              {pendingMessage && sending && <OptimisticUserBubble content={pendingMessage} />}
              {staffTyping && <LiveChatTypingBubble label={t.liveChatStaffTyping} />}
              <div ref={bottomRef} className="h-2" />
            </div>

            <div className="sticky bottom-0 z-20 shrink-0 border-t border-zinc-200/60 bg-white/95 backdrop-blur-md">
              <div className="px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2.5 sm:px-4 md:px-8">
                {isUrgentMode && (
                  <div className="mb-2.5 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => void handleEmergency()}
                      disabled={emergencySending || isEmergencyOnCooldown || !sessionId}
                      className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-[13px] font-semibold text-rose-600 shadow-sm transition-all active:scale-[0.98] disabled:opacity-60"
                      aria-label={t.liveChatEmergencyBtn}
                    >
                      {emergencySending ? (
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                      ) : (
                        <Siren className="h-4 w-4 shrink-0" strokeWidth={2.25} />
                      )}
                      <span className="truncate">{t.liveChatEmergencyBtn}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleSendLocation()}
                      disabled={locationSending || !sessionId}
                      className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-3 py-2.5 text-[13px] font-semibold text-zinc-700 shadow-sm transition-all active:scale-[0.98] disabled:opacity-60"
                      aria-label={t.liveChatSendLocation}
                    >
                      {locationSending ? (
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                      ) : (
                        <MapPin className="h-4 w-4 shrink-0" strokeWidth={2.25} />
                      )}
                      <span className="truncate">{t.liveChatSendLocation}</span>
                    </button>
                  </div>
                )}

                <div
                  className={cn(
                    "flex items-end gap-2 rounded-[22px] border bg-zinc-50 px-3 py-2 shadow-sm transition-all duration-200 sm:px-4 sm:py-2.5",
                    voiceActive
                      ? "border-zinc-300 bg-white shadow-md"
                      : "border-zinc-200 focus-within:border-zinc-300 focus-within:bg-white focus-within:shadow-md",
                  )}
                >
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void handleSend();
                      }
                    }}
                    rows={1}
                    placeholder={
                      dictation.listening
                        ? t.listeningState
                        : t.liveChatInputPlaceholder
                    }
                    disabled={sending || dictation.listening}
                    className="max-h-[120px] flex-1 resize-none border-0 bg-transparent py-2 text-[15px] leading-relaxed text-zinc-900 outline-none focus:ring-0 disabled:opacity-60"
                  />

                  {dictation.isSupported && (
                    <div className="mb-0.5 shrink-0 self-end">
                      <MicrophoneButton
                        isConversationActive={voiceActive}
                        isListening={dictation.listening}
                        amplitude={dictation.amplitude}
                        isSupported={dictation.isSupported}
                        onToggle={toggleVoiceInput}
                        size="sm"
                        variant="inline"
                      />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => void handleSend()}
                    disabled={!input.trim() || sending || dictation.listening}
                    className={cn(
                      "mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-all duration-200 active:scale-[0.94]",
                      input.trim() && !sending && !dictation.listening
                        ? "bg-black text-white shadow-[0_4px_16px_-4px_rgba(0,0,0,0.5)] hover:bg-zinc-900"
                        : "bg-zinc-200/80 text-zinc-400",
                    )}
                    aria-label={t.liveChatSend}
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-[18px] w-[18px]" strokeWidth={2.25} />
                    )}
                  </button>
                </div>

                {voiceActive && dictation.transcript && (
                  <p className="mt-2 px-1 text-center text-[12px] text-zinc-400">
                    {dictation.transcript}
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        {showIntro && (
          <div className="absolute inset-0 z-30 flex items-end justify-center bg-black/30 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 text-white">
                  <MessageSquare className="h-7 w-7" />
                </div>
                <h1 className="font-serif text-[17px] font-medium text-zinc-900">
                  {t.liveChatIntroTitle}
                </h1>
                <p className="mt-2 text-[14px] leading-relaxed text-zinc-500">
                  {t.liveChatIntroBody}
                </p>
              </div>
              <button
                type="button"
                onClick={handleStart}
                className="w-full rounded-2xl bg-zinc-900 py-3.5 text-[15px] font-medium text-white transition-all active:scale-[0.99]"
              >
                {t.liveChatIntroStart}
              </button>
            </div>
          </div>
        )}

        {showClearConfirm && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
              <div className="mb-6 space-y-2 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-50">
                  <Trash2 className="h-5 w-5 text-zinc-400" />
                </div>
                <h3 className="font-serif text-[17px] font-medium text-zinc-900">{t.clearTitle}</h3>
                <p className="text-[14px] leading-relaxed text-zinc-500">{t.clearMessage}</p>
              </div>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => void handleClearAll()}
                  disabled={isClearing}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-900 py-3.5 text-[15px] font-medium text-white transition-all active:scale-[0.99] disabled:opacity-50"
                >
                  {isClearing ? <Loader2 className="h-4 w-4 animate-spin" /> : t.clearConfirm}
                </button>
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  disabled={isClearing}
                  className="w-full rounded-2xl py-3 text-[15px] font-medium text-zinc-500 transition-colors hover:text-zinc-700"
                >
                  {t.cancel}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
