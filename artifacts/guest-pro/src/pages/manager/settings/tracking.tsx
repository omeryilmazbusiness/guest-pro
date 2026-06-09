import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useStaffLocale } from "@/hooks/use-staff-locale";
import { useTenantNav } from "@/hooks/use-tenant-nav";
import { can, Permission } from "@/lib/permissions";
import { ROUTES } from "@/lib/app-routes";
import {
  getTrackingConfig,
  saveTrackingConfig,
  addTrackingNetwork,
  deleteTrackingNetwork,
  getMyIp,
  type TrackingConfig,
  type TrackingNetwork,
  type MyIpResponse,
} from "@/lib/tracking";
import { SettingsShell } from "@/components/manager/settings/SettingsShell";
import {
  SettingsCategoryHeader,
  SettingsField,
  SettingsSectionCard,
} from "@/components/manager/settings/SettingsSectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  MapPin,
  Wifi,
  Trash2,
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Radio,
  Eye,
  Copy,
} from "lucide-react";
import { toast } from "sonner";

function NetworkRow({
  network,
  onDelete,
  disabled,
}: {
  network: TrackingNetwork;
  onDelete: (id: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-zinc-50 py-2.5 last:border-0">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-zinc-100 bg-zinc-50">
        <Wifi className="h-3.5 w-3.5 text-zinc-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-sm font-medium text-zinc-800">{network.ipOrCidr}</p>
        {network.label && (
          <p className="truncate text-[11px] text-zinc-400">{network.label}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDelete(network.id)}
        disabled={disabled}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-rose-50 hover:text-rose-500 disabled:opacity-40"
        aria-label="Remove network rule"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default function TrackingSettingsPage() {
  const navigate = useTenantNav();
  const { user } = useAuth();
  const { t } = useStaffLocale();

  useEffect(() => {
    if (user && !can(user.role, Permission.MANAGE_HOTEL)) {
      navigate(ROUTES.manager);
    }
  }, [user, navigate]);

  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<TrackingConfig | null>(null);
  const [networks, setNetworks] = useState<TrackingNetwork[]>([]);

  const [isEnabled, setIsEnabled] = useState(false);
  const [centerLat, setCenterLat] = useState("");
  const [centerLng, setCenterLng] = useState("");
  const [radiusMeters, setRadiusMeters] = useState("100");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [myIpData, setMyIpData] = useState<MyIpResponse | null>(null);
  const [myIpLoading, setMyIpLoading] = useState(false);

  const [newIpOrCidr, setNewIpOrCidr] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [addingNetwork, setAddingNetwork] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadConfig = useCallback(async () => {
    try {
      const data = await getTrackingConfig();
      setConfig(data.config);
      setNetworks(data.networks);
      if (data.config) {
        setIsEnabled(data.config.isEnabled);
        setCenterLat(String(data.config.centerLat));
        setCenterLng(String(data.config.centerLng));
        setRadiusMeters(String(data.config.radiusMeters));
        setNotes(data.config.notes ?? "");
      }
    } catch {
      toast.error("Failed to load tracking configuration.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  const loadMyIp = useCallback(async () => {
    setMyIpLoading(true);
    try {
      const data = await getMyIp();
      setMyIpData(data);
    } catch {
      toast.error("Failed to detect server-seen IP.");
    } finally {
      setMyIpLoading(false);
    }
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);

    const lat = parseFloat(centerLat);
    const lng = parseFloat(centerLng);
    const radius = parseInt(radiusMeters, 10);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setSaveError("Latitude must be between -90 and 90.");
      return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      setSaveError("Longitude must be between -180 and 180.");
      return;
    }
    if (isNaN(radius) || radius < 10 || radius > 50000) {
      setSaveError("Radius must be between 10 and 50 000 metres.");
      return;
    }

    setSaving(true);
    try {
      const saved = await saveTrackingConfig({
        isEnabled,
        centerLat: lat,
        centerLng: lng,
        radiusMeters: radius,
        notes,
      });
      setConfig(saved);
      toast.success("Tracking configuration saved.");
    } catch (err: unknown) {
      const msg =
        (err as { data?: { error?: string } })?.data?.error ??
        "Failed to save configuration.";
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleAddNetwork = async (e: React.FormEvent) => {
    e.preventDefault();
    setNetworkError(null);

    const trimmed = newIpOrCidr.trim();
    if (!trimmed) {
      setNetworkError("Please enter an IP address or CIDR range.");
      return;
    }

    setAddingNetwork(true);
    try {
      const network = await addTrackingNetwork({
        ipOrCidr: trimmed,
        label: newLabel.trim(),
      });
      setNetworks((prev) => [...prev, network]);
      setNewIpOrCidr("");
      setNewLabel("");
      toast.success("Network rule added.");
    } catch (err: unknown) {
      const msg =
        (err as { data?: { error?: string } })?.data?.error ??
        "Invalid IP address or CIDR range.";
      setNetworkError(msg);
    } finally {
      setAddingNetwork(false);
    }
  };

  const handleDeleteNetwork = async (id: number) => {
    setDeletingId(id);
    try {
      await deleteTrackingNetwork(id);
      setNetworks((prev) => prev.filter((n) => n.id !== id));
      toast.success("Network rule removed.");
    } catch {
      toast.error("Failed to remove network rule.");
    } finally {
      setDeletingId(null);
    }
  };

  if (!user || !can(user.role, Permission.MANAGE_HOTEL)) return null;

  return (
    <SettingsShell title={t.settingsCategoryTracking} backTo={ROUTES.managerSettings} wide>
      <div className="space-y-5">
        <SettingsCategoryHeader
          title={t.settingsCategoryTracking}
          description={t.settingsCategoryTrackingDesc}
        />

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-7 w-7 animate-spin text-zinc-300" />
          </div>
        ) : (
          <>
            <SettingsSectionCard
              icon={<Radio className="h-4 w-4 text-zinc-500" />}
              title="Active Tracking System"
              subtitle="Track guest presence using location and hotel network."
            >
              <form onSubmit={handleSaveConfig} className="space-y-5 pt-0">
                <div className="flex items-center justify-between gap-4 rounded-2xl bg-zinc-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-zinc-800">Tracking enabled</p>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      Guests will be prompted for location permission.
                    </p>
                  </div>
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={setIsEnabled}
                    aria-label="Enable tracking"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Hotel location
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <SettingsField label="Latitude" hint="e.g. 41.0082">
                      <Input
                        type="number"
                        step="any"
                        value={centerLat}
                        onChange={(e) => setCenterLat(e.target.value)}
                        placeholder="41.0082"
                        className="h-10 rounded-xl font-mono text-sm"
                      />
                    </SettingsField>
                    <SettingsField label="Longitude" hint="e.g. 28.9784">
                      <Input
                        type="number"
                        step="any"
                        value={centerLng}
                        onChange={(e) => setCenterLng(e.target.value)}
                        placeholder="28.9784"
                        className="h-10 rounded-xl font-mono text-sm"
                      />
                    </SettingsField>
                  </div>

                  <SettingsField
                    label="Radius (metres)"
                    hint="Guests within this radius are considered in-hotel. Default 100 m."
                  >
                    <Input
                      type="number"
                      step="1"
                      min="10"
                      max="50000"
                      value={radiusMeters}
                      onChange={(e) => setRadiusMeters(e.target.value)}
                      placeholder="100"
                      className="h-10 rounded-xl text-sm"
                    />
                  </SettingsField>
                </div>

                <SettingsField
                  label="Notes (optional)"
                  hint="Internal notes about this tracking configuration."
                >
                  <Input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Updated after ISP change — June 2025"
                    className="h-10 rounded-xl text-sm"
                  />
                </SettingsField>

                {saveError && (
                  <div className="flex items-start gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                    <span>{saveError}</span>
                  </div>
                )}

                {config && !saveError && (
                  <div className="flex items-center gap-2 text-xs text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Configuration saved</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={saving}
                  className="h-11 w-full rounded-2xl bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : config ? (
                    "Update configuration"
                  ) : (
                    "Save configuration"
                  )}
                </Button>
              </form>
            </SettingsSectionCard>

            <SettingsSectionCard
              icon={<Eye className="h-4 w-4 text-zinc-500" />}
              title="Your Current IP"
              subtitle="Find out what IP the server sees from your connection — useful when adding your hotel network."
            >
              {myIpData ? (
                <div className="space-y-3">
                  <div className="space-y-2 rounded-2xl bg-zinc-50 px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                        Server-seen IP
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(myIpData.sourceIp).then(() =>
                            toast.success("IP copied to clipboard"),
                          );
                        }}
                        className="flex h-6 w-6 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
                        aria-label="Copy IP"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="font-mono text-base font-semibold text-zinc-900">
                      {myIpData.sourceIp}
                    </p>
                  </div>
                  {myIpData.reqIps.length > 1 && (
                    <p className="text-[11px] leading-snug text-zinc-400">
                      All hops: {myIpData.reqIps.join(" → ")}
                    </p>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setNewIpOrCidr(myIpData.sourceIp);
                      toast.success("IP pre-filled in the Add Network form below.");
                    }}
                    className="h-9 w-full rounded-xl border-zinc-200 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    Use this IP in Allowed Networks
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  onClick={loadMyIp}
                  disabled={myIpLoading}
                  variant="outline"
                  className="h-10 w-full rounded-2xl border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
                >
                  {myIpLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Eye className="mr-1.5 h-4 w-4" />
                      Detect my IP
                    </>
                  )}
                </Button>
              )}
            </SettingsSectionCard>

            <SettingsSectionCard
              icon={<Wifi className="h-4 w-4 text-zinc-500" />}
              title="Allowed Hotel Networks"
              subtitle="Add the hotel's public IP addresses or CIDR ranges. Guests connecting from these IPs are identified as being on the hotel network."
            >
              {networks.length > 0 ? (
                <div className="-mx-1">
                  {networks.map((n) => (
                    <NetworkRow
                      key={n.id}
                      network={n}
                      onDelete={handleDeleteNetwork}
                      disabled={deletingId === n.id}
                    />
                  ))}
                </div>
              ) : (
                <p className="py-3 text-center text-xs text-zinc-400">
                  No network rules yet. Add your hotel's public IP below.
                </p>
              )}

              <form onSubmit={handleAddNetwork} className="space-y-3 pt-1">
                <div className="flex items-center gap-2">
                  <Plus className="h-3.5 w-3.5 text-zinc-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Add network rule
                  </span>
                </div>

                <SettingsField
                  label="IP address or CIDR"
                  hint="Single IP: 203.0.113.5   Range: 203.0.113.0/24"
                >
                  <Input
                    type="text"
                    value={newIpOrCidr}
                    onChange={(e) => setNewIpOrCidr(e.target.value)}
                    placeholder="203.0.113.5 or 203.0.113.0/24"
                    className="h-10 rounded-xl font-mono text-sm"
                    autoComplete="off"
                    spellCheck={false}
                  />
                </SettingsField>

                <SettingsField label="Label (optional)">
                  <Input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="e.g. Main hotel WiFi"
                    className="h-10 rounded-xl text-sm"
                  />
                </SettingsField>

                {networkError && (
                  <div className="flex items-start gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                    <span>{networkError}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={addingNetwork}
                  variant="outline"
                  className="h-10 w-full rounded-2xl border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
                >
                  {addingNetwork ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="mr-1.5 h-4 w-4" />
                      Add rule
                    </>
                  )}
                </Button>
              </form>
            </SettingsSectionCard>
          </>
        )}
      </div>
    </SettingsShell>
  );
}
