import { useEffect } from "react";
import { Sparkles, Radio } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useStaffLocale } from "@/hooks/use-staff-locale";
import { useTenantNav } from "@/hooks/use-tenant-nav";
import { can, Permission } from "@/lib/permissions";
import { ROUTES } from "@/lib/app-routes";
import { SettingsShell } from "@/components/manager/settings/SettingsShell";
import { SettingsHubRow } from "@/components/manager/settings/SettingsHubRow";

export default function SettingsHubPage() {
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
    <SettingsShell title={t.settings} backTo={ROUTES.manager} backLabel={t.backToDashboard}>
      <div className="space-y-3">
        <p className="px-1 text-[13px] text-zinc-500">{t.settingsHubIntro}</p>

        <SettingsHubRow
          icon={Sparkles}
          iconClassName="border-teal-100 bg-gradient-to-br from-teal-50 to-emerald-50 text-teal-700"
          title={t.settingsCategoryGuest}
          description={t.settingsCategoryGuestDesc}
          onClick={() => navigate(`${ROUTES.managerSettings}/guest`)}
        />

        <SettingsHubRow
          icon={Radio}
          iconClassName="border-sky-100 bg-gradient-to-br from-sky-50 to-indigo-50 text-sky-700"
          title={t.settingsCategoryTracking}
          description={t.settingsCategoryTrackingDesc}
          onClick={() => navigate(`${ROUTES.managerSettings}/tracking`)}
        />
      </div>
    </SettingsShell>
  );
}
