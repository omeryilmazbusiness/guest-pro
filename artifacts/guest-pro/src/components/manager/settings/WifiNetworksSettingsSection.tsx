import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Wifi } from "lucide-react";
import { toast } from "sonner";
import { listWifiNetworks, saveWifiNetworks } from "@/lib/hotel-wifi";
import { notifyHotelSetupChanged } from "@/lib/hotel-setup-events";
import { useStaffLocale } from "@/hooks/use-staff-locale";
import { tStaff } from "@/lib/staff-i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CollapsibleSettingsPanel } from "@/components/manager/settings/CollapsibleSettingsPanel";
import { SectionSaveBar } from "@/components/manager/settings/SectionSaveBar";
import { SettingsField } from "@/components/manager/settings/SettingsSectionCard";
import { validateWifiRow } from "@/lib/setup-section-validation";

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

  const handleSave = async (): Promise<boolean> => {
    const payload: Array<{
      id?: number;
      name: string;
      password: string;
      sortOrder: number;
    }> = [];
    let hasAnyInput = false;

    for (const [i, n] of networks.entries()) {
      const state = validateWifiRow(n.name, n.password);
      if (state === "empty") continue;

      hasAnyInput = true;
      const row = String(i + 1);

      if (state === "partial") {
        toast.error(
          n.name.trim()
            ? tStaff(t.settingsWifiPasswordRequired, { n: row })
            : tStaff(t.settingsWifiNameRequired, { n: row }),
        );
        return false;
      }

      payload.push({
        ...(n.id ? { id: n.id } : {}),
        name: n.name.trim(),
        password: n.password.trim(),
        sortOrder: i,
      });
    }

    if (!hasAnyInput || payload.length === 0) {
      toast.error(t.settingsWifiNetworkRequired);
      return false;
    }

    setSaving(true);
    try {
      await saveWifiNetworks(payload);
      notifyHotelSetupChanged();
      toast.success(t.settingsWifiNetworksSaved);
      await load();
      return true;
    } catch (err: unknown) {
      const msg =
        (err as { data?: { error?: string } })?.data?.error ?? t.settingsWifiNetworksSaveFailed;
      toast.error(msg);
      return false;
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-300" />
      </div>
    );
  }

  return (
    <CollapsibleSettingsPanel
      id="setup-wifi"
      icon={<Wifi className="h-4 w-4" />}
      title={t.settingsWifiNetworksTitle}
      subtitle={t.settingsWifiNetworksSubtitle}
      footer={
        <SectionSaveBar
          label={t.assistantSectionSave}
          homeLabel={t.assistantSectionHome}
          saving={saving}
          onSave={() => void handleSave()}
          onHome={() => handleSave()}
        />
      }
    >
      <p className="text-[11px] leading-relaxed text-zinc-500">{t.settingsWifiNetworksHint}</p>

      <div className="mt-3 space-y-2">
        {networks.map((network, index) => (
          <div key={network.localId} className="rounded-lg border border-zinc-100 bg-zinc-50/40 p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-zinc-700">
                {tStaff(t.settingsWifiNetworkRow, { n: String(index + 1) })}
              </span>
              <button
                type="button"
                onClick={() => removeNetwork(network.localId)}
                className="text-zinc-400 hover:text-rose-500"
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
                className="h-8 rounded-lg text-sm font-mono"
              />
            </SettingsField>
            <SettingsField label={t.settingsWifiPassword}>
              <Input
                type="text"
                value={network.password}
                onChange={(e) => updateNetwork(network.localId, { password: e.target.value })}
                className="h-8 rounded-lg text-sm font-mono"
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
        className="mt-3 h-8 w-full rounded-lg border-dashed border-zinc-200 text-[12px] text-zinc-600"
      >
        <Plus className="mr-1 h-3.5 w-3.5" />
        {t.settingsAddWifiNetwork}
      </Button>
    </CollapsibleSettingsPanel>
  );
}
