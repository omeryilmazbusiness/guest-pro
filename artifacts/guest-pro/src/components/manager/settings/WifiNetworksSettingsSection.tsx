import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Wifi } from "lucide-react";
import { toast } from "sonner";
import { listWifiNetworks, saveWifiNetworks } from "@/lib/hotel-wifi";
import { useStaffLocale } from "@/hooks/use-staff-locale";
import { tStaff } from "@/lib/staff-i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SettingsSectionCard, SettingsField } from "@/components/manager/settings/SettingsSectionCard";

interface NetworkDraft {
  localId: string;
  id?: number;
  name: string;
  password: string;
}

function emptyNetwork(): NetworkDraft {
  return {
    localId: crypto.randomUUID(),
    name: "",
    password: "",
  };
}

export function WifiNetworksSettingsSection() {
  const { t } = useStaffLocale();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [networks, setNetworks] = useState<NetworkDraft[]>([emptyNetwork()]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await listWifiNetworks();
      setNetworks(
        rows.length > 0
          ? rows.map((r) => ({
              localId: String(r.id),
              id: r.id,
              name: r.name,
              password: r.wifiPassword,
            }))
          : [emptyNetwork()],
      );
    } catch {
      toast.error(t.settingsWifiNetworksLoadFailed);
    } finally {
      setLoading(false);
    }
  }, [t.settingsWifiNetworksLoadFailed]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateNetwork = (localId: string, patch: Partial<NetworkDraft>) => {
    setNetworks((prev) => prev.map((n) => (n.localId === localId ? { ...n, ...patch } : n)));
  };

  const removeNetwork = (localId: string) => {
    setNetworks((prev) =>
      prev.length <= 1 ? [emptyNetwork()] : prev.filter((n) => n.localId !== localId),
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = networks
      .filter((n) => n.name.trim() && n.password.trim())
      .map((n, i) => ({
        ...(n.id ? { id: n.id } : {}),
        name: n.name.trim(),
        password: n.password,
        sortOrder: i,
      }));

    setSaving(true);
    try {
      await saveWifiNetworks(payload);
      toast.success(t.settingsWifiNetworksSaved);
      await load();
    } catch (err: unknown) {
      const msg =
        (err as { data?: { error?: string } })?.data?.error ?? t.settingsWifiNetworksSaveFailed;
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-7 w-7 animate-spin text-zinc-300" />
      </div>
    );
  }

  return (
    <SettingsSectionCard
      icon={<Wifi className="w-4 h-4 text-amber-600" />}
      title={t.settingsWifiNetworksTitle}
      subtitle={t.settingsWifiNetworksSubtitle}
    >
      <form onSubmit={handleSave} className="space-y-4">
        <p className="text-[11px] text-zinc-500 leading-relaxed rounded-xl bg-zinc-50 border border-zinc-100 px-3 py-2.5">
          {t.settingsWifiNetworksHint}
        </p>

        <div className="space-y-3">
          {networks.map((network, index) => (
            <div
              key={network.localId}
              className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-4 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-zinc-700">
                  <Wifi className="h-4 w-4 text-zinc-400" />
                  <span className="text-xs font-semibold">
                    {tStaff(t.settingsWifiNetworkRow, { n: String(index + 1) })}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeNetwork(network.localId)}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                  aria-label={t.settingsRemoveWifiNetwork}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <SettingsField label={t.settingsWifiName}>
                <Input
                  value={network.name}
                  onChange={(e) => updateNetwork(network.localId, { name: e.target.value })}
                  placeholder="Hotel-Guest"
                  className="h-10 rounded-xl text-sm font-mono"
                />
              </SettingsField>

              <SettingsField label={t.settingsWifiPassword}>
                <Input
                  type="text"
                  value={network.password}
                  onChange={(e) => updateNetwork(network.localId, { password: e.target.value })}
                  placeholder="••••••••"
                  className="h-10 rounded-xl text-sm font-mono"
                  autoComplete="off"
                />
              </SettingsField>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => setNetworks((prev) => [...prev, emptyNetwork()])}
          className="w-full h-10 rounded-2xl border-dashed border-zinc-200 text-zinc-600 hover:bg-zinc-50"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          {t.settingsAddWifiNetwork}
        </Button>

        <Button
          type="submit"
          disabled={saving}
          className="w-full h-11 rounded-2xl bg-zinc-900 text-white hover:bg-zinc-800"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t.settingsSaveWifiNetworks}
        </Button>
      </form>
    </SettingsSectionCard>
  );
}
