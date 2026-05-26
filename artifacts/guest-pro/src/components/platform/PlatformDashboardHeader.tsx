import { useCallback, useMemo, useState } from "react";
import { LogOut, Menu, Shield } from "lucide-react";
import { GuestProLogo } from "@/components/GuestProLogo";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { buildPlatformDashboardNavItems } from "@/lib/platform-dashboard-nav";
import type { PlatformDashboardTab } from "@/components/platform/PlatformDashboardTabs";
import { PlatformMobileNavDrawer } from "@/components/platform/PlatformMobileNavDrawer";

export interface PlatformDashboardHeaderProps {
  email: string;
  activeTab: PlatformDashboardTab;
  hotelCount: number;
  onTabChange: (tab: PlatformDashboardTab) => void;
  onLogout: () => void;
}

export function PlatformDashboardHeader({
  email,
  activeTab,
  hotelCount,
  onTabChange,
  onLogout,
}: PlatformDashboardHeaderProps) {
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navItems = useMemo(
    () => buildPlatformDashboardNavItems(hotelCount),
    [hotelCount],
  );

  const roleLine = `Super Admin · ${email}`;

  const handleTabSelect = useCallback(
    (tab: PlatformDashboardTab) => {
      onTabChange(tab);
      setDrawerOpen(false);
    },
    [onTabChange],
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
                aria-label="Open navigation menu"
                aria-expanded={drawerOpen}
                aria-controls="platform-mobile-nav"
              >
                <Menu className="h-5 w-5" strokeWidth={1.75} />
              </button>
            )}
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-zinc-100 bg-white shadow-sm">
              <GuestProLogo variant="header" className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="block truncate font-serif text-[15px] font-medium leading-tight text-zinc-900">
                Guest Pro Platform
              </span>
              <span className="flex items-center gap-1 truncate text-[10px] font-medium leading-tight text-zinc-400">
                <Shield className="h-3 w-3 shrink-0" />
                {isMobile ? email : roleLine}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="h-8 shrink-0 rounded-xl px-2.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
          >
            <LogOut className="mr-1.5 h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </header>

      {isMobile && (
        <PlatformMobileNavDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          items={navItems}
          activeTab={activeTab}
          appName="Guest Pro Platform"
          roleLine={roleLine}
          onSelectTab={handleTabSelect}
        />
      )}
    </>
  );
}
