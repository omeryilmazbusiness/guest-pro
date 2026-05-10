/**
 * Restaurant Dashboard
 * Route: /restaurant
 * Access: manager OR personnel with staffDepartment === "RESTAURANT"
 *
 * Tabs:
 *   Orders       – incoming FOOD_ORDER requests
 *   Menu         – manage DAILY / ROOM_SERVICE menus
 *   Stock        – ingredient / product stock ledger
 *   Care         – AI care-profile nutrition insights
 */

import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth.tsx";
import { useStaffLocale } from "@/hooks/use-staff-locale";
import { tStaff } from "@/lib/staff-i18n";
import { useLogout } from "@workspace/api-client-react";
import { toast } from "sonner";
import {
  UtensilsCrossed, PackageSearch, Heart, LogOut, ChefHat, Bell,
} from "lucide-react";
import { LanguagePicker } from "@/components/ui/LanguagePicker";
import { RestaurantOrdersTab }     from "@/components/restaurant/RestaurantOrdersTab";
import { RestaurantMenuTab }       from "@/components/restaurant/RestaurantMenuTab";
import { RestaurantStockTab }      from "@/components/restaurant/RestaurantStockTab";
import { RestaurantCareInsightsTab } from "@/components/restaurant/RestaurantCareInsightsTab";

type RestaurantTab = "orders" | "menu" | "stock" | "care";

// ── Tab bar ───────────────────────────────────────────────────────────────────

const TABS: {
  key: RestaurantTab;
  icon: React.FC<{ className?: string }>;
}[] = [
  { key: "orders", icon: Bell },
  { key: "menu",   icon: UtensilsCrossed },
  { key: "stock",  icon: PackageSearch },
  { key: "care",   icon: Heart },
];

function TabBar({
  active,
  onChange,
  t,
}: {
  active: RestaurantTab;
  onChange: (tab: RestaurantTab) => void;
  t: ReturnType<typeof useStaffLocale>["t"];
}) {
  const LABELS: Record<RestaurantTab, string> = {
    orders: t.tabOrders,
    menu:   t.tabMenu,
    stock:  t.tabStock,
    care:   t.tabCare,
  };
  return (
    <div className="flex bg-zinc-100 rounded-2xl p-1 gap-1">
      {TABS.map(({ key, icon: Icon }) => {
        const label = LABELS[key];
        const isActive = active === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl text-[12px] font-semibold transition-all touch-manipulation ${
              isActive
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function RestaurantDashboard() {
  const { user, isAuthenticated, logoutAuth } = useAuth();
  const [, setLocation] = useLocation();
  const logoutMutation = useLogout();
  const { t, locale, dir, setLocale } = useStaffLocale();

  const [activeTab, setActiveTab] = useState<RestaurantTab>("orders");

  // Auth guard — must be manager OR restaurant personnel
  useEffect(() => {
    if (!isAuthenticated) { setLocation("/"); return; }
    if (!user) return;
    const isManager = user.role === "manager";
    const isRestaurantPersonnel =
      user.role === "personnel" && user.staffDepartment === "RESTAURANT";
    if (!isManager && !isRestaurantPersonnel) {
      // Redirect non-restaurant staff back to the main dashboard
      setLocation("/manager");
    }
  }, [isAuthenticated, user, setLocation]);

  const handleLogout = () => {
    logoutAuth();
    logoutMutation.mutate(undefined);
    toast.success(t.loggedOut);
  };

  if (!isAuthenticated || !user) return null;

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "Restaurant";

  return (
    <div className="min-h-dvh bg-zinc-50/60" dir={dir}>

      {/* ── Sticky header ── */}
      <header className="bg-white border-b border-zinc-100 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
              <ChefHat className="w-4 h-4 text-amber-600" />
            </div>
            <div className="min-w-0">
              <span className="font-serif text-base font-medium text-zinc-900 block leading-none">
                {t.restaurantTitle}
              </span>
              <span className="text-[10px] text-zinc-400 font-medium leading-none truncate block max-w-40">
                {displayName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* ── Language picker ── */}
            <LanguagePicker locale={locale} onLocaleChange={setLocale} dir={dir} />

            {/* Link back to main dashboard for managers */}
            {user.role === "manager" && (
              <button
                onClick={() => setLocation("/manager")}
                className="text-[11px] text-zinc-400 hover:text-zinc-700 px-2 py-1 rounded-lg hover:bg-zinc-50 transition-all"
              >
                {t.backToDashboard}
              </button>
            )}
            <button
              onClick={handleLogout}
              className="w-8 h-8 rounded-xl text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 flex items-center justify-center transition-all touch-manipulation"
              aria-label="Log out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Scrollable content ── */}
      <main className="max-w-2xl mx-auto px-4 py-5 pb-24 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">

        {/* Tab bar */}
        <TabBar active={activeTab} onChange={setActiveTab} t={t} />

        {/* Tab content */}
        {activeTab === "orders" && (
          <div className="animate-in fade-in duration-200">
            <RestaurantOrdersTab />
          </div>
        )}
        {activeTab === "menu" && (
          <div className="animate-in fade-in duration-200">
            <RestaurantMenuTab />
          </div>
        )}
        {activeTab === "stock" && (
          <div className="animate-in fade-in duration-200">
            <RestaurantStockTab />
          </div>
        )}
        {activeTab === "care" && (
          <div className="animate-in fade-in duration-200">
            <RestaurantCareInsightsTab />
          </div>
        )}

      </main>
    </div>
  );
}
