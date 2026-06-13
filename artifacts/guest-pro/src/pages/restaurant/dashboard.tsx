/**
 * Restaurant Dashboard — restaurant personnel only (separate login).
 * Tabs: Orders | Menu | Care
 */

import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ROUTES } from "@/lib/app-routes";
import { useAuth } from "@/hooks/use-auth.tsx";
import { useStaffLocale } from "@/hooks/use-staff-locale";
import { useLogout } from "@workspace/api-client-react";
import { toast } from "sonner";
import { ChefHat, LogOut } from "lucide-react";
import { LanguagePicker } from "@/components/ui/LanguagePicker";
import { RestaurantOrdersTab } from "@/components/restaurant/RestaurantOrdersTab";
import { RestaurantMenuTab } from "@/components/restaurant/RestaurantMenuTab";
import { RestaurantCareInsightsTab } from "@/components/restaurant/RestaurantCareInsightsTab";
import {
  RestaurantAnimatedTabs,
  type RestaurantTab,
} from "@/components/restaurant/RestaurantAnimatedTabs";
import { ManagerTabPanel } from "@/components/manager/ManagerTabPanel";
import { listOrders, type FoodOrder } from "@/lib/restaurant";

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

  const { data: orders } = useQuery<FoodOrder[]>({
    queryKey: ["restaurant-orders"],
    queryFn: () => listOrders(),
    enabled: isAuthenticated,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const openOrderCount = useMemo(
    () =>
      (orders ?? []).filter((o) => o.status === "open" || o.status === "in_progress").length,
    [orders],
  );

  const handleLogout = () => {
    logoutAuth();
    logoutMutation.mutate(undefined);
    toast.success(t.loggedOut);
  };

  if (!isAuthenticated || !user) return null;

  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "Restaurant";

  return (
    <div className="min-h-dvh bg-zinc-50/60" dir={dir}>
      <header className="sticky top-0 z-20 border-b border-zinc-100/90 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center" aria-hidden>
              <ChefHat className="guest-chat-entry-icon h-7 w-7 text-amber-600" strokeWidth={1.5} />
            </span>
            <div className="min-w-0">
              <span className="block truncate font-serif text-[15px] font-medium leading-tight text-zinc-900">
                {t.restaurantTitle}
              </span>
              <span className="mt-0.5 block max-w-40 truncate text-[10px] font-medium leading-tight text-zinc-400">
                {displayName}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <LanguagePicker locale={locale} onLocaleChange={setLocale} dir={dir} />
            <button
              type="button"
              onClick={handleLogout}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 touch-manipulation"
              aria-label={t.logout}
            >
              <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-4 px-4 py-5 pb-24">
        <RestaurantAnimatedTabs
          active={activeTab}
          onChange={setActiveTab}
          openOrderCount={openOrderCount}
          t={t}
        />

        <ManagerTabPanel tabKey={activeTab}>
          {activeTab === "orders" && <RestaurantOrdersTab />}
          {activeTab === "menu" && <RestaurantMenuTab />}
          {activeTab === "care" && <RestaurantCareInsightsTab />}
        </ManagerTabPanel>
      </main>
    </div>
  );
}
