import { useCallback, useEffect, useState } from "react";
import { Building2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { fetchHotelNearbyAnchor, saveHotelNearbyAnchor } from "@/lib/nearby-settings";
import { notifyHotelSetupChanged } from "@/lib/hotel-setup-events";
import { useStaffLocale } from "@/hooks/use-staff-locale";
import { Input } from "@/components/ui/input";
import { CollapsibleSettingsPanel } from "@/components/manager/settings/CollapsibleSettingsPanel";
import { SectionSaveBar } from "@/components/manager/settings/SectionSaveBar";
import { SettingsField } from "@/components/manager/settings/SettingsSectionCard";

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

  const handleSave = async (): Promise<boolean> => {
    const lat = parseFloat(hotelLat);
    const lng = parseFloat(hotelLng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      toast.error(t.settingsNearbyInvalidCoords);
      return false;
    }

    setSaving(true);
    try {
      await saveHotelNearbyAnchor({
        hotelLat: lat,
        hotelLng: lng,
        hotelLabel: hotelLabel.trim() || null,
      });
      notifyHotelSetupChanged();
      toast.success(t.settingsHotelLocationSaved);
      return true;
    } catch (err: unknown) {
      const msg =
        (err as { data?: { error?: string } })?.data?.error ?? t.settingsHotelLocationSaveFailed;
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
      id="setup-map"
      icon={<Building2 className="h-4 w-4" />}
      title={t.settingsHotelLocationTitle}
      subtitle={t.settingsHotelLocationSubtitle}
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
      <p className="text-[11px] leading-relaxed text-zinc-500">{t.settingsHotelLocationHint}</p>

      <div className="mt-3 space-y-3">
        <SettingsField label={t.settingsHotelLocationLabel} hint={t.optionalLabel}>
          <Input
            value={hotelLabel}
            onChange={(e) => setHotelLabel(e.target.value)}
            placeholder={t.settingsHotelLocationLabelPlaceholder}
            className="h-8 rounded-lg text-sm"
          />
        </SettingsField>

        <div className="grid grid-cols-2 gap-3">
          <SettingsField label={t.settingsNearbyLat} hint={t.settingsNearbyCoordsHint}>
            <Input
              value={hotelLat}
              onChange={(e) => setHotelLat(e.target.value)}
              placeholder="41.0082"
              className="h-8 rounded-lg font-mono text-sm"
              inputMode="decimal"
            />
          </SettingsField>
          <SettingsField label={t.settingsNearbyLng} hint={t.settingsNearbyCoordsHint}>
            <Input
              value={hotelLng}
              onChange={(e) => setHotelLng(e.target.value)}
              placeholder="28.9784"
              className="h-8 rounded-lg font-mono text-sm"
              inputMode="decimal"
            />
          </SettingsField>
        </div>
      </div>
    </CollapsibleSettingsPanel>
  );
}
