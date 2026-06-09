/**
 * Restaurant Dashboard — restaurant personnel only (separate login).
 * Tabs: Orders | Menu | Care
 */

import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ROUTES } from "@/lib/app-routes";
import { useAuth } from "@/hooks/use-auth.tsx";
import { useStaffLocale } from "@/hooks/use-staff-locale";
import { useLogout } from "@workspace/api-client-react";
import { toast } from "sonner";
import { UtensilsCrossed, Heart, LogOut, ChefHat, Bell } from "lucide-react";
import { LanguagePicker } from "@/components/ui/LanguagePicker";
import { RestaurantOrdersTab } from "@/components/restaurant/RestaurantOrdersTab";
import { RestaurantMenuTab } from "@/components/restaurant/RestaurantMenuTab";
import { RestaurantCareInsightsTab } from "@/components/restaurant/RestaurantCareInsightsTab";

type RestaurantTab = "orders" | "menu" | "care";

const TABS: { key: RestaurantTab; icon: React.FC<{ className?: string }> }[] = [
  { key: "orders", icon: Bell },
  { key: "menu", icon: UtensilsCrossed },
  { key: "care", icon: Heart },
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
    menu: t.tabMenu,
    care: t.tabCare,
  };
  return (
    <div className="flex gap-1 rounded-2xl bg-stone-100/80 p-1">
      {TABS.map(({ key, icon: Icon }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`flex flex-1 items-center justify-center gap-1.5 h-10 rounded-xl text-[12px] font-semibold transition-all touch-manipulation ${
              isActive
                ? "bg-white text-stone-900 shadow-sm shadow-stone-200/60"
                : "text-stone-500 hover:text-stone-700"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {LABELS[key]}
          </button>
        );
      })}
    </div>
  );
}

export default function RestaurantDashboard() {
  const { user, isAuthenticated, logoutAuth } = useAuth();
  const [, setLocation] = useLocation();
  const logoutMutation = useLogout();
  const { t, locale, dir, setLocale } = useStaffLocale();
  const [activeTab, setActiveTab] = useState<RestaurantTab>("orders");

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation(ROUTES.restaurantLogin);
      return;
    }
    if (!user) return;
    const isRestaurantPersonnel =
      user.role === "personnel" &&
      (user as { staffDepartment?: string | null }).staffDepartment === "RESTAURANT";
    if (!isRestaurantPersonnel) {
      setLocation(ROUTES.managerLogin);
    }
  }, [isAuthenticated, user, setLocation]);

  const handleLogout = () => {
    logoutAuth();
    logoutMutation.mutate(undefined);
    toast.success(t.loggedOut);
  };

  if (!isAuthenticated || !user) return null;

  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "Restaurant";

  return (
    <div className="min-h-dvh bg-gradient-to-b from-stone-50 to-stone-100/40" dir={dir}>
      <header className="sticky top-0 z-20 border-b border-stone-100/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50/80 ring-1 ring-amber-100/80">
              <ChefHat className="h-4 w-4 text-amber-700" />
            </div>
            <div className="min-w-0">
              <span className="block truncate font-serif text-base font-medium leading-none text-stone-900">
                {t.restaurantTitle}
              </span>
              <span className="mt-0.5 block max-w-40 truncate text-[10px] font-medium leading-none text-stone-400">
                {displayName}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <LanguagePicker locale={locale} onLocaleChange={setLocale} dir={dir} />
            <button
              onClick={handleLogout}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-stone-400 transition-all hover:bg-stone-100 hover:text-stone-900 touch-manipulation"
              aria-label={t.logout}
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-4 px-4 py-5 pb-24 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <TabBar active={activeTab} onChange={setActiveTab} t={t} />
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
        {activeTab === "care" && (
          <div className="animate-in fade-in duration-200">
            <RestaurantCareInsightsTab />
          </div>
        )}
      </main>
    </div>
  );
}
