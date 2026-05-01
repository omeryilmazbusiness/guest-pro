import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  ArrowRight,
  MessageSquare,
  UtensilsCrossed,
  Bell,
  Heart,
  LayoutGrid,
  ChevronDown,
  Trash2,
  Loader2,
} from "lucide-react";
import { GuestProLogo } from "@/components/GuestProLogo";
import { toast } from "sonner";
import { useVoice } from "@/hooks/use-voice";
import { tFmt, type GuestTranslations } from "@/lib/i18n";
import { MicrophoneButton } from "@/components/chat/MicrophoneButton";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { InstallSheet } from "@/components/InstallSheet";
import { useTrackingHeartbeat } from "@/hooks/use-tracking-heartbeat";
import { StayKeyCard } from "@/components/guest/StayKeyCard";
import { ServiceQuickActions, type QuickActionMode } from "@/components/guest/ServiceQuickActions";
import { listMyRequests, deleteMyServiceRequest, type ServiceRequest } from "@/lib/service-requests";
import { buildDisplaySummary } from "@/lib/request-display";

// ─── Request history — grouped stacked-card system ────────────────────────────

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  return `${Math.max(1, mins)}m`;
}

interface RequestGroupConfig {
  requestType: string;
  label: (t: GuestTranslations) => string;
  icon: React.FC<{ className?: string }>;
  iconColor: string;
  iconBg: string;
  dotColor: string;
}

const REQUEST_GROUP_CONFIGS: RequestGroupConfig[] = [
  {
    requestType: "FOOD_ORDER",
    label: (t) => t.flowFoodLabel,
    icon: UtensilsCrossed,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-50",
    dotColor: "bg-amber-400",
  },
  {
    requestType: "SUPPORT_REQUEST",
    label: (t) => t.flowSupportLabel,
    icon: Bell,
    iconColor: "text-sky-600",
    iconBg: "bg-sky-50",
    dotColor: "bg-sky-400",
  },
  {
    requestType: "CARE_PROFILE_UPDATE",
    label: (t) => t.flowCareLabel,
    icon: Heart,
    iconColor: "text-rose-500",
    iconBg: "bg-rose-50",
    dotColor: "bg-rose-400",
  },
  {
    requestType: "GENERAL_SERVICE_REQUEST",
    label: (t) => t.myRequestsTitle,
    icon: LayoutGrid,
    iconColor: "text-zinc-500",
    iconBg: "bg-zinc-100",
    dotColor: "bg-zinc-400",
  },
];

const STATUS_CONFIG: Record<string, { label: (t: GuestTranslations) => string; text: string; dot: string }> = {
  open: { label: (t) => t.reqStatusOpen, text: "text-amber-600", dot: "bg-amber-400" },
  in_progress: { label: (t) => t.reqStatusInProgress, text: "text-sky-600", dot: "bg-sky-500" },
  resolved: { label: (t) => t.reqStatusResolved, text: "text-emerald-500", dot: "bg-emerald-400" },
};

function RequestCard({
  request,
  t,
  onDelete,
}: {
  request: ServiceRequest;
  t: GuestTranslations;
  onDelete?: (id: number) => void;
}) {
  const gc = REQUEST_GROUP_CONFIGS.find((c) => c.requestType === request.requestType)
    ?? REQUEST_GROUP_CONFIGS[3];
  const sc = STATUS_CONFIG[request.status] ?? STATUS_CONFIG.open;
  const Icon = gc.icon;
  const displayText = buildDisplaySummary(request);

  const [deleteState, setDeleteState] = useState<"idle" | "confirming" | "deleting">("idle");

  const handleDelete = async () => {
    setDeleteState("deleting");
    try {
      await deleteMyServiceRequest(request.id);
      onDelete?.(request.id);
      toast.success(t.reqDeletedToast);
    } catch {
      toast.error(t.sendFailed);
      setDeleteState("idle");
    }
  };

  return (
    <div className="bg-white rounded-xl border border-zinc-100 px-4 py-3 flex items-center gap-3">
      <div className={`w-8 h-8 rounded-lg ${gc.iconBg} flex items-center justify-center shrink-0`}>
        <Icon className={`w-3.5 h-3.5 ${gc.iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-zinc-800 leading-tight truncate">
          {displayText}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <div className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
          <p className={`text-[10px] font-semibold ${sc.text}`}>{sc.label(t)}</p>
          <span className="text-[10px] text-zinc-200">·</span>
          <p className="text-[10px] text-zinc-400">{timeAgo(request.createdAt)}</p>
        </div>
      </div>

      {/* Delete — resolved only */}
      {request.status === "resolved" && onDelete && (
        <div className="shrink-0">
          {deleteState === "idle" && (
            <button
              onClick={() => setDeleteState("confirming")}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-200 hover:text-zinc-400 hover:bg-zinc-50 transition-all"
              aria-label={t.reqDeleteLabel}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
          {deleteState === "confirming" && (
            <div className="flex items-center gap-1">
              <button
                onClick={handleDelete}
                className="text-[10px] font-semibold text-red-500 hover:text-red-600 px-1.5 py-1 rounded-lg hover:bg-red-50 transition-all"
              >
                {t.reqDeleteConfirm}
              </button>
              <button
                onClick={() => setDeleteState("idle")}
                className="text-[10px] text-zinc-300 hover:text-zinc-500 px-1 py-1 transition-all"
              >
                ✕
              </button>
            </div>
          )}
          {deleteState === "deleting" && (
            <Loader2 className="w-3.5 h-3.5 text-zinc-300 animate-spin" />
          )}
        </div>
      )}
    </div>
  );
}

function GuestRequestGroups({
  requests,
  t,
  onDelete,
}: {
  requests: ServiceRequest[];
  t: GuestTranslations;
  onDelete?: (id: number) => void;
}) {
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());

  const grouped = useMemo(() => {
    const map: Record<string, ServiceRequest[]> = {};
    for (const req of requests) {
      if (!map[req.requestType]) map[req.requestType] = [];
      map[req.requestType].push(req);
    }
    return map;
  }, [requests]);

  const toggle = (type: string) => {
    setExpandedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const activeGroups = REQUEST_GROUP_CONFIGS.filter(
    (g) => (grouped[g.requestType]?.length ?? 0) > 0
  );

  if (activeGroups.length === 0) return null;

  return (
    <div className="space-y-2.5">
      {activeGroups.map((group) => {
        const items = grouped[group.requestType] ?? [];
        const isExpanded = expandedTypes.has(group.requestType);
        const Icon = group.icon;
        const newestSummary = items[0]?.summary ?? "";

        return (
          <div key={group.requestType}>
            {/* Stack group header */}
            <button
              onClick={() => toggle(group.requestType)}
              className="w-full text-left"
            >
              <div className="relative pb-1.5">
                {/* Depth layer 2 — furthest back */}
                <div className="absolute inset-x-3 bottom-0 h-full rounded-2xl bg-zinc-100 border border-zinc-100/80" />
                {/* Depth layer 1 — middle */}
                <div className="absolute inset-x-1.5 bottom-0.5 h-full rounded-2xl bg-zinc-50 border border-zinc-100" />
                {/* Top card */}
                <div className="relative bg-white rounded-2xl border border-zinc-100 shadow-sm px-4 py-3.5 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl ${group.iconBg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-4 h-4 ${group.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[14px] font-semibold text-zinc-800 leading-tight">
                        {group.label(t)}
                      </p>
                      <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 rounded-full px-1.5 py-0.5 leading-none">
                        {items.length}
                      </span>
                    </div>
                    {!isExpanded && newestSummary && (
                      <p className="text-[11px] text-zinc-400 mt-0.5 truncate leading-tight">
                        {newestSummary}
                      </p>
                    )}
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-zinc-300 transition-transform duration-200 shrink-0 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </div>
            </button>

            {/* Expanded cards */}
            {isExpanded && (
              <div className="mt-1 space-y-1.5 animate-in slide-in-from-top-1 fade-in duration-200">
                {items.map((req) => (
                  <RequestCard key={req.id} request={req} t={t} onDelete={onDelete} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

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
  const queryClient = useQueryClient();
  const install = useInstallPrompt();
  const { t, voiceLocale } = useLocale();

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

  const guestUser = user as typeof user & { guestKeyDisplay?: string | null };

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
          <div className="flex items-center gap-0.5">
            <button
              onClick={handleLogout}
              className="text-zinc-400 hover:text-zinc-700 transition-colors p-2 -mr-2"
              aria-label={t.logout}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pb-20">
        {/* Welcome line */}
        <div className="pt-8 pb-2 text-center">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest">
            {tFmt(t.welcome, { name: user.firstName ?? "" })}
          </p>
        </div>

        {/* ── Voice Hero — PRIMARY CTA — UNCHANGED ── */}
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

        {/* ── Konaklamanız hakkında — Stay Key Card ── */}
        <section className="mb-7">
          <StayKeyCard
            guestKeyDisplay={guestUser.guestKeyDisplay}
            roomNumber={user.roomNumber ?? undefined}
            firstName={user.firstName ?? undefined}
            lastName={user.lastName ?? undefined}
          />
        </section>

        {/* ── Hızlı Hizmetler — Service Quick Actions ── */}
        <section className="mb-7">
          <ServiceQuickActions onAction={handleQuickAction} t={t} />
        </section>

        {/* ── My Requests — grouped stacked cards ── */}
        {myRequests !== undefined && (
          <section className="mb-7">
            <h3 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-3 px-1">
              {t.myRequestsTitle}
            </h3>
            {myRequests.length === 0 ? (
              <div className="bg-white rounded-2xl border border-zinc-100 px-5 py-7 flex flex-col items-center gap-2 shadow-sm">
                <div className="w-9 h-9 rounded-xl bg-zinc-50 flex items-center justify-center">
                  <LayoutGrid className="w-4 h-4 text-zinc-200" />
                </div>
                <p className="text-[13px] text-zinc-400">{t.myRequestsEmpty}</p>
              </div>
            ) : (
              <GuestRequestGroups requests={myRequests} t={t} onDelete={handleDeleteRequest} />
            )}
          </section>
        )}

        {/* Hotel-configured quick actions */}
        {quickActions && quickActions.length > 0 && (
          <section className="mb-7">
            <h3 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-3 px-1">
              {t.quickActionsSection}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map(
                (action: { id: number; icon?: string | null; label: string }) => {
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
