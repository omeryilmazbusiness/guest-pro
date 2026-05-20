/**
 * ManagerDashboardHeader — sticky header with mobile burger navigation.
 */

import { useState, useMemo, useCallback } from "react";
import { Menu } from "lucide-react";
import { GuestProLogo } from "@/components/GuestProLogo";
import { LanguagePicker } from "@/components/ui/LanguagePicker";
import { useIsMobile } from "@/hooks/use-mobile";
import type { StaffLocale, StaffTranslations } from "@/lib/staff-i18n";
import {
  buildManagerDashboardNavItems,
  type ManagerDashboardNavItem,
  type ManagerDashboardTab,
} from "@/lib/manager-dashboard-nav";
import type { StaffScopeKind } from "@/lib/staff-scope";
import { ManagerMobileNavDrawer } from "@/components/manager/ManagerMobileNavDrawer";

export interface ManagerDashboardHeaderProps {
  appName: string;
  roleLine: string;
  t: StaffTranslations;
  locale: StaffLocale;
  dir: "ltr" | "rtl";
  onLocaleChange: (locale: StaffLocale) => void;
  scope: StaffScopeKind;
  isGeneralManager: boolean;
  guestCount: number;
  roomCount: number;
  requestCount: number;
  teamCount: number;
  canCreateGuest: boolean;
  onTabChange: (tab: ManagerDashboardTab) => void;
  onCreateGuest: () => void;
  onQuickReport: () => void;
  onSettings: () => void;
  onRestaurant: () => void;
  rightSlot: React.ReactNode;
}

export function ManagerDashboardHeader({
  appName,
  roleLine,
  t,
  locale,
  dir,
  onLocaleChange,
  scope,
  isGeneralManager,
  guestCount,
  roomCount,
  requestCount,
  teamCount,
  canCreateGuest,
  onTabChange,
  onCreateGuest,
  onQuickReport,
  onSettings,
  onRestaurant,
  rightSlot,
}: ManagerDashboardHeaderProps) {
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navItems: ManagerDashboardNavItem[] = useMemo(
    () =>
      buildManagerDashboardNavItems({
        t,
        scope,
        guestCount,
        roomCount,
        requestCount,
        teamCount,
        canCreateGuest,
        isGeneralManager,
      }),
    [t, scope, guestCount, roomCount, requestCount, teamCount, canCreateGuest, isGeneralManager],
  );

  const handleNavSelect = useCallback(
    (item: ManagerDashboardNavItem) => {
      setDrawerOpen(false);
      switch (item.action.type) {
        case "tab":
          onTabChange(item.action.tab);
          break;
        case "create-guest":
          onCreateGuest();
          break;
        case "quick-report":
          onQuickReport();
          break;
        case "settings":
          onSettings();
          break;
        case "restaurant":
          onRestaurant();
          break;
      }
    },
    [onTabChange, onCreateGuest, onQuickReport, onSettings, onRestaurant],
  );

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-zinc-100/90 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between gap-2 px-4">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {isMobile && (
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="-ml-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-zinc-800 transition-colors hover:bg-zinc-100 active:scale-95"
                aria-label={t.navMenuOpen}
                aria-expanded={drawerOpen}
                aria-controls="manager-mobile-nav"
              >
                <Menu className="h-5 w-5" strokeWidth={1.75} />
              </button>
            )}
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-zinc-100 bg-white shadow-sm">
              <GuestProLogo variant="header" className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="block truncate font-serif text-[15px] font-medium leading-tight text-zinc-900">
                {appName}
              </span>
              <span className="block truncate text-[10px] font-medium leading-tight text-zinc-400">
                {roleLine}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <LanguagePicker locale={locale} onLocaleChange={onLocaleChange} dir={dir} />
            {rightSlot}
          </div>
        </div>
      </header>

      {isMobile && (
        <ManagerMobileNavDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          items={navItems}
          menuTitle={t.navMenuTitle}
          appName={appName}
          roleLine={roleLine}
          closeLabel={t.cancel}
          onSelectItem={handleNavSelect}
        />
      )}
    </>
  );
}
