import { useCallback, useEffect, useState } from "react";
import { Loader2, MapPin, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { listNearbyPlaces, saveNearbyPlaces, type NearbyPlaceType } from "@/lib/nearby-places";
import { notifyHotelSetupChanged } from "@/lib/hotel-setup-events";
import { fetchHotelNearbyAnchor } from "@/lib/nearby-settings";
import {
  parseCoordinateInput,
  normalizePlaceCoords,
  isWithinHotelRadius,
} from "@/lib/nearby/coords";
import { NEARBY_TYPE_ORDER } from "@/lib/welcoming/nearby-place-meta";
import { validateNearbyRow } from "@/lib/setup-section-validation";
import { useStaffLocale } from "@/hooks/use-staff-locale";
import { tStaff } from "@/lib/staff-i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CollapsibleSettingsPanel } from "@/components/manager/settings/CollapsibleSettingsPanel";
import { SectionSaveBar } from "@/components/manager/settings/SectionSaveBar";
import { SettingsField } from "@/components/manager/settings/SettingsSectionCard";

interface PlaceDraft {
  localId: string;
  name: string;
  address: string;
  type: NearbyPlaceType;
  description: string;
  lat: string;
  lng: string;
}

function emptyPlace(): PlaceDraft {
  return {
    localId: crypto.randomUUID(),
    name: "",
    address: "",
    type: "market",
    description: "",
    lat: "",
    lng: "",
  };
}

const TYPE_LABELS: Record<NearbyPlaceType, string> = {
  market: "Market / Supermarket",
  pharmacy: "Pharmacy",
  bazaar: "Bazaar / Shopping area",
  mall: "Shopping mall",
  restaurant: "Restaurant",
  other: "Other",
};

export function NearbyPlacesSettingsSection() {
  const { t } = useStaffLocale();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [places, setPlaces] = useState<PlaceDraft[]>([emptyPlace()]);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await listNearbyPlaces();
      setPlaces(
        rows.length > 0
          ? rows.map((r) => ({
              localId: String(r.id),
              name: r.name,
              address: r.address ?? "",
              type: r.type,
              description: r.description ?? "",
              lat: String(r.lat),
              lng: String(r.lng),
            }))
          : [emptyPlace()],
      );
    } catch {
      toast.error(t.settingsNearbyLoadFailed);
    } finally {
      setLoading(false);
    }
  }, [t.settingsNearbyLoadFailed]);

  useEffect(() => {
    void load();
  }, [load]);

  const updatePlace = (localId: string, patch: Partial<PlaceDraft>) => {
    setPlaces((prev) => prev.map((p) => (p.localId === localId ? { ...p, ...patch } : p)));
  };

  const removePlace = (localId: string) => {
    setPlaces((prev) => (prev.length <= 1 ? [emptyPlace()] : prev.filter((p) => p.localId !== localId)));
  };

  const handleSave = async (): Promise<boolean> => {
    const payload: Array<{
      name: string;
      address?: string | null;
      type: NearbyPlaceType;
      description?: string | null;
      lat: number;
      lng: number;
      sortOrder: number;
    }> = [];

    let hotelAnchor: { lat: number; lng: number } | null = null;
    try {
      hotelAnchor = await fetchHotelNearbyAnchor();
    } catch {
      // Save still allowed; server validates when anchor exists.
    }

    let swappedAny = false;
    let hasAnyInput = false;

    for (const [i, p] of places.entries()) {
      const state = validateNearbyRow(p.name, p.lat, p.lng, p.address, p.description);
      if (state === "empty") continue;

      hasAnyInput = true;
      const row = String(i + 1);

      if (state === "partial-name") {
        toast.error(tStaff(t.settingsNearbyNameRequired, { n: row }));
        return false;
      }
      if (state === "partial-coords" || state === "invalid-coords") {
        toast.error(tStaff(t.settingsNearbyCoordsRequired, { n: row }));
        return false;
      }

      const parsed = parseCoordinateInput(p.lat, p.lng);
      if (!parsed) {
        toast.error(tStaff(t.settingsNearbyCoordsRequired, { n: row }));
        return false;
      }

      const { coords, swapped } = normalizePlaceCoords(parsed.lat, parsed.lng, hotelAnchor);
      if (swapped) swappedAny = true;

      if (hotelAnchor && !isWithinHotelRadius(coords, hotelAnchor)) {
        toast.error(t.settingsNearbyTooFarFromHotel);
        return false;
      }

      payload.push({
        name: p.name.trim(),
        address: p.address.trim() || null,
        type: p.type,
        description: p.description.trim() || null,
        lat: coords.lat,
        lng: coords.lng,
        sortOrder: i,
      });
    }

    if (!hasAnyInput || payload.length === 0) {
      toast.error(t.settingsNearbyPlaceRequired);
      return false;
    }

    setSaving(true);
    try {
      await saveNearbyPlaces(payload);
      if (swappedAny) {
        toast.info(t.settingsNearbyCoordsSwapped);
      }
      notifyHotelSetupChanged();
      toast.success(t.settingsNearbySaved);
      await load();
      return true;
    } catch (err: unknown) {
      const msg =
        (err as { data?: { error?: string } })?.data?.error ?? t.settingsNearbySaveFailed;
      toast.error(msg);
      return false;
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
    <CollapsibleSettingsPanel
      id="setup-nearby"
      icon={<MapPin className="h-4 w-4" />}
      title={t.settingsNearbyTitle}
      subtitle={t.settingsNearbySubtitle}
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
      <p className="text-[11px] leading-relaxed text-zinc-500">{t.settingsNearbyHint}</p>
      <div className="mt-3 space-y-3">

          {places.map((place, index) => (
            <div
              key={place.localId}
              className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-4 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-zinc-700">
                  <MapPin className="h-4 w-4 text-zinc-400" />
                  <span className="text-xs font-semibold">
                    {tStaff(t.settingsNearbyRow, { n: String(index + 1) })}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removePlace(place.localId)}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                  aria-label={t.settingsNearbyRemove}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <SettingsField label={t.settingsNearbyName}>
                <Input
                  value={place.name}
                  onChange={(e) => updatePlace(place.localId, { name: e.target.value })}
                  placeholder={t.settingsNearbyNamePlaceholder}
                  className="h-10 rounded-xl text-sm"
                />
              </SettingsField>

              <SettingsField label={t.settingsNearbyType}>
                <select
                  value={place.type}
                  onChange={(e) =>
                    updatePlace(place.localId, { type: e.target.value as NearbyPlaceType })
                  }
                  className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                >
                  {NEARBY_TYPE_ORDER.map((type) => (
                    <option key={type} value={type}>
                      {TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </SettingsField>

              <SettingsField label={t.settingsNearbyAddress}>
                <Input
                  value={place.address}
                  onChange={(e) => updatePlace(place.localId, { address: e.target.value })}
                  placeholder={t.settingsNearbyAddressPlaceholder}
                  className="h-10 rounded-xl text-sm"
                />
              </SettingsField>

              <SettingsField label={t.settingsNearbyDescription} hint={t.optionalLabel}>
                <Input
                  value={place.description}
                  onChange={(e) => updatePlace(place.localId, { description: e.target.value })}
                  placeholder={t.settingsNearbyDescriptionPlaceholder}
                  className="h-10 rounded-xl text-sm"
                />
              </SettingsField>

              <div className="grid grid-cols-2 gap-3">
                <SettingsField label={t.settingsNearbyLat} hint={t.settingsNearbyCoordsHint}>
                  <Input
                    value={place.lat}
                    onChange={(e) => updatePlace(place.localId, { lat: e.target.value })}
                    onBlur={(e) => {
                      const parsed = parseCoordinateInput(e.target.value, place.lng);
                      if (parsed && e.target.value.includes(",")) {
                        updatePlace(place.localId, {
                          lat: String(parsed.lat),
                          lng: String(parsed.lng),
                        });
                      }
                    }}
                    placeholder="41.0082"
                    className="h-10 rounded-xl font-mono text-sm"
                    inputMode="decimal"
                  />
                </SettingsField>
                <SettingsField label={t.settingsNearbyLng} hint={t.settingsNearbyCoordsHint}>
                  <Input
                    value={place.lng}
                    onChange={(e) => updatePlace(place.localId, { lng: e.target.value })}
                    onBlur={(e) => {
                      const parsed = parseCoordinateInput(place.lat, e.target.value);
                      if (parsed && e.target.value.includes(",")) {
                        updatePlace(place.localId, {
                          lat: String(parsed.lat),
                          lng: String(parsed.lng),
                        });
                      }
                    }}
                    placeholder="28.9784"
                    className="h-10 rounded-xl font-mono text-sm"
                    inputMode="decimal"
                  />
                </SettingsField>
              </div>
            </div>
          ))}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={() => setPlaces((prev) => [...prev, emptyPlace()])}
        className="mt-3 h-8 w-full rounded-lg border-dashed border-zinc-200 text-[12px] text-zinc-600"
      >
        <Plus className="mr-1 h-3.5 w-3.5" />
        {t.settingsNearbyAdd}
      </Button>
    </CollapsibleSettingsPanel>
  );
}
