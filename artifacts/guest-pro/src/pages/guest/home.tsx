import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocale } from "@/hooks/use-locale";
import {
  useGetHotelBranding,
  useListQuickActions,
  useLogout,
} from "@workspace/api-client-react";
import { useLocation } from "wouter";
import {
  LogOut,
  Mic,
  Sparkles,
  Phone,
  Calendar,
  MapPin,
  Clock,
  BedDouble,
  ChevronRight,
  ArrowRight,
  MessageSquare,
} from "lucide-react";
import { GuestProLogo } from "@/components/GuestProLogo";
import { toast } from "sonner";
import { useVoice } from "@/hooks/use-voice";
import { tFmt } from "@/lib/i18n";
import { MicrophoneButton } from "@/components/chat/MicrophoneButton";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { InstallSheet } from "@/components/InstallSheet";

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  "map-pin": MapPin,
  calendar: Calendar,
  phone: Phone,
  activity: Calendar,
};

export default function GuestHome() {
  const { user, isAuthenticated, logoutAuth } = useAuth();
  const [, setLocation] = useLocation();
  const logoutMutation = useLogout();
  const install = useInstallPrompt();
  const { t, voiceLocale } = useLocale();

  const { data: branding } = useGetHotelBranding();
  const { data: quickActions } = useListQuickActions();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/");
    } else if (user?.role !== "guest") {
      setLocation("/manager");
    }
  }, [isAuthenticated, user, setLocation]);

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

  const voice = useVoice({
    onResult: (transcript, _lang) => {
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

  const handleMicTap = () => {
    if (voice.isListening) {
      voice.stopListening();
    } else {
      voice.startListening();
    }
  };

  if (!isAuthenticated || user?.role !== "guest") return null;

  const INFO_ITEMS = [
    { icon: Phone, title: t.receptionTitle, desc: t.receptionDesc },
    { icon: BedDouble, title: t.roomServiceTitle, desc: t.roomServiceDesc },
    { icon: Clock, title: t.checkoutTitle, desc: t.checkoutDesc },
  ];

  return (
    <div className="min-h-[100dvh] bg-[#F8F8F8]">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-zinc-100/80 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-5 h-[64px] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <GuestProLogo variant="header" />
            <span className="font-serif text-[17px] font-medium text-zinc-900 tracking-tight">
              {branding?.appName || "Guest Pro"}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="text-zinc-400 hover:text-zinc-700 transition-colors p-2 -mr-2"
            aria-label={t.logout}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pb-20">
        {/* Welcome line */}
        <div className="pt-8 pb-2 text-center">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest">
            {tFmt(t.welcome, { name: user.firstName ?? "" })}
          </p>
        </div>

        {/* ── Voice Hero — PRIMARY CTA ── */}
        <section className="mb-6">
          <div className="bg-zinc-900 rounded-3xl px-6 py-8 flex flex-col items-center text-center shadow-xl shadow-zinc-900/20">
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mb-4">
              {t.voiceLabel}
            </p>
            <h1 className="text-4xl font-serif text-white tracking-tight leading-tight mb-2">
              {t.voiceTitle}
            </h1>
            <p className="text-zinc-400 text-[14px] leading-relaxed mb-8 max-w-xs">
              {t.voiceSubtitle}
            </p>

            {/* Large mic button */}
            <div className="relative flex items-center justify-center mb-6">
              {/* Ambient rings */}
              {voice.isListening && (
                <>
                  <div
                    className="absolute rounded-full bg-white/8 transition-transform duration-100"
                    style={{
                      width: 120,
                      height: 120,
                      transform: `scale(${1 + Math.min(voice.amplitude * 0.5, 0.5)})`,
                    }}
                  />
                  <div
                    className="absolute rounded-full bg-white/12 transition-transform duration-150"
                    style={{
                      width: 96,
                      height: 96,
                      transform: `scale(${1 + Math.min(voice.amplitude * 0.35, 0.35)})`,
                    }}
                  />
                </>
              )}
              <button
                onClick={handleMicTap}
                className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 shadow-lg ${
                  voice.isListening
                    ? "bg-white text-zinc-900 shadow-white/25"
                    : "bg-white/10 text-white border border-white/20 hover:bg-white/20"
                }`}
                aria-label={voice.isListening ? t.cancel : t.voiceLabel}
              >
                <Mic className="w-8 h-8" />
              </button>
            </div>

            {/* State label */}
            <p className="text-[13px] text-zinc-400 min-h-[20px]">
              {voice.isListening
                ? voice.transcript
                  ? `"${voice.transcript}"`
                  : t.listeningState
                : t.voiceHint}
            </p>

            {/* Or go straight to voice chat page */}
            {!voice.isListening && (
              <button
                onClick={goToVoice}
                className="mt-5 text-[13px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1.5 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                {t.goToVoiceChat}
              </button>
            )}
          </div>
        </section>

        {/* ── Ask Something — SECONDARY CTA ── */}
        <section className="mb-7">
          <h3 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-3 px-1">
            {t.askSomethingLabel}
          </h3>
          <button
            onClick={() => goToChat()}
            className="w-full bg-white border border-zinc-200 rounded-2xl py-4 px-5 flex items-center gap-3 shadow-sm hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.99] transition-all duration-150 group"
          >
            <div className="w-9 h-9 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0 group-hover:bg-zinc-100 transition-colors">
              <Sparkles className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[15px] font-medium text-zinc-800">{t.askSomethingTitle}</p>
              <p className="text-[12px] text-zinc-400 mt-0.5">{t.askSomethingSubtitle}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-400 transition-colors" />
          </button>
        </section>

        {/* Your Stay card */}
        <section className="mb-7">
          <h3 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-3 px-1">
            {t.staySection}
          </h3>
          <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-zinc-400 font-medium uppercase tracking-wide mb-1.5">
                  {t.room}
                </p>
                <p className="text-3xl font-serif text-zinc-900 leading-none">
                  {user.roomNumber}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-zinc-400 font-medium uppercase tracking-wide mb-1.5">
                  {t.guest}
                </p>
                <p className="text-[15px] font-medium text-zinc-800">
                  {user.firstName} {user.lastName}
                </p>
              </div>
            </div>
            <div className="border-t border-zinc-50 px-6 py-3.5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-[13px] text-zinc-500">{t.stayActive}</span>
                <button
                  onClick={() => goToChat()}
                  className="ml-auto flex items-center gap-1 text-[13px] text-zinc-400 hover:text-zinc-700 transition-colors"
                >
                  {t.chatLink} <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        {quickActions && quickActions.length > 0 && (
          <section className="mb-7">
            <h3 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-3 px-1">
              {t.quickActionsSection}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map(
                (action: { id: number; icon?: string; label: string }) => {
                  const IconComponent = ICON_MAP[action.icon ?? ""] ?? MapPin;
                  return (
                    <button
                      key={action.id}
                      onClick={() => goToChat(action.label)}
                      className="bg-white rounded-2xl border border-zinc-100 shadow-sm px-5 py-5 text-left active:scale-[0.97] hover:border-zinc-200 transition-all duration-150 group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center mb-3.5 group-hover:bg-zinc-100 transition-colors">
                        <IconComponent className="w-4 h-4 text-zinc-400" />
                      </div>
                      <p className="text-[14px] font-medium text-zinc-800 leading-snug">
                        {action.label}
                      </p>
                      <p className="text-[12px] text-zinc-400 mt-1">{t.touchToAsk}</p>
                    </button>
                  );
                }
              )}
            </div>
          </section>
        )}

        {/* Info section */}
        <section className="mb-7">
          <h3 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-3 px-1">
            {t.infoSection}
          </h3>
          <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
            {INFO_ITEMS.map((item, i) => (
              <div
                key={i}
                className={`flex items-start gap-4 px-6 py-4 ${
                  i < INFO_ITEMS.length - 1 ? "border-b border-zinc-50" : ""
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-zinc-50 flex items-center justify-center shrink-0 mt-0.5">
                  <item.icon className="w-4 h-4 text-zinc-400" />
                </div>
                <div>
                  <p className="text-[14px] font-medium text-zinc-800">{item.title}</p>
                  <p className="text-[12px] text-zinc-500 mt-0.5 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <p className="text-center text-[12px] text-zinc-300 px-4">
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
              isListening={voice.isListening}
              isSupported={voice.isSupported}
              amplitude={voice.amplitude}
              transcript={voice.transcript}
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
