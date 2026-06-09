import { useCallback, useEffect, useState } from "react";
import { Building2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { fetchHotelNearbyAnchor, saveHotelNearbyAnchor } from "@/lib/nearby-settings";
import { useStaffLocale } from "@/hooks/use-staff-locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SettingsSectionCard, SettingsField } from "@/components/manager/settings/SettingsSectionCard";

export function NearbyHotelLocationSection() {
  const { t } = useStaffLocale();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hotelLabel, setHotelLabel] = useState("");
  const [hotelLat, setHotelLat] = useState("");
  const [hotelLng, setHotelLng] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const anchor = await fetchHotelNearbyAnchor();
      if (anchor) {
        setHotelLabel(anchor.label ?? "");
        setHotelLat(String(anchor.lat));
        setHotelLng(String(anchor.lng));
      }
    } catch {
      toast.error(t.settingsHotelLocationLoadFailed);
    } finally {
      setLoading(false);
    }
  }, [t.settingsHotelLocationLoadFailed]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(hotelLat);
    const lng = parseFloat(hotelLng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      toast.error(t.settingsNearbyInvalidCoords);
      return;
    }

    setSaving(true);
    try {
      await saveHotelNearbyAnchor({
        hotelLat: lat,
        hotelLng: lng,
        hotelLabel: hotelLabel.trim() || null,
      });
      toast.success(t.settingsHotelLocationSaved);
    } catch (err: unknown) {
      const msg =
        (err as { data?: { error?: string } })?.data?.error ?? t.settingsHotelLocationSaveFailed;
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
      icon={<Building2 className="h-4 w-4 text-violet-600" />}
      title={t.settingsHotelLocationTitle}
      subtitle={t.settingsHotelLocationSubtitle}
    >
      <form onSubmit={handleSave} className="space-y-4">
        <p className="rounded-xl border border-violet-100 bg-violet-50/50 px-3 py-2.5 text-[11px] leading-relaxed text-zinc-600">
          {t.settingsHotelLocationHint}
        </p>

        <SettingsField label={t.settingsHotelLocationLabel} hint={t.optionalLabel}>
          <Input
            value={hotelLabel}
            onChange={(e) => setHotelLabel(e.target.value)}
            placeholder={t.settingsHotelLocationLabelPlaceholder}
            className="h-10 rounded-xl text-sm"
          />
        </SettingsField>

        <div className="grid grid-cols-2 gap-3">
          <SettingsField label={t.settingsNearbyLat} hint={t.settingsNearbyCoordsHint}>
            <Input
              value={hotelLat}
              onChange={(e) => setHotelLat(e.target.value)}
              placeholder="41.0082"
              className="h-10 rounded-xl font-mono text-sm"
              inputMode="decimal"
            />
          </SettingsField>
          <SettingsField label={t.settingsNearbyLng} hint={t.settingsNearbyCoordsHint}>
            <Input
              value={hotelLng}
              onChange={(e) => setHotelLng(e.target.value)}
              placeholder="28.9784"
              className="h-10 rounded-xl font-mono text-sm"
              inputMode="decimal"
            />
          </SettingsField>
        </div>

        <Button
          type="submit"
          disabled={saving}
          className="h-11 w-full rounded-2xl bg-zinc-900 text-white hover:bg-zinc-800"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t.settingsHotelLocationSave}
        </Button>
      </form>
    </SettingsSectionCard>
  );
}
