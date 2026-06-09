import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Wifi, Layers } from "lucide-react";
import { toast } from "sonner";
import { listFloorWifi, saveFloorWifi } from "@/lib/floor-wifi";
import { useStaffLocale } from "@/hooks/use-staff-locale";
import { tStaff } from "@/lib/staff-i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SettingsSectionCard, SettingsField } from "@/components/manager/settings/SettingsSectionCard";

interface FloorDraft {
  localId: string;
  floorKey: string;
  floorLabel: string;
  wifiPassword: string;
  wifiSsid: string;
}

function emptyFloor(): FloorDraft {
  return {
    localId: crypto.randomUUID(),
    floorKey: "",
    floorLabel: "",
    wifiPassword: "",
    wifiSsid: "",
  };
}

export function FloorWifiSettingsSection() {
  const { t } = useStaffLocale();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [floors, setFloors] = useState<FloorDraft[]>([emptyFloor()]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await listFloorWifi();
      setFloors(
        rows.length > 0
          ? rows.map((r) => ({
              localId: String(r.id),
              floorKey: r.floorKey,
              floorLabel: r.floorLabel,
              wifiPassword: r.wifiPassword,
              wifiSsid: r.wifiSsid ?? "",
            }))
          : [emptyFloor()],
      );
    } catch {
      toast.error(t.settingsFloorWifiLoadFailed);
    } finally {
      setLoading(false);
    }
  }, [t.settingsFloorWifiLoadFailed]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateFloor = (localId: string, patch: Partial<FloorDraft>) => {
    setFloors((prev) => prev.map((f) => (f.localId === localId ? { ...f, ...patch } : f)));
  };

  const removeFloor = (localId: string) => {
    setFloors((prev) => (prev.length <= 1 ? [emptyFloor()] : prev.filter((f) => f.localId !== localId)));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = floors
      .filter((f) => f.floorKey.trim() && f.floorLabel.trim() && f.wifiPassword.trim())
      .map((f, i) => ({
        floorKey: f.floorKey.trim(),
        floorLabel: f.floorLabel.trim(),
        wifiPassword: f.wifiPassword,
        wifiSsid: f.wifiSsid.trim() || null,
        sortOrder: i,
      }));

    setSaving(true);
    try {
      await saveFloorWifi(payload);
      toast.success(t.settingsFloorWifiSaved);
      await load();
    } catch (err: unknown) {
      const msg =
        (err as { data?: { error?: string } })?.data?.error ?? t.settingsFloorWifiSaveFailed;
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
      title={t.settingsFloorWifiTitle}
      subtitle={t.settingsFloorWifiSubtitle}
    >
      <form onSubmit={handleSave} className="space-y-4">
        <p className="text-[11px] text-zinc-500 leading-relaxed rounded-xl bg-zinc-50 border border-zinc-100 px-3 py-2.5">
          {t.settingsFloorWifiHint}
        </p>

        <div className="space-y-3">
          {floors.map((floor, index) => (
            <div
              key={floor.localId}
              className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-4 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-zinc-700">
                  <Layers className="h-4 w-4 text-zinc-400" />
                  <span className="text-xs font-semibold">
                    {tStaff(t.settingsFloorRow, { n: String(index + 1) })}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFloor(floor.localId)}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                  aria-label={t.settingsRemoveFloor}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <SettingsField label={t.settingsFloorKey} hint={t.settingsFloorKeyHint}>
                  <Input
                    value={floor.floorKey}
                    onChange={(e) => updateFloor(floor.localId, { floorKey: e.target.value })}
                    placeholder="3"
                    className="h-10 rounded-xl font-mono text-sm"
                  />
                </SettingsField>
                <SettingsField label={t.settingsFloorLabel}>
                  <Input
                    value={floor.floorLabel}
                    onChange={(e) => updateFloor(floor.localId, { floorLabel: e.target.value })}
                    placeholder={t.settingsFloorLabelPlaceholder}
                    className="h-10 rounded-xl text-sm"
                  />
                </SettingsField>
              </div>

              <SettingsField label={t.settingsWifiSsid} hint={t.optionalLabel}>
                <Input
                  value={floor.wifiSsid}
                  onChange={(e) => updateFloor(floor.localId, { wifiSsid: e.target.value })}
                  placeholder="Hotel-Guest-3"
                  className="h-10 rounded-xl text-sm font-mono"
                />
              </SettingsField>

              <SettingsField label={t.settingsWifiPassword}>
                <Input
                  type="text"
                  value={floor.wifiPassword}
                  onChange={(e) => updateFloor(floor.localId, { wifiPassword: e.target.value })}
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
          onClick={() => setFloors((prev) => [...prev, emptyFloor()])}
          className="w-full h-10 rounded-2xl border-dashed border-zinc-200 text-zinc-600 hover:bg-zinc-50"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          {t.settingsAddFloor}
        </Button>

        <Button
          type="submit"
          disabled={saving}
          className="w-full h-11 rounded-2xl bg-zinc-900 text-white hover:bg-zinc-800"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t.settingsSaveFloors}
        </Button>
      </form>
    </SettingsSectionCard>
  );
}
