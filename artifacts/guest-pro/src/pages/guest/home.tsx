import { useEffect, useCallback, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocale } from "@/hooks/use-locale";
import {
  useGetHotelBranding,
  useListQuickActions,
  useLogout,
} from "@workspace/api-client-react";
import { ROUTES } from "@/lib/app-routes";
import { useOptionalHotelTenant } from "@/hooks/use-hotel-tenant";
import { useTenantNav } from "@/hooks/use-tenant-nav";
import { useHotelDisplay } from "@/hooks/use-hotel-display";
import { Bot, ArrowRight, MessageSquare } from "lucide-react";
import { GuestDashboardHeader } from "@/components/guest/GuestDashboardHeader";
import { GuestVoiceMicHero } from "@/components/guest/GuestVoiceMicHero";
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
  const { user, isAuthenticated, logoutAuth } = useAuth();
  const goTo = useTenantNav();
  const logoutMutation = useLogout();
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

  const handleLogout = () => {
    logoutAuth();
    logoutMutation.mutate(undefined);
    toast.success(t.logoutSuccess);
  };

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
    goToChat(t.receptionChatPrompt);
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
        onLogout={handleLogout}
      />

      <main className="max-w-2xl mx-auto px-3.5 pb-14">
        {/* Welcome line */}
        <div className="pt-5 pb-1 text-center">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest">
            {tFmt(t.welcome, { name: guest.firstName ?? "" })}
          </p>
        </div>

        {/* ── Voice Hero — PRIMARY CTA — UNCHANGED ── */}
        <section id={GUEST_SECTION_IDS.voice} className="mb-4 scroll-mt-[72px]">
          <div className="bg-zinc-900 rounded-2xl px-4 py-5 flex flex-col items-center text-center shadow-xl shadow-zinc-900/20">
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mb-2.5">
              {t.voiceLabel}
            </p>
            <h1 className="text-[28px] font-serif text-white tracking-tight leading-tight mb-2">
              {t.voiceTitle}
            </h1>
            <p className="text-zinc-400 text-[12px] leading-snug mb-5 max-w-xs">
              {t.voiceSubtitle}
            </p>

            {/* Large mic button */}
            <GuestVoiceMicHero
              isListening={voice.isListening}
              amplitude={voice.amplitude}
              onClick={handleMicTap}
              ariaLabel={voice.isListening ? t.cancel : t.voiceLabel}
            />

            {/* State label */}
            <p className="text-[12px] text-zinc-400 min-h-[18px]">
              {voice.isListening
                ? voice.transcript
                  ? `"${voice.transcript}"`
                  : t.listeningState
                : t.voiceHint}
            </p>

            {!voice.isListening && (
              <button
                onClick={goToVoice}
                className="mt-3 text-[12px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1.5 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                {t.goToVoiceChat}
              </button>
            )}
          </div>
        </section>

        {/* ── Ask Something — SECONDARY CTA ── */}
        <section id={GUEST_SECTION_IDS.ask} className="mb-4 scroll-mt-[72px]">
          <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide mb-2 px-0.5">
            {t.askSomethingLabel}
          </h3>
          <button
            type="button"
            onClick={() => goToChat()}
            className="w-full relative overflow-hidden rounded-2xl bg-zinc-950 border border-zinc-800 py-3 px-3.5 flex items-center gap-3 shadow-xl shadow-zinc-950/20 hover:bg-zinc-900 active:scale-[0.99] transition-all duration-200 group"
          >
            <span
              className="absolute inset-0 pointer-events-none opacity-[0.07] bg-[radial-gradient(ellipse_80%_60%_at_0%_0%,white,transparent)]"
              aria-hidden
            />
            <span className="relative w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
              <Bot className="w-5 h-5 text-zinc-950" strokeWidth={1.5} />
            </span>
            <span className="relative flex-1 text-start min-w-0">
              <p className="font-serif text-[15px] font-medium text-white tracking-tight leading-snug">
                {t.askSomethingTitle}
              </p>
              <p className="text-[12px] text-zinc-400 mt-0.5 leading-snug">
                {t.askSomethingSubtitle}
              </p>
            </span>
            <ArrowRight className="relative w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>
        </section>

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
          <GuestHotelQuickLinks
            quickActions={quickActions}
            onReceptionChat={openReceptionChat}
          />
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
    </>
  );
}
