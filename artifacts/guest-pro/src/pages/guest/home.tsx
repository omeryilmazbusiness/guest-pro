import { useEffect, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocale } from "@/hooks/use-locale";
import {
  useGetHotelBranding,
  useListQuickActions,
  useLogout,
} from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Mic, Bot, ArrowRight, MessageSquare } from "lucide-react";
import { GuestDashboardHeader } from "@/components/guest/GuestDashboardHeader";
import { GUEST_SECTION_IDS } from "@/lib/guest-dashboard-nav";
import { getWelcomingStrings } from "@/lib/welcoming/hotel-content";
import { getWelcomingLanguage } from "@/lib/welcoming/languages";
import { toast } from "sonner";
import { useVoice } from "@/hooks/use-voice";
import { tFmt } from "@/lib/i18n";
import { MicrophoneButton } from "@/components/chat/MicrophoneButton";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { InstallSheet } from "@/components/InstallSheet";
import { useTrackingHeartbeat } from "@/hooks/use-tracking-heartbeat";
import { StayKeyCard } from "@/components/guest/StayKeyCard";
import { GuestNearbySection } from "@/components/guest/GuestNearbySection";
import { DailyBillCard } from "@/components/guest/DailyBillCard";
import { ServiceQuickActions, type QuickActionMode } from "@/components/guest/ServiceQuickActions";
import { GuestMyRequestsSection } from "@/components/guest/GuestMyRequestsSection";
import { GuestHotelQuickLinks } from "@/components/guest/GuestHotelQuickLinks";
import { GuestAtYourServicePanel } from "@/components/guest/GuestAtYourServicePanel";
import { listMyRequests, type ServiceRequest } from "@/lib/service-requests";

export default function GuestHome() {
  const { user, isAuthenticated, logoutAuth } = useAuth();
  const [, setLocation] = useLocation();
  const logoutMutation = useLogout();
  const queryClient = useQueryClient();
  const install = useInstallPrompt();
  const { t, voiceLocale, uiLocale } = useLocale();

  // Start presence heartbeat — sends location + backend IP for tracking.
  useTrackingHeartbeat();

  const { data: branding } = useGetHotelBranding();
  const { data: quickActions } = useListQuickActions();
  const { data: myRequests } = useQuery({
    queryKey: ["my-requests"],
    queryFn: listMyRequests,
    staleTime: 30_000,
    enabled: isAuthenticated && user?.role === "guest",
  });

  // Auth redirect guard — /welcoming is a public kiosk and must NEVER
  // be part of the authenticated guest flow.
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/");
      return;
    }
    if (user?.role !== "guest") {
      setLocation("/manager");
    }
  }, [isAuthenticated, user, setLocation]);

  const handleDeleteRequest = useCallback(
    (id: number) => {
      queryClient.setQueryData<ServiceRequest[]>(["my-requests"], (prev) =>
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
    const url = q ? `/guest/chat?q=${encodeURIComponent(q)}` : "/guest/chat";
    setLocation(url);
  };

  const goToVoice = () => setLocation("/guest/chat?voice=1");

  const handleQuickAction = (mode: QuickActionMode) => {
    setLocation(`/guest/flow?mode=${mode}`);
  };

  const voiceStopRef = useRef<(() => void) | null>(null);

  const voice = useVoice({
    onResult: (transcript, _lang) => {
      voiceStopRef.current?.();
      if (transcript.trim()) {
        setLocation(`/guest/chat?q=${encodeURIComponent(transcript)}&voice=1`);
      }
    },
    onError: (msg) => toast.error(msg),
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
    if (voice.isListening) {
      voice.stopListening();
    } else {
      voice.startListening();
    }
  };

  if (!isAuthenticated || user?.role !== "guest") return null;

  const guestUser = user as typeof user & { guestKeyDisplay?: string | null };
  const welcomingLocale = getWelcomingLanguage(uiLocale).uiLocale;
  const welcomingStrings = getWelcomingStrings(welcomingLocale);

  const openReceptionChat = () => {
    goToChat(t.receptionChatPrompt);
  };

  return (
    <div className="min-h-[100dvh] bg-[#F8F8F8]">
      <GuestDashboardHeader
        appName={branding?.appName || "Guest Pro"}
        t={t}
        nearbyLabel={t.nearbySection}
        showRequestsSection={myRequests !== undefined}
        onLogout={handleLogout}
      />

      <main className="max-w-2xl mx-auto px-3.5 pb-14">
        {/* Welcome line */}
        <div className="pt-5 pb-1 text-center">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest">
            {tFmt(t.welcome, { name: user.firstName ?? "" })}
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
            <div className="relative flex items-center justify-center mb-4">
              {voice.isListening && (
                <>
                  <div
                    className="absolute rounded-full bg-white/8 transition-transform duration-100"
                    style={{
                      width: 100,
                      height: 100,
                      transform: `scale(${1 + Math.min(voice.amplitude * 0.5, 0.5)})`,
                    }}
                  />
                  <div
                    className="absolute rounded-full bg-white/12 transition-transform duration-150"
                    style={{
                      width: 80,
                      height: 80,
                      transform: `scale(${1 + Math.min(voice.amplitude * 0.35, 0.35)})`,
                    }}
                  />
                </>
              )}
              <button
                onClick={handleMicTap}
                className={`relative z-10 w-[4.25rem] h-[4.25rem] rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 shadow-lg ${
                  voice.isListening
                    ? "bg-white text-zinc-900 shadow-white/25"
                    : "bg-white/10 text-white border border-white/20 hover:bg-white/20"
                }`}
                aria-label={voice.isListening ? t.cancel : t.voiceLabel}
              >
                <Mic className="w-7 h-7" />
              </button>
            </div>

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
            roomNumber={user.roomNumber ?? undefined}
            firstName={user.firstName ?? undefined}
            lastName={user.lastName ?? undefined}
          />
        </section>

        {/* ── Hızlı Hizmetler — Service Quick Actions ── */}
        <section id={GUEST_SECTION_IDS.quickActions} className="mb-1 scroll-mt-[72px]">
          <ServiceQuickActions onAction={handleQuickAction} t={t} />
        </section>

        <GuestMyRequestsSection
          requests={myRequests}
          t={t}
          onDelete={handleDeleteRequest}
        />

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
          <GuestAtYourServicePanel appName={branding?.appName ?? "Guest Pro"} />
        </section>

        <p className="text-center text-[12px] text-zinc-300 px-4 pb-2">
          {branding?.appName || "Guest Pro"} · {t.footerText}
        </p>
      </main>

      {/* Install bottom sheet */}
      {!install.isAlreadyInstalled && <InstallSheet install={install} />}

      {/* Floating mic overlay when listening from home */}
      {voice.isListening && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-6 animate-in fade-in duration-200">
          <div className="bg-zinc-900 rounded-3xl px-8 py-10 flex flex-col items-center gap-5 shadow-2xl mx-6 max-w-xs w-full border border-white/8">
            <MicrophoneButton
              isConversationActive={voice.isListening}
              isListening={voice.isListening}
              amplitude={voice.amplitude}
              isSupported={voice.isSupported}
              onToggle={handleMicTap}
              variant="hero"
              size="lg"
            />
            <div className="text-center">
              <p className="text-[15px] font-medium text-white">{t.listeningState}</p>
              <p className="text-[13px] text-zinc-400 mt-1">
                {voice.transcript || t.voiceSubtitle}
              </p>
            </div>
          </div>
          <button
            onClick={() => voice.stopListening()}
            className="text-white/50 text-[14px] hover:text-white/80 transition-colors"
          >
            {t.cancel}
          </button>
        </div>
      )}
    </div>
  );
}
