import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useStaffLocale } from "@/hooks/use-staff-locale";
import { useTenantNav } from "@/hooks/use-tenant-nav";
import { can, Permission } from "@/lib/permissions";
import { ROUTES } from "@/lib/app-routes";
import { SettingsShell } from "@/components/manager/settings/SettingsShell";
import { SettingsCategoryHeader } from "@/components/manager/settings/SettingsSectionCard";
import { WifiNetworksSettingsSection } from "@/components/manager/settings/WifiNetworksSettingsSection";
import { NearbyHotelLocationSection } from "@/components/manager/settings/NearbyHotelLocationSection";
import { NearbyPlacesSettingsSection } from "@/components/manager/settings/NearbyPlacesSettingsSection";

export default function GuestExperienceSettingsPage() {
  const navigate = useTenantNav();
  const { user } = useAuth();
  const { t } = useStaffLocale();

  useEffect(() => {
    if (user && !can(user.role, Permission.MANAGE_HOTEL)) {
      navigate(ROUTES.manager);
    }
  }, [user, navigate]);

  if (!user || !can(user.role, Permission.MANAGE_HOTEL)) return null;

  return (
    <SettingsShell
      title={t.settingsCategoryGuest}
      backTo={ROUTES.managerSettings}
      wide
    >
      <div className="space-y-5">
        <SettingsCategoryHeader
          title={t.settingsCategoryGuest}
          description={t.settingsCategoryGuestDesc}
        />
        <NearbyHotelLocationSection />
        <NearbyPlacesSettingsSection />
        <WifiNetworksSettingsSection />
      </div>
    </SettingsShell>
  );
}
