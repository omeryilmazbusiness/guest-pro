import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlatformDashboardHeader } from "@/components/platform/PlatformDashboardHeader";
import {
  PlatformDashboardTabs,
  type PlatformDashboardTab,
} from "@/components/platform/PlatformDashboardTabs";
import { buildPlatformDashboardNavItems } from "@/lib/platform-dashboard-nav";
import { useIsMobile } from "@/hooks/use-mobile";
import { PlatformAddHotelWizard } from "@/components/platform/PlatformAddHotelWizard";
import { PlatformHotelManageSheet } from "@/components/platform/PlatformHotelManageSheet";
import { PlatformHotelsList } from "@/components/platform/PlatformHotelsList";
import { PlatformManagerEditSheet } from "@/components/platform/PlatformManagerEditSheet";
import { PlatformHotelsTrack } from "@/components/platform/PlatformHotelsTrack";
import {
  changePlatformPassword,
  getPlatformSettings,
  listPlatformHotels,
  listPlatformTrack,
  updatePlatformHotel,
  updatePlatformSettings,
  type PlatformHotel,
  type PlatformHotelTrack,
} from "@/lib/platform-api";
import { usePlatformAuth } from "@/hooks/use-platform-auth";
import { ROUTES } from "@/lib/app-routes";
import { generateTemporaryPassword } from "@/lib/temporary-password";
import { toast } from "sonner";

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4">
        <h2 className="font-serif text-base font-medium text-zinc-900">{title}</h2>
        {description && <p className="mt-1 text-sm text-zinc-500">{description}</p>}
      </div>
      {children}
    </section>
  );
}

export default function PlatformDashboard() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading, logout, user } = usePlatformAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<PlatformDashboardTab>("hotels");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [togglingHotelId, setTogglingHotelId] = useState<number | null>(null);
  const [manageHotel, setManageHotel] = useState<PlatformHotel | null>(null);
  const [managePanel, setManagePanel] = useState<"default" | "delete">("default");
  const [managerHotel, setManagerHotel] = useState<PlatformHotel | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation(ROUTES.platformLogin);
    }
  }, [isLoading, isAuthenticated, setLocation]);

  const { data, isLoading: hotelsLoading } = useQuery({
    queryKey: ["platform-hotels"],
    queryFn: listPlatformHotels,
    enabled: isAuthenticated,
  });

  const { data: trackData, isLoading: trackLoading } = useQuery({
    queryKey: ["platform-track"],
    queryFn: listPlatformTrack,
    enabled: isAuthenticated && activeTab === "track",
  });

  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ["platform-settings"],
    queryFn: getPlatformSettings,
    enabled: isAuthenticated && activeTab === "settings",
  });

  useEffect(() => {
    if (settingsData?.verificationEmail) {
      setVerificationEmail(settingsData.verificationEmail);
    }
  }, [settingsData?.verificationEmail]);

  const hotels = data?.hotels ?? [];
  const mobileNavLabel =
    buildPlatformDashboardNavItems(hotels.length).find((t) => t.id === activeTab)?.label ??
    "Hotels";

  const onToggleHotelActive = async (hotel: PlatformHotel) => {
    setTogglingHotelId(hotel.id);
    try {
      await updatePlatformHotel(hotel.id, { isActive: !hotel.isActive });
      toast.success(hotel.isActive ? "Hotel deactivated" : "Hotel activated");
      await queryClient.invalidateQueries({ queryKey: ["platform-hotels"] });
      await queryClient.invalidateQueries({ queryKey: ["platform-track"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setTogglingHotelId(null);
    }
  };

  const onSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await updatePlatformSettings({ verificationEmail: verificationEmail.trim() });
      await queryClient.invalidateQueries({ queryKey: ["platform-settings"] });
      toast.success("Verification email updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const onChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setChangingPassword(true);
    try {
      await changePlatformPassword(newPassword);
      toast.success("Password updated");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update password");
    } finally {
      setChangingPassword(false);
    }
  };

  const openManageFromTrack = (p: PlatformHotelTrack) => {
    const h = hotels.find((x) => x.id === p.id);
    setManageHotel(h ?? p);
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-zinc-50/60">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-zinc-50/60">
      <PlatformDashboardHeader
        email={user?.email ?? ""}
        activeTab={activeTab}
        hotelCount={hotels.length}
        onTabChange={setActiveTab}
        onLogout={logout}
      />

      <PlatformDashboardTabs active={activeTab} onChange={setActiveTab} hotelCount={hotels.length} />

      {isMobile && (
        <div className="border-b border-zinc-100/90 bg-white/80 px-4 py-2.5 md:hidden">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
            Section
          </p>
          <p className="font-serif text-base font-medium text-zinc-900">{mobileNavLabel}</p>
        </div>
      )}

      <main className="mx-auto max-w-2xl space-y-4 px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-1 md:pt-0 md:pb-10">
        {activeTab === "hotels" && (
          <section className="space-y-3">
            <div className="flex items-end justify-between gap-3 px-0.5">
              <div>
                <h2 className="font-serif text-base font-medium text-zinc-900">Properties</h2>
                <p className="mt-0.5 text-sm text-zinc-500">
                  {hotels.length} tenant{hotels.length === 1 ? "" : "s"}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                className="h-9 shrink-0 rounded-xl"
                onClick={() => setActiveTab("add-hotel")}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Add
              </Button>
            </div>
            <PlatformHotelsList
              hotels={hotels}
              loading={hotelsLoading}
              togglingHotelId={togglingHotelId}
              onEditHotel={(h) => {
                setManagePanel("default");
                setManageHotel(h);
              }}
              onEditManager={setManagerHotel}
              onDeactivate={(h) => void onToggleHotelActive(h)}
              onDelete={(h) => {
                setManagePanel("delete");
                setManageHotel(h);
              }}
              onAddHotel={() => setActiveTab("add-hotel")}
            />
          </section>
        )}

        {activeTab === "add-hotel" && (
          <PlatformAddHotelWizard onFinished={() => setActiveTab("hotels")} />
        )}

        {activeTab === "track" && (
          <section className="space-y-3">
            <div className="px-0.5">
              <h2 className="font-serif text-base font-medium text-zinc-900">Track</h2>
              <p className="mt-0.5 text-sm text-zinc-500">
                Registration, package, renewal, and usage per property.
              </p>
            </div>
            <PlatformHotelsTrack
              properties={trackData?.properties ?? []}
              loading={trackLoading}
              onManage={openManageFromTrack}
            />
          </section>
        )}

        {activeTab === "settings" && (
          <div className="space-y-4">
            <SectionCard
              title="Verification email"
              description="6-digit sign-in codes are sent here after password check (valid 3 minutes)."
            >
              {settingsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-zinc-300" />
                </div>
              ) : (
                <form onSubmit={onSaveSettings} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="verification-email">Email address</Label>
                    <Input
                      id="verification-email"
                      type="email"
                      value={verificationEmail}
                      onChange={(e) => setVerificationEmail(e.target.value)}
                      className="h-11 rounded-xl"
                      required
                    />
                  </div>
                  <Button type="submit" className="h-11 w-full rounded-xl" disabled={savingSettings}>
                    {savingSettings ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Save verification email"
                    )}
                  </Button>
                </form>
              )}
            </SectionCard>

            <SectionCard
              title="Password"
              description="You are already signed in — no current password required."
            >
            <form onSubmit={onChangePassword} className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="new-password">New password</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-lg px-2 text-xs text-zinc-600"
                    onClick={() => {
                      const p = generateTemporaryPassword();
                      setNewPassword(p);
                      setConfirmPassword(p);
                    }}
                  >
                    <RefreshCw className="mr-1 h-3.5 w-3.5" />
                    Generate
                  </Button>
                </div>
                <Input
                  id="new-password"
                  type="text"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-11 rounded-xl font-mono text-sm"
                  minLength={8}
                  required
                  spellCheck={false}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-password">Confirm password</Label>
                <Input
                  id="confirm-password"
                  type="text"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-11 rounded-xl font-mono text-sm"
                  minLength={8}
                  required
                  spellCheck={false}
                />
              </div>
              <Button
                type="submit"
                className="h-11 w-full rounded-xl shadow-sm shadow-zinc-900/10"
                disabled={changingPassword}
              >
                {changingPassword ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Save new password"
                )}
              </Button>
            </form>
            </SectionCard>
          </div>
        )}
      </main>

      <PlatformHotelManageSheet
        hotel={manageHotel}
        open={!!manageHotel}
        initialPanel={managePanel}
        onOpenChange={(open) => {
          if (!open) {
            setManageHotel(null);
            setManagePanel("default");
          }
        }}
      />

      <PlatformManagerEditSheet
        hotel={managerHotel}
        open={!!managerHotel}
        onOpenChange={(open) => !open && setManagerHotel(null)}
      />
    </div>
  );
}
