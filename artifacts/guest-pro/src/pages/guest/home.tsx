import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useGetHotelBranding, useListQuickActions, useLogout } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import {
  LogOut,
  Sparkles,
  ArrowRight,
  Phone,
  Calendar,
  MapPin,
  Clock,
  BedDouble,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  "map-pin": MapPin,
  "calendar": Calendar,
  "phone": Phone,
  "activity": Calendar,
};

const INFO_ITEMS = [
  {
    icon: Phone,
    title: "24/7 Front Desk",
    desc: "Our team is always available for any request.",
  },
  {
    icon: BedDouble,
    title: "Housekeeping",
    desc: "Ask your concierge to schedule room service.",
  },
  {
    icon: Clock,
    title: "Check-out",
    desc: "Standard check-out is at 12:00 noon.",
  },
];

export default function GuestHome() {
  const { user, isAuthenticated, logoutAuth } = useAuth();
  const [, setLocation] = useLocation();
  const logoutMutation = useLogout();

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
    toast.success("You've checked out. Safe travels!");
  };

  const goToChat = (q?: string) => {
    const url = q ? `/guest/chat?q=${encodeURIComponent(q)}` : "/guest/chat";
    setLocation(url);
  };

  if (!isAuthenticated || user?.role !== "guest") return null;

  return (
    <div className="min-h-[100dvh] bg-[#F8F8F8]">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-zinc-100/80 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-5 h-[64px] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-serif text-[17px] font-medium text-zinc-900 tracking-tight">
              {branding?.appName || "Guest Pro"}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-700 transition-colors text-sm py-2 -mr-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pb-16">
        {/* Welcome line */}
        <div className="pt-8 pb-6 px-1">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mb-1">
            Welcome back
          </p>
          <h1 className="text-3xl font-serif text-zinc-900 tracking-tight">
            {user.firstName}
          </h1>
          <p className="text-zinc-400 text-[14px] mt-1">
            Room {user.roomNumber} &middot; Your personal concierge is ready
          </p>
        </div>

        {/* Hero CTA — Ask something */}
        <div className="mb-8">
          <button
            onClick={() => goToChat()}
            className="w-full bg-white rounded-3xl border border-zinc-100 shadow-md shadow-zinc-200/50 p-7 text-left active:scale-[0.99] transition-all duration-150 group"
          >
            <div className="flex flex-col items-center text-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center group-active:bg-zinc-100 transition-colors">
                <Sparkles className="w-6 h-6 text-zinc-400" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-[22px] font-serif text-zinc-900 leading-snug">
                  Ask your concierge
                </h2>
                <p className="text-zinc-500 text-[15px] leading-relaxed">
                  Need help with anything during your stay?
                </p>
              </div>
              <div className="flex items-center gap-2 bg-zinc-900 text-white text-[14px] font-medium px-6 py-3 rounded-full">
                Ask something
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </button>
        </div>

        {/* Overview section */}
        <section className="mb-7">
          <h3 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-3 px-1">
            Your Stay
          </h3>
          <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-zinc-400 font-medium uppercase tracking-wide mb-1.5">
                  Room
                </p>
                <p className="text-3xl font-serif text-zinc-900 leading-none">
                  {user.roomNumber}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-zinc-400 font-medium uppercase tracking-wide mb-1.5">
                  Guest
                </p>
                <p className="text-[15px] font-medium text-zinc-800">
                  {user.firstName} {user.lastName}
                </p>
              </div>
            </div>
            <div className="border-t border-zinc-50 px-6 py-3.5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-[13px] text-zinc-500">Stay active</span>
                <button
                  onClick={() => goToChat()}
                  className="ml-auto flex items-center gap-1 text-[13px] text-zinc-400 hover:text-zinc-700 transition-colors"
                >
                  Open chat <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions section */}
        {quickActions && quickActions.length > 0 && (
          <section className="mb-7">
            <h3 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-3 px-1">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action: { id: number; icon?: string; label: string }) => {
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
                    <p className="text-[12px] text-zinc-400 mt-1">Tap to ask →</p>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Info section */}
        <section className="mb-7">
          <h3 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-3 px-1">
            At Your Service
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
                  <p className="text-[12px] text-zinc-500 mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer note */}
        <p className="text-center text-[12px] text-zinc-300 px-4">
          Powered by {branding?.appName || "Guest Pro"} &middot; AI-assisted concierge
        </p>
      </main>
    </div>
  );
}
