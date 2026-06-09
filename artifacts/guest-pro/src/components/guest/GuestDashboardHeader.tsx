/**
 * GuestDashboardHeader — sticky header with mobile burger navigation.
 */

import { useState, useMemo, useCallback } from "react";
import { LogOut, Menu } from "lucide-react";
import { HotelBrandMark } from "@/components/HotelBrandMark";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocale } from "@/hooks/use-locale";
import {
  buildGuestDashboardNavItems,
  scrollToGuestSection,
  type GuestDashboardNavItem,
} from "@/lib/guest-dashboard-nav";
import { GuestMobileNavDrawer } from "@/components/guest/GuestMobileNavDrawer";
import { GuestLanguageSheet } from "@/components/guest/GuestLanguageSheet";

interface GuestDashboardHeaderProps {
  appName: string;
  nearbyLabel: string;
  showRequestsSection: boolean;
  onLogout: () => void;
}

export function GuestDashboardHeader({
  appName,
  nearbyLabel,
  showRequestsSection,
  onLogout,
}: GuestDashboardHeaderProps) {
  const isMobile = useIsMobile();
  const { t, uiLocale, setLocale } = useLocale();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);

  const navItems: GuestDashboardNavItem[] = useMemo(
    () =>
      buildGuestDashboardNavItems({
        t,
        nearbyLabel,
        showRequests: showRequestsSection,
      }),
    [t, nearbyLabel, showRequestsSection],
  );

  const handleNavSelect = useCallback((sectionId: string) => {
    setDrawerOpen(false);
    window.requestAnimationFrame(() => {
      scrollToGuestSection(sectionId, { headerOffsetPx: 72 });
    });
  }, []);

  const handleLanguageOpen = useCallback(() => {
    setDrawerOpen(false);
    window.requestAnimationFrame(() => setLanguageOpen(true));
  }, []);

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-zinc-100/80 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-[64px] max-w-2xl items-center justify-between gap-2 px-4 md:px-5">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {isMobile && (
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="-ms-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-zinc-700 transition-colors hover:bg-zinc-100 active:scale-95"
                aria-label={t.navMenuOpen}
                aria-expanded={drawerOpen}
                aria-controls="guest-mobile-nav"
              >
                <Menu className="h-5 w-5" strokeWidth={1.75} />
              </button>
            )}
            <HotelBrandMark variant="header" framed />
            <span className="truncate font-serif text-[17px] font-medium tracking-tight text-zinc-900">
              {appName}
            </span>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="-me-1 shrink-0 p-2 text-zinc-400 transition-colors hover:text-zinc-700"
            aria-label={t.logout}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {isMobile && (
        <GuestMobileNavDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          items={navItems}
          menuTitle={t.navMenuTitle}
          appName={appName}
          closeLabel={t.cancel}
          languageLabel={t.languageMenuLabel}
          onSelectItem={handleNavSelect}
          onLanguageClick={handleLanguageOpen}
        />
      )}

      <GuestLanguageSheet
        open={languageOpen}
        onClose={() => setLanguageOpen(false)}
        currentLocale={uiLocale}
        onSelect={setLocale}
        title={t.languageSheetTitle}
        cancelLabel={t.cancel}
      />
    </>
  );
}
