import type { LucideIcon } from "lucide-react";
import { Activity, Building2, Plus, Settings } from "lucide-react";
import type { PlatformDashboardTab } from "@/components/platform/PlatformDashboardTabs";

export interface PlatformDashboardNavItem {
  id: PlatformDashboardTab;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

export function buildPlatformDashboardNavItems(
  hotelCount: number,
): PlatformDashboardNavItem[] {
  return [
    { id: "hotels", label: "Hotels", icon: Building2, badge: hotelCount > 0 ? hotelCount : undefined },
    { id: "add-hotel", label: "New hotel", icon: Plus },
    { id: "track", label: "Track", icon: Activity },
    { id: "settings", label: "Settings", icon: Settings },
  ];
}
