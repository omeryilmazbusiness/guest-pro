import { useCallback, useEffect, useState } from "react";
import {
  Bot,
  Building2,
  Car,
  ChevronDown,
  Loader2,
  Scissors,
  Shirt,
  Sparkles,
  Waves,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useStaffLocale } from "@/hooks/use-staff-locale";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SettingsSectionCard, SettingsField } from "@/components/manager/settings/SettingsSectionCard";
import { CityCountryPicker } from "@/components/manager/settings/CityCountryPicker";
import { SectionSaveBar } from "@/components/manager/settings/SectionSaveBar";
import { resolveCitySelection } from "@/lib/hotel-cities";
import { ABOUT_HOTEL_MIN_CHARS } from "@/lib/hotel-setup";
import { validateEnabledServiceFields, validateFacilities } from "@/lib/setup-section-validation";
import { notifyHotelSetupChanged } from "@/lib/hotel-setup-events";
import {
  ASSISTANT_SECTION_IDS,
  fetchAssistantConfig,
  saveAssistantConfig,
  type AmenityCatalogItem,
  type AssistantConfigPatch,
  type HotelAmenityConfig,
  type HotelAssistantConfig,
} from "@/lib/hotel-assistant-config";

type SaveKey = "about" | "facilities" | "taxi" | "spa" | "salon" | "laundry";

function AmenityRow({
  catalog,
  value,
  onChange,
  labels,
}: {
  catalog: AmenityCatalogItem;
  value: HotelAmenityConfig;
  onChange: (next: HotelAmenityConfig) => void;
  labels: {
    addDetail: string;
    hideDetail: string;
    open: string;
    close: string;
    phone: string;
    notes: string;
  };
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  return (
    <div className="rounded-lg border border-zinc-100 bg-zinc-50/40 px-3 py-2.5">
      <div className="flex items-center gap-3">
        <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            checked={value.enabled}
            onChange={(e) => {
              const enabled = e.target.checked;
              onChange({ ...value, enabled });
              if (!enabled) setDetailsOpen(false);
            }}
            className="h-3.5 w-3.5 shrink-0 rounded border-zinc-300"
          />
          <span className="text-[13px] font-medium text-zinc-900">{catalog.label}</span>
        </label>
        {value.enabled && (
          <button
            type="button"
            onClick={() => setDetailsOpen((v) => !v)}
            className="shrink-0 text-[11px] font-medium text-zinc-500 hover:text-zinc-800"
          >
            {detailsOpen ? labels.hideDetail : labels.addDetail}
          </button>
        )}
      </div>
      {value.enabled && detailsOpen && (
        <div className="mt-2.5 grid gap-2.5 border-t border-zinc-100 pt-2.5 sm:grid-cols-2">
          <SettingsField label={labels.open}>
            <Input value={value.openTime ?? ""} onChange={(e) => onChange({ ...value, openTime: e.target.value })} placeholder="09:00" className="h-8 text-sm" />
          </SettingsField>
          <SettingsField label={labels.close}>
            <Input value={value.closeTime ?? ""} onChange={(e) => onChange({ ...value, closeTime: e.target.value })} placeholder="22:00" className="h-8 text-sm" />
          </SettingsField>
          <SettingsField label={labels.phone} className="sm:col-span-2">
            <Input value={value.reservationPhone ?? ""} onChange={(e) => onChange({ ...value, reservationPhone: e.target.value })} placeholder="+90 …" className="h-8 text-sm" />
          </SettingsField>
          <SettingsField label={labels.notes} className="sm:col-span-2">
            <Textarea value={value.notes ?? ""} onChange={(e) => onChange({ ...value, notes: e.target.value })} rows={2} className="resize-none text-sm" />
          </SettingsField>
        </div>
      )}
    </div>
  );
}

function ServiceSection({
  id,
  icon,
  title,
  subtitle,
  enabled,
  onEnabledChange,
  children,
  saving,
  saveLabel,
  homeLabel,
  onSave,
  onHome,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  enabled: boolean;
  onEnabledChange: (v: boolean) => void;
  children: React.ReactNode;
  saving: boolean;
  saveLabel: string;
  homeLabel: string;
  onSave: () => void | Promise<void>;
  onHome?: () => void | Promise<boolean | void>;
}) {
  return (
    <div
      id={id}
      className={cn(
        "scroll-mt-24 rounded-2xl border transition-colors",
        enabled ? "border-zinc-200 bg-white" : "border-zinc-100 bg-zinc-50/50",
      )}
    >
      <label className="flex cursor-pointer items-start gap-3 px-4 py-3">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onEnabledChange(e.target.checked)}
          className="mt-1 h-3.5 w-3.5 shrink-0 rounded border-zinc-300"
        />
        <div className={cn("min-w-0 flex-1", !enabled && "opacity-50")}>
          <div className="flex items-center gap-2">
            <span className="text-zinc-500">{icon}</span>
            <p className="text-[13px] font-semibold text-zinc-900">{title}</p>
          </div>
          <p className="mt-0.5 text-[11px] leading-snug text-zinc-500">{subtitle}</p>
        </div>
        <ChevronDown className={cn("mt-1 h-4 w-4 shrink-0 text-zinc-400 transition-transform", enabled && "rotate-180")} />
      </label>
      {enabled && (
        <div className="border-t border-zinc-100 px-4 pb-4 pt-3">
          {children}
          <SectionSaveBar label={saveLabel} homeLabel={homeLabel} saving={saving} onSave={onSave} onHome={onHome} />
        </div>
      )}
    </div>
  );
}

export function AiAssistantSettingsSection() {
  const { t } = useStaffLocale();
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<SaveKey | null>(null);
  const [config, setConfig] = useState<HotelAssistantConfig | null>(null);
  const [catalog, setCatalog] = useState<AmenityCatalogItem[]>([]);
  const [countryCode, setCountryCode] = useState("TR");
  const [cityName, setCityName] = useState("");
  const [taxiOn, setTaxiOn] = useState(false);
  const [spaOn, setSpaOn] = useState(false);
  const [salonOn, setSalonOn] = useState(false);
  const [laundryOn, setLaundryOn] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAssistantConfig();
      setConfig(data.config);
      setCatalog(data.amenityCatalog);
      const city = resolveCitySelection(data.config.cityName, data.config.countryCode);
      setCountryCode(city.countryCode);
      setCityName(city.cityName);
    } catch {
      toast.error(t.assistantConfigLoadFailed);
    } finally {
      setLoading(false);
    }
  }, [t.assistantConfigLoadFailed]);

  useEffect(() => {
    void load();
  }, [load]);

  const persist = async (key: SaveKey, patch: AssistantConfigPatch): Promise<boolean> => {
    setSavingKey(key);
    try {
      const data = await saveAssistantConfig(patch);
      setConfig(data.config);
      notifyHotelSetupChanged();
      toast.success(t.assistantSectionSaved);
      return true;
    } catch {
      toast.error(t.assistantConfigSaveFailed);
      return false;
    } finally {
      setSavingKey(null);
    }
  };

  const saveAbout = async (): Promise<boolean> => {
    if (!config) return false;
    const trimmed = config.aboutHotel.trim();
    if (trimmed.length < ABOUT_HOTEL_MIN_CHARS) {
      toast.error(t.assistantAboutTooShort.replace("{min}", String(ABOUT_HOTEL_MIN_CHARS)));
      return false;
    }
    return persist("about", {
      aboutHotel: config.aboutHotel,
      cityName: cityName.trim() || null,
      countryCode: countryCode.trim().toUpperCase() || null,
    });
  };

  const saveFacilities = async (): Promise<boolean> => {
    if (!config) return false;
    if (!validateFacilities(config.amenities)) {
      toast.error(t.assistantFacilitiesRequired);
      return false;
    }
    return persist("facilities", { amenities: config.amenities });
  };

  const saveTaxi = async (): Promise<boolean> => {
    if (!config) return false;
    if (taxiOn && !validateEnabledServiceFields(config.taxiLobbyPhone, config.taxiNotes)) {
      toast.error(t.assistantServiceRequired);
      return false;
    }
    return persist("taxi", {
      taxiLobbyPhone: taxiOn ? config.taxiLobbyPhone : null,
      taxiNotes: taxiOn ? config.taxiNotes : null,
    });
  };

  const saveSpa = async (): Promise<boolean> => {
    if (!config) return false;
    if (
      spaOn &&
      !validateEnabledServiceFields(
        config.spaPhone,
        config.spaInfo,
        config.spaOpenTime,
        config.spaCloseTime,
      )
    ) {
      toast.error(t.assistantServiceRequired);
      return false;
    }
    return persist("spa", {
      spaPhone: spaOn ? config.spaPhone : null,
      spaInfo: spaOn ? config.spaInfo : null,
      spaOpenTime: spaOn ? config.spaOpenTime : null,
      spaCloseTime: spaOn ? config.spaCloseTime : null,
    });
  };

  const saveSalon = async (): Promise<boolean> => {
    if (!config) return false;
    if (
      salonOn &&
      !validateEnabledServiceFields(
        config.salonPhone,
        config.salonInfo,
        config.salonOpenTime,
        config.salonCloseTime,
      )
    ) {
      toast.error(t.assistantServiceRequired);
      return false;
    }
    return persist("salon", {
      salonInfo: salonOn ? config.salonInfo : null,
      salonPhone: salonOn ? config.salonPhone : null,
      salonOpenTime: salonOn ? config.salonOpenTime : null,
      salonCloseTime: salonOn ? config.salonCloseTime : null,
    });
  };

  const saveLaundry = async (): Promise<boolean> => {
    if (!config) return false;
    if (laundryOn && !validateEnabledServiceFields(config.laundryPhone, config.laundryInfo)) {
      toast.error(t.assistantServiceRequired);
      return false;
    }
    return persist("laundry", {
      laundryInfo: laundryOn ? config.laundryInfo : null,
      laundryPhone: laundryOn ? config.laundryPhone : null,
    });
  };

  const updateAmenity = (id: string, next: HotelAmenityConfig) => {
    setConfig((prev) =>
      prev ? { ...prev, amenities: prev.amenities.map((a) => (a.id === id ? next : a)) } : prev,
    );
  };

  if (loading) {
    return (
      <SettingsSectionCard icon={<Bot className="h-4 w-4 text-zinc-600" />} title={t.assistantConfigTitle} subtitle={t.assistantConfigSubtitle}>
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-300" />
        </div>
      </SettingsSectionCard>
    );
  }

  if (!config) return null;

  const amenityLabels = {
    addDetail: t.assistantAddDetail,
    hideDetail: t.assistantHideDetail,
    open: t.assistantOpenTime,
    close: t.assistantCloseTime,
    phone: t.assistantReservationPhone,
    notes: t.assistantNotes,
  };

  return (
    <div className="space-y-4">
      <SettingsSectionCard
        id={ASSISTANT_SECTION_IDS.about}
        icon={<Building2 className="h-4 w-4 text-zinc-500" />}
        title={t.assistantAboutTitle}
        subtitle={t.assistantAboutSubtitle}
      >
        <SettingsField label={t.assistantAboutLabel}>
          <Textarea
            value={config.aboutHotel}
            onChange={(e) => setConfig({ ...config, aboutHotel: e.target.value })}
            rows={4}
            placeholder={t.assistantAboutPlaceholder}
            className="resize-none rounded-xl border-zinc-200 text-sm"
          />
          <p
            className={`mt-1.5 text-[11px] ${
              config.aboutHotel.trim().length < ABOUT_HOTEL_MIN_CHARS ? "text-amber-700" : "text-zinc-400"
            }`}
          >
            {t.assistantAboutMinChars.replace("{min}", String(ABOUT_HOTEL_MIN_CHARS))}
            {config.aboutHotel.trim().length > 0 ? ` · ${config.aboutHotel.trim().length}` : ""}
          </p>
        </SettingsField>
        <div className="mt-3">
          <p className="mb-2 text-xs font-medium text-zinc-600">{t.assistantCityLabel}</p>
          <CityCountryPicker
            countryCode={countryCode}
            cityName={cityName}
            onCountryChange={setCountryCode}
            onCityChange={setCityName}
            labels={{
              country: t.assistantCountryLabel,
              city: t.assistantCityFieldLabel,
              countrySearch: t.assistantCountrySearch,
              citySearch: t.assistantCitySearch,
              empty: t.assistantPickerEmpty,
              useCustomCity: t.assistantUseCustomCity,
            }}
          />
        </div>
        <SectionSaveBar
          label={t.assistantSectionSave}
          homeLabel={t.assistantSectionHome}
          saving={savingKey === "about"}
          onSave={() => void saveAbout()}
          onHome={() => saveAbout()}
        />
      </SettingsSectionCard>

      <SettingsSectionCard
        id={ASSISTANT_SECTION_IDS.facilities}
        icon={<Waves className="h-4 w-4 text-zinc-500" />}
        title={t.assistantFacilitiesTitle}
        subtitle={t.assistantFacilitiesSubtitle}
      >
        <div className="space-y-2">
          {catalog.map((cat) => {
            const amenity = config.amenities.find((a) => a.id === cat.id) ?? { id: cat.id, enabled: false };
            return (
              <AmenityRow key={cat.id} catalog={cat} value={amenity} onChange={(next) => updateAmenity(cat.id, next)} labels={amenityLabels} />
            );
          })}
        </div>
        <SectionSaveBar
          label={t.assistantSectionSave}
          homeLabel={t.assistantSectionHome}
          saving={savingKey === "facilities"}
          onSave={() => void persist("facilities", { amenities: config.amenities })}
          onHome={() => persist("facilities", { amenities: config.amenities })}
        />
      </SettingsSectionCard>

      <ServiceSection
        id={ASSISTANT_SECTION_IDS.taxi}
        icon={<Car className="h-4 w-4" />}
        title={t.assistantTaxiTitle}
        subtitle={t.assistantTaxiSubtitle}
        enabled={taxiOn}
        onEnabledChange={(v) => {
          setTaxiOn(v);
          if (!v) setConfig((c) => (c ? { ...c, taxiLobbyPhone: null, taxiNotes: null } : c));
        }}
        saving={savingKey === "taxi"}
        saveLabel={t.assistantSectionSave}
        homeLabel={t.assistantSectionHome}
        onSave={() => void saveTaxi()}
        onHome={() => saveTaxi()}
      >
        <div className="space-y-3">
          <SettingsField label={t.assistantTaxiPhone}>
            <Input value={config.taxiLobbyPhone ?? ""} onChange={(e) => setConfig({ ...config, taxiLobbyPhone: e.target.value || null })} placeholder={t.assistantTaxiPhonePlaceholder} className="h-8 text-sm" />
          </SettingsField>
          <SettingsField label={t.assistantNotes}>
            <Textarea value={config.taxiNotes ?? ""} onChange={(e) => setConfig({ ...config, taxiNotes: e.target.value || null })} rows={2} className="resize-none text-sm" />
          </SettingsField>
        </div>
      </ServiceSection>

      <ServiceSection
        id={ASSISTANT_SECTION_IDS.spa}
        icon={<Sparkles className="h-4 w-4" />}
        title={t.assistantSpaTitle}
        subtitle={t.assistantSpaSubtitle}
        enabled={spaOn}
        onEnabledChange={(v) => {
          setSpaOn(v);
          if (!v) setConfig((c) => (c ? { ...c, spaPhone: null, spaInfo: null, spaOpenTime: null, spaCloseTime: null } : c));
        }}
        saving={savingKey === "spa"}
        saveLabel={t.assistantSectionSave}
        homeLabel={t.assistantSectionHome}
        onSave={() => void saveSpa()}
        onHome={() => saveSpa()}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <SettingsField label={t.assistantReservationPhone}>
            <Input value={config.spaPhone ?? ""} onChange={(e) => setConfig({ ...config, spaPhone: e.target.value || null })} className="h-8 text-sm" />
          </SettingsField>
          <SettingsField label={t.assistantOpenTime}>
            <Input value={config.spaOpenTime ?? ""} onChange={(e) => setConfig({ ...config, spaOpenTime: e.target.value || null })} placeholder="09:00" className="h-8 text-sm" />
          </SettingsField>
          <SettingsField label={t.assistantCloseTime}>
            <Input value={config.spaCloseTime ?? ""} onChange={(e) => setConfig({ ...config, spaCloseTime: e.target.value || null })} placeholder="21:00" className="h-8 text-sm" />
          </SettingsField>
        </div>
        <SettingsField label={t.assistantNotes} className="mt-3">
          <Textarea value={config.spaInfo ?? ""} onChange={(e) => setConfig({ ...config, spaInfo: e.target.value || null })} rows={2} className="resize-none text-sm" />
        </SettingsField>
      </ServiceSection>

      <ServiceSection
        id={ASSISTANT_SECTION_IDS.salon}
        icon={<Scissors className="h-4 w-4" />}
        title={t.assistantSalonTitle}
        subtitle={t.assistantSalonSubtitle}
        enabled={salonOn}
        onEnabledChange={(v) => {
          setSalonOn(v);
          if (!v) setConfig((c) => (c ? { ...c, salonInfo: null, salonPhone: null, salonOpenTime: null, salonCloseTime: null } : c));
        }}
        saving={savingKey === "salon"}
        saveLabel={t.assistantSectionSave}
        homeLabel={t.assistantSectionHome}
        onSave={() => void saveSalon()}
        onHome={() => saveSalon()}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <SettingsField label={t.assistantReservationPhone}>
            <Input value={config.salonPhone ?? ""} onChange={(e) => setConfig({ ...config, salonPhone: e.target.value || null })} className="h-8 text-sm" />
          </SettingsField>
          <SettingsField label={t.assistantOpenTime}>
            <Input value={config.salonOpenTime ?? ""} onChange={(e) => setConfig({ ...config, salonOpenTime: e.target.value || null })} className="h-8 text-sm" />
          </SettingsField>
          <SettingsField label={t.assistantCloseTime}>
            <Input value={config.salonCloseTime ?? ""} onChange={(e) => setConfig({ ...config, salonCloseTime: e.target.value || null })} className="h-8 text-sm" />
          </SettingsField>
        </div>
        <SettingsField label={t.assistantNotes} className="mt-3">
          <Textarea value={config.salonInfo ?? ""} onChange={(e) => setConfig({ ...config, salonInfo: e.target.value || null })} rows={2} className="resize-none text-sm" />
        </SettingsField>
      </ServiceSection>

      <ServiceSection
        id={ASSISTANT_SECTION_IDS.laundry}
        icon={<Shirt className="h-4 w-4" />}
        title={t.assistantLaundryTitle}
        subtitle={t.assistantLaundrySubtitle}
        enabled={laundryOn}
        onEnabledChange={(v) => {
          setLaundryOn(v);
          if (!v) setConfig((c) => (c ? { ...c, laundryInfo: null, laundryPhone: null } : c));
        }}
        saving={savingKey === "laundry"}
        saveLabel={t.assistantSectionSave}
        homeLabel={t.assistantSectionHome}
        onSave={() => void saveLaundry()}
        onHome={() => saveLaundry()}
      >
        <div className="space-y-3">
          <SettingsField label={t.assistantReservationPhone}>
            <Input value={config.laundryPhone ?? ""} onChange={(e) => setConfig({ ...config, laundryPhone: e.target.value || null })} className="h-8 text-sm" />
          </SettingsField>
          <SettingsField label={t.assistantNotes}>
            <Textarea value={config.laundryInfo ?? ""} onChange={(e) => setConfig({ ...config, laundryInfo: e.target.value || null })} rows={2} className="resize-none text-sm" />
          </SettingsField>
        </div>
      </ServiceSection>
    </div>
  );
}
