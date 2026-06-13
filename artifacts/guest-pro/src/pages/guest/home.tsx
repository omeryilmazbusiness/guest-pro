import { useEffect, useCallback, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocale } from "@/hooks/use-locale";
import {
  useGetHotelBranding,
  useListQuickActions,
} from "@workspace/api-client-react";
import { ROUTES } from "@/lib/app-routes";
import { useOptionalHotelTenant } from "@/hooks/use-hotel-tenant";
import { useTenantNav } from "@/hooks/use-tenant-nav";
import { useHotelDisplay } from "@/hooks/use-hotel-display";
import { Keyboard } from "lucide-react";
import { GuestDashboardHeader } from "@/components/guest/GuestDashboardHeader";
import { GuestVoiceTalkCard } from "@/components/guest/GuestVoiceTalkCard";
import { GuestChatEntryTiles } from "@/components/guest/GuestChatEntryTiles";
import { GuestRememberMeModal } from "@/components/guest/GuestRememberMeModal";
import { useGuestLiveChatUnreadContext } from "@/contexts/guest-live-chat-unread-context";
import {
  startLiveChatSession,
  triggerLiveChatEmergency,
} from "@/lib/live-chat-api";
import { GUEST_SECTION_IDS } from "@/lib/guest-dashboard-nav";
import { getWelcomingStrings } from "@/lib/welcoming/hotel-content";
import { getWelcomingLanguage } from "@/lib/welcoming/languages";
import { toast } from "sonner";
import { useVoice } from "@/hooks/use-voice";
import { tFmt } from "@/lib/i18n";
import { GuestVoiceListeningOverlay } from "@/components/guest/GuestVoiceListeningOverlay";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { InstallSheet } from "@/components/InstallSheet";
import { useTrackingHeartbeat } from "@/hooks/use-tracking-heartbeat";
import { StayKeyCard } from "@/components/guest/StayKeyCard";
import { GuestNearbySection } from "@/components/guest/GuestNearbySection";
import { DailyBillCard } from "@/components/guest/DailyBillCard";
import { ServiceQuickActions, type QuickActionMode } from "@/components/guest/ServiceQuickActions";
import { GuestMyRequestsPanel } from "@/components/guest/GuestMyRequestsPanel";
import { GuestHotelQuickLinks } from "@/components/guest/GuestHotelQuickLinks";
import { GuestAtYourServicePanel } from "@/components/guest/GuestAtYourServicePanel";
import { listMyRequests, type ServiceRequest } from "@/lib/service-requests";
import { MY_REQUESTS_QUERY_KEY } from "@/lib/guest-my-requests-cache";
import {
  consumeGuestDashboardScrollRestore,
  markGuestDashboardScrollRestore,
} from "@/lib/guest-dashboard-scroll";
import { useGuestHomeReady } from "@/hooks/use-guest-home-ready";
import { GuestHomeSkeleton } from "@/components/guest/GuestHomeSkeleton";
import { GUEST_CONTENT_ENTER, GUEST_PAGE_FADE } from "@/lib/guest-motion";

export default function GuestHome() {
  const { user, isAuthenticated } = useAuth();
  const goTo = useTenantNav();
  const queryClient = useQueryClient();
  const install = useInstallPrompt();
  const { t, voiceLocale, uiLocale } = useLocale();
  const tenant = useOptionalHotelTenant();
  const { appName: displayAppName } = useHotelDisplay();
  const { isBootstrapping } = useGuestHomeReady();
  const reduceMotion = useReducedMotion();

  // Start presence heartbeat — sends location + backend IP for tracking.
  useTrackingHeartbeat();

  const { data: branding } = useGetHotelBranding();
  const { data: quickActions } = useListQuickActions();
  const appName = displayAppName || branding?.appName || "Guest Pro";
  const { data: myRequests } = useQuery({
    queryKey: MY_REQUESTS_QUERY_KEY,
    queryFn: listMyRequests,
    staleTime: 15_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
    enabled: isAuthenticated && user?.role === "guest",
  });

  useEffect(() => {
    const y = consumeGuestDashboardScrollRestore();
    if (y == null) return;
    requestAnimationFrame(() => {
      window.scrollTo({ top: y, behavior: "auto" });
    });
  }, []);

  // Auth redirect guard — /welcoming is a public kiosk and must NEVER
  // be part of the authenticated guest flow.
  useEffect(() => {
    if (!isAuthenticated) {
      goTo(ROUTES.guestLogin);
      return;
    }
    if (user?.role !== "guest") {
      goTo(ROUTES.manager);
    }
  }, [isAuthenticated, user, goTo]);

  const handleDeleteRequest = useCallback(
    (id: number) => {
      queryClient.setQueryData<ServiceRequest[]>(MY_REQUESTS_QUERY_KEY, (prev) =>
        prev?.filter((r) => r.id !== id)
      );
    },
    [queryClient]
  );

  const goToChat = (q?: string) => {
    goTo(q ? `${ROUTES.guestChat}?q=${encodeURIComponent(q)}` : ROUTES.guestChat);
  };

  const goToVoice = () => goTo(`${ROUTES.guestChat}?voice=1`);

  const handleQuickAction = (mode: QuickActionMode) => {
    markGuestDashboardScrollRestore();
    goTo(`${ROUTES.guestFlow}?mode=${mode}`);
  };

  const voiceStopRef = useRef<(() => void) | null>(null);
  const [voiceOverlayOpen, setVoiceOverlayOpen] = useState(false);
  const [rememberMeOpen, setRememberMeOpen] = useState(false);
  const liveChatUnread = useGuestLiveChatUnreadContext();

  const closeVoiceOverlay = useCallback(() => {
    voiceStopRef.current?.();
    setVoiceOverlayOpen(false);
  }, []);

  const sendVoiceToChat = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setVoiceOverlayOpen(false);
      goTo(`${ROUTES.guestChat}?q=${encodeURIComponent(trimmed)}&voice=1`);
    },
    [goTo],
  );

  const voice = useVoice({
    onResult: (transcript) => {
      const trimmed = transcript.trim();
      if (!trimmed) {
        closeVoiceOverlay();
        return;
      }
      sendVoiceToChat(trimmed);
    },
    onError: (msg) => {
      toast.error(msg);
      closeVoiceOverlay();
    },
    defaultLang: voiceLocale,
    messages: {
      notSupported: t.voiceNotSupported,
      micDenied: t.micDenied,
      noSpeech: t.noSpeech,
      genericError: (code) => t.voiceErrorGeneric.replace("{code}", code),
      micNotAvailable: t.micDenied,
    },
  });
  voiceStopRef.current = voice.stopListening;

  const handleMicTap = () => {
    if (voice.isListening || voiceOverlayOpen) {
      closeVoiceOverlay();
    } else {
      setVoiceOverlayOpen(true);
      void voice.startListening();
    }
  };

  if (!isBootstrapping && (!isAuthenticated || user?.role !== "guest")) return null;

  const guest = user!;
  const guestUser = guest as typeof guest & { guestKeyDisplay?: string | null };
  const welcomingLocale = getWelcomingLanguage(uiLocale).uiLocale;
  const welcomingStrings = getWelcomingStrings(welcomingLocale);

  const openReceptionChat = () => {
    void liveChatUnread.acknowledgeSeen();
    goTo(ROUTES.guestLiveChat);
  };

  const openReceptionUrgent = async () => {
    markGuestDashboardScrollRestore();
    try {
      const clientEventId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `em-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const { session } = await startLiveChatSession(uiLocale);
      await triggerLiveChatEmergency(session.id, clientEventId);
      try {
        sessionStorage.setItem("live_chat_urgent_emergency_sent", String(session.id));
      } catch {
        /* ignore */
      }
    } catch {
      toast.error(t.liveChatEmergencyError);
    }
    goTo(`${ROUTES.guestLiveChat}?urgent=1`);
  };

  return (
    <>
    <AnimatePresence mode="wait">
      {isBootstrapping ? (
        <motion.div
          key="guest-home-skeleton"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.992, filter: reduceMotion ? "none" : "blur(2px)" }}
          transition={reduceMotion ? { duration: 0.15 } : { ...GUEST_PAGE_FADE, duration: 0.48 }}
        >
          <GuestHomeSkeleton />
        </motion.div>
      ) : (
    <motion.div
      key="guest-home-content"
      className="min-h-[100dvh] bg-[#F8F8F8]"
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.992 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={reduceMotion ? { duration: 0.2 } : GUEST_CONTENT_ENTER}
    >
      <GuestDashboardHeader
        appName={appName}
        nearbyLabel={t.nearbySection}
        showRequestsSection={myRequests !== undefined}
      />

      <main className="max-w-2xl mx-auto px-3.5 pb-14">
        {/* Welcome line */}
        <div className="pt-5 pb-1 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
            {tFmt(t.welcome, { name: guest.firstName ?? "" })}
          </p>
        </div>

        {/* ── Voice Hero — PRIMARY CTA ── */}
        <section id={GUEST_SECTION_IDS.voice} className="mb-4 scroll-mt-[72px]">
          <GuestVoiceTalkCard
            variant="liquid"
            voiceLabel={t.voiceLabel}
            title={t.voiceTitle}
            subtitle={t.voiceSubtitle}
            statusText={
              voice.isListening
                ? voice.transcript
                  ? `"${voice.transcript}"`
                  : t.listeningState
                : t.voiceHint
            }
            isListening={voice.isListening}
            amplitude={voice.amplitude}
            onMicClick={handleMicTap}
            micAriaLabel={voice.isListening ? t.cancel : t.voiceLabel}
            footer={
              !voice.isListening ? (
                <button
                  type="button"
                  onClick={goToVoice}
                  className="inline-flex items-center gap-1.5 text-[12px] text-zinc-500 transition-colors hover:text-zinc-700"
                >
                  <Keyboard className="h-3.5 w-3.5" />
                  {t.goToVoiceChat}
                </button>
              ) : undefined
            }
          />
        </section>

        {/* ── Chat entry tiles ── */}
        <div id={GUEST_SECTION_IDS.ask} className="mb-4 scroll-mt-[72px]">
          <GuestChatEntryTiles
            onStartConversation={() => goToChat()}
            onReceptionChat={openReceptionChat}
            onReceptionUrgent={openReceptionUrgent}
            onRememberMe={() => setRememberMeOpen(true)}
            receptionUnreadCount={liveChatUnread.unreadCount}
          />
        </div>

        {/* ── Konaklamanız hakkında — Stay Key Card ── */}
        <section
          id={GUEST_SECTION_IDS.stay}
          className="mb-4 mt-1 scroll-mt-[72px]"
          aria-label={t.stayAboutTitle}
        >
          <StayKeyCard
            guestKeyDisplay={guestUser.guestKeyDisplay}
            roomNumber={guest.roomNumber ?? undefined}
            firstName={guest.firstName ?? undefined}
            lastName={guest.lastName ?? undefined}
          />
        </section>

        {/* ── Hızlı Hizmetler — Service Quick Actions ── */}
        <section id={GUEST_SECTION_IDS.quickActions} className="mb-1 scroll-mt-[72px]">
          <ServiceQuickActions onAction={handleQuickAction} t={t} />
          <div id={GUEST_SECTION_IDS.requests}>
            <GuestMyRequestsPanel
              requests={myRequests}
              t={t}
              onDelete={handleDeleteRequest}
            />
          </div>
        </section>

        {/* ── Yakın Çevre ── */}
        <section id={GUEST_SECTION_IDS.nearby} className="mb-4 scroll-mt-[72px]">
          <GuestNearbySection />
        </section>

        {/* ── Daily bill (folio) ── */}
        <section id={GUEST_SECTION_IDS.bill} className="mb-4 scroll-mt-[72px]">
          <DailyBillCard />
        </section>

        <section id={GUEST_SECTION_IDS.hotel} className="scroll-mt-[72px]">
          <GuestHotelQuickLinks quickActions={quickActions} />
        </section>

        <section id={GUEST_SECTION_IDS.atYourService} className="scroll-mt-[72px]">
          <GuestAtYourServicePanel appName={appName} />
        </section>

        <p className="text-center text-[12px] text-zinc-300 px-4 pb-2">
          {appName} · {t.footerText}
        </p>
      </main>

      {/* Install bottom sheet */}
      {!install.isAlreadyInstalled && <InstallSheet install={install} />}
    </motion.div>
      )}
    </AnimatePresence>

      {!isBootstrapping && (
        <GuestVoiceListeningOverlay
          open={voiceOverlayOpen}
          listening={voice.isListening}
          amplitude={voice.amplitude}
          transcript={voice.transcript}
          listeningLabel={t.listeningState}
          subtitle={t.voiceSubtitle}
          cancelLabel={t.cancel}
          onCancel={closeVoiceOverlay}
        />
      )}

      <GuestRememberMeModal open={rememberMeOpen} onClose={() => setRememberMeOpen(false)} />
    </>
  );
}
