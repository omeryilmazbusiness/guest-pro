/**
 * InfoBlocks — hospitality information cards for the welcoming screen.
 *
 * Sections: Essentials (Wi-Fi + Emergency) · Dining · Menu · Nearby · Support.
 * Desktop: 2-column grid. Mobile: 1-column stack.
 * Fully driven by HotelConfig + WelcomingStrings — no hardcoded text.
 *
 * Key improvements over v1:
 *   - DiningCard: icon-based meal rows (Sunrise / Sun / Moon / Bell)
 *   - MenuCard: icon-based category headers from MenuSection.icon field
 *   - EmergencyCard: "Call for Help" button that creates a public welcome alert
 *   - NearbyCard: clickable place rows → NearbyPlaceModal (OSM map + QR code)
 *   - SupportCard: auth-aware (concierge CTA vs. login prompt)
 */

import {
  Wifi,
  Phone,
  MapPin,
  MessageSquare,
  Clock,
  Copy,
  CheckCheck,
  LogIn,
  Sunrise,
  Sun,
  Moon,
  Bell,
  Coffee,
  UtensilsCrossed,
  IceCream2,
  Soup,
  ChefHat,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import type { HotelConfig, WelcomingStrings } from "@/lib/welcoming/hotel-content";
import type { NearbyPlace, MenuSection } from "@/lib/welcoming/types";
import { NearbyPlaceModal } from "./NearbyPlaceModal";
import { callForWelcomeSupport } from "@/lib/welcoming/welcome-support";

// ── Shared card shell ─────────────────────────────────────────────────────────

function InfoCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-white border border-zinc-100 rounded-2xl p-5 shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

function CardHeader({
  icon: Icon,
  label,
  iconClass = "text-zinc-700",
  iconBg = "bg-zinc-100",
}: {
  icon: React.FC<{ className?: string }>;
  label: string;
  iconClass?: string;
  iconBg?: string;
}) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span className={cn("w-8 h-8 rounded-xl flex items-center justify-center", iconBg)}>
        <Icon className={cn("w-4 h-4", iconClass)} />
      </span>
      <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest">
        {label}
      </p>
    </div>
  );
}

// ── Copy button ───────────────────────────────────────────────────────────────

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  function handle() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }
  return (
    <button
      onClick={handle}
      className="ml-auto p-1.5 rounded-lg text-zinc-300 hover:text-zinc-600 hover:bg-zinc-50 transition-colors"
      aria-label="Copy"
    >
      {copied ? (
        <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}

// ── Wi-Fi card ────────────────────────────────────────────────────────────────

function WifiCard({ config, s }: { config: HotelConfig; s: WelcomingStrings }) {
  return (
    <InfoCard>
      <CardHeader icon={Wifi} label={s.wifiTitle} iconClass="text-sky-600" iconBg="bg-sky-50" />
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide mb-0.5">
              {s.wifiNetwork}
            </p>
            <p className="text-sm font-semibold text-zinc-900 font-mono">{config.wifi.ssid}</p>
          </div>
          <CopyButton value={config.wifi.ssid} />
        </div>
        <div className="h-px bg-zinc-50" />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide mb-0.5">
              {s.wifiPassword}
            </p>
            <p className="text-sm font-semibold text-zinc-900 font-mono tracking-wider">
              {config.wifi.password}
            </p>
          </div>
          <CopyButton value={config.wifi.password} />
        </div>
      </div>
    </InfoCard>
  );
}

// ── Emergency card ────────────────────────────────────────────────────────────

type SupportCallState = "idle" | "sending" | "sent" | "failed";

function EmergencyCard({
  config,
  s,
  locale,
}: {
  config: HotelConfig;
  s: WelcomingStrings;
  locale: string;
}) {
  const [callState, setCallState] = useState<SupportCallState>("idle");

  async function handleCallForSupport() {
    if (callState === "sending" || callState === "sent") return;
    setCallState("sending");
    const result = await callForWelcomeSupport(locale);
    setCallState(result.ok ? "sent" : "failed");
    if (!result.ok) {
      setTimeout(() => setCallState("idle"), 4000);
    }
  }

  const callButtonLabel =
    callState === "sending"
      ? s.callForSupportSending
      : callState === "sent"
        ? s.callForSupportSent
        : callState === "failed"
          ? s.callForSupportFailed
          : s.callForSupport;

  return (
    <InfoCard>
      <CardHeader icon={Phone} label={s.emergencyTitle} iconClass="text-rose-600" iconBg="bg-rose-50" />
      <div className="flex flex-col gap-4">
        {/* Direct call row */}
        <div className="flex items-center justify-between">
          <p className="text-xl font-semibold text-zinc-900 tracking-tight font-mono">
            {config.emergency.number}
          </p>
          <a
            href={`tel:${config.emergency.number}`}
            className="px-3 py-1.5 rounded-xl bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-700 transition-colors"
          >
            {s.emergencyCallLabel}
          </a>
        </div>

        <div className="h-px bg-zinc-50" />

        {/* "Call for help" alert button */}
        <button
          onClick={handleCallForSupport}
          disabled={callState === "sending" || callState === "sent"}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95",
            callState === "sent"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-100 cursor-default"
              : callState === "failed"
                ? "bg-rose-50 text-rose-700 border border-rose-100"
                : callState === "sending"
                  ? "bg-zinc-50 text-zinc-400 border border-zinc-100 cursor-wait"
                  : "bg-rose-600 text-white hover:bg-rose-700 shadow-sm shadow-rose-100",
          )}
        >
          {callState === "sent" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
          ) : callState === "failed" ? (
            <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          ) : (
            <Bell className="w-4 h-4 shrink-0" aria-hidden="true" />
          )}
          {callButtonLabel}
        </button>
      </div>
    </InfoCard>
  );
}

// ── Dining hours card ─────────────────────────────────────────────────────────

const MEAL_ICONS = {
  Breakfast: Sunrise,
  Lunch:     Sun,
  Dinner:    Moon,
} as const;

type MealKey = keyof typeof MEAL_ICONS;

function DiningCard({ config, s }: { config: HotelConfig; s: WelcomingStrings }) {
  const rows = [
    { labelKey: "Breakfast" as MealKey, label: s.breakfastLabel, hours: config.dining.breakfast },
    { labelKey: "Lunch"     as MealKey, label: s.lunchLabel,     hours: config.dining.lunch },
    { labelKey: "Dinner"    as MealKey, label: s.dinnerLabel,    hours: config.dining.dinner },
  ];
  return (
    <InfoCard>
      <CardHeader icon={Clock} label={s.diningSection} iconClass="text-amber-600" iconBg="bg-amber-50" />
      <div className="flex flex-col gap-3">
        {rows.map(({ labelKey, label, hours }) => {
          const Icon = MEAL_ICONS[labelKey];
          return (
            <div key={labelKey} className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
              </span>
              <p className="flex-1 text-sm text-zinc-600">{label}</p>
              <p className="text-sm font-medium text-zinc-900 tabular-nums">
                {hours.open} – {hours.close}
              </p>
            </div>
          );
        })}
        <div className="h-px bg-zinc-50" />
        <div className="flex items-center gap-3">
          <span className="w-6 h-6 rounded-lg bg-zinc-50 flex items-center justify-center shrink-0">
            <Bell className="w-3.5 h-3.5 text-zinc-400" aria-hidden="true" />
          </span>
          <p className="flex-1 text-sm text-zinc-600">{s.roomServiceLabel}</p>
          <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            {config.dining.roomService}
          </span>
        </div>
      </div>
    </InfoCard>
  );
}

// ── Menu preview card ─────────────────────────────────────────────────────────

const SECTION_ICON_MAP: Record<MenuSection["icon"], React.FC<{ className?: string }>> = {
  Coffee:         Coffee,
  UtensilsCrossed:UtensilsCrossed,
  IceCream2:      IceCream2,
  Soup:           Soup,
  ChefHat:        ChefHat,
};

const SECTION_COLOUR: Record<MenuSection["icon"], { bg: string; icon: string }> = {
  Coffee:         { bg: "bg-amber-50",   icon: "text-amber-500" },
  UtensilsCrossed:{ bg: "bg-violet-50",  icon: "text-violet-500" },
  IceCream2:      { bg: "bg-pink-50",    icon: "text-pink-500" },
  Soup:           { bg: "bg-teal-50",    icon: "text-teal-500" },
  ChefHat:        { bg: "bg-zinc-100",   icon: "text-zinc-500" },
};

function MenuCard({ config, s }: { config: HotelConfig; s: WelcomingStrings }) {
  return (
    <InfoCard>
      <CardHeader icon={ChefHat} label={s.menuTitle} iconClass="text-violet-600" iconBg="bg-violet-50" />
      <div className="flex flex-col gap-4">
        {config.menu.map((section) => {
          const Icon = SECTION_ICON_MAP[section.icon] ?? ChefHat;
          const colour = SECTION_COLOUR[section.icon] ?? SECTION_COLOUR.ChefHat;
          return (
            <div key={section.category}>
              {/* Category header with icon */}
              <div className="flex items-center gap-2 mb-2">
                <span className={cn("w-5 h-5 rounded-md flex items-center justify-center", colour.bg)}>
                  <Icon className={cn("w-3 h-3", colour.icon)} aria-hidden="true" />
                </span>
                <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">
                  {section.category}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {section.items.map((item) => (
                  <span
                    key={item.name}
                    className="text-xs text-zinc-700 bg-zinc-50 border border-zinc-100 px-2.5 py-1 rounded-lg"
                  >
                    {item.name}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </InfoCard>
  );
}

// ── Nearby places card ────────────────────────────────────────────────────────

const PLACE_ICON: Record<NearbyPlace["type"], string> = {
  market:     "bg-teal-50 text-teal-600",
  pharmacy:   "bg-rose-50 text-rose-600",
  bazaar:     "bg-amber-50 text-amber-600",
  restaurant: "bg-orange-50 text-orange-600",
  other:      "bg-zinc-100 text-zinc-500",
};

type PlaceLabelKey =
  | "placeTypeMarket"
  | "placeTypePharmacy"
  | "placeTypeBazaar"
  | "placeTypeRestaurant"
  | "placeTypeOther";

const TYPE_TO_LABEL_KEY: Record<NearbyPlace["type"], PlaceLabelKey> = {
  market:     "placeTypeMarket",
  pharmacy:   "placeTypePharmacy",
  bazaar:     "placeTypeBazaar",
  restaurant: "placeTypeRestaurant",
  other:      "placeTypeOther",
};

function NearbyCard({
  config,
  s,
  onSelectPlace,
}: {
  config: HotelConfig;
  s: WelcomingStrings;
  onSelectPlace: (place: NearbyPlace) => void;
}) {
  return (
    <InfoCard>
      <CardHeader icon={MapPin} label={s.nearbySection} iconClass="text-teal-600" iconBg="bg-teal-50" />
      <div className="flex flex-col gap-1">
        {config.nearbyPlaces.map((place) => {
          const typeLabel = s[TYPE_TO_LABEL_KEY[place.type]];
          const hasMap = Boolean(place.coords);
          return (
            <button
              key={place.name}
              onClick={() => onSelectPlace(place)}
              className="flex items-center gap-3 py-2 px-1 rounded-xl hover:bg-zinc-50 active:bg-zinc-100 transition-colors text-left w-full group"
            >
              <span
                className={cn(
                  "w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-[10px] font-bold",
                  PLACE_ICON[place.type] ?? PLACE_ICON.other,
                )}
              >
                {typeLabel[0]}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 truncate">{place.name}</p>
                <p className="text-[11px] text-zinc-400">{typeLabel}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[11px] font-medium text-zinc-400">{place.distance}</span>
                {hasMap && (
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </InfoCard>
  );
}

// ── Support card ──────────────────────────────────────────────────────────────

function SupportCard({
  s,
  isAuthenticated,
  onOpenConcierge,
  onAccessStay,
}: {
  s: WelcomingStrings;
  isAuthenticated: boolean;
  onOpenConcierge: () => void;
  onAccessStay: () => void;
}) {
  return (
    <InfoCard className="col-span-1 md:col-span-2">
      <CardHeader
        icon={MessageSquare}
        label={s.helpSection}
        iconClass="text-indigo-600"
        iconBg="bg-indigo-50"
      />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-sm text-zinc-600 leading-relaxed max-w-md">{s.supportDesc}</p>
        {isAuthenticated ? (
          <button
            onClick={onOpenConcierge}
            className="shrink-0 px-5 py-2.5 rounded-xl bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-700 active:scale-95 transition-all duration-150"
          >
            {s.supportAction}
          </button>
        ) : (
          <div className="shrink-0 flex flex-col items-start sm:items-end gap-2">
            <p className="text-[11px] text-zinc-400">{s.supportLoginNote}</p>
            <button
              onClick={onAccessStay}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-100 text-zinc-700 text-sm font-medium hover:bg-zinc-200 active:scale-95 transition-all duration-150"
            >
              <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
              {s.accessYourStay}
            </button>
          </div>
        )}
      </div>
    </InfoCard>
  );
}

// ── Section heading ───────────────────────────────────────────────────────────

function SectionHeading({ label }: { label: string }) {
  return (
    <div className="col-span-1 md:col-span-2 pt-2">
      <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest">{label}</p>
    </div>
  );
}

// ── Composed InfoBlocks grid ──────────────────────────────────────────────────

interface InfoBlocksProps {
  config: HotelConfig;
  s: WelcomingStrings;
  locale: string;
  isAuthenticated: boolean;
  onOpenConcierge: () => void;
  onAccessStay: () => void;
}

export function InfoBlocks({
  config,
  s,
  locale,
  isAuthenticated,
  onOpenConcierge,
  onAccessStay,
}: InfoBlocksProps) {
  const [selectedPlace, setSelectedPlace] = useState<NearbyPlace | null>(null);

  const handleSelectPlace = useCallback((place: NearbyPlace) => {
    setSelectedPlace(place);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedPlace(null);
  }, []);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Essentials row */}
        <SectionHeading label={s.essentialsSection} />
        <WifiCard config={config} s={s} />
        <EmergencyCard config={config} s={s} locale={locale} />

        {/* Dining row */}
        <SectionHeading label={s.diningSection} />
        <DiningCard config={config} s={s} />
        <MenuCard config={config} s={s} />

        {/* Nearby row */}
        <SectionHeading label={s.nearbySection} />
        <NearbyCard config={config} s={s} onSelectPlace={handleSelectPlace} />

        {/* Support — full width */}
        <SectionHeading label={s.helpSection} />
        <SupportCard
          s={s}
          isAuthenticated={isAuthenticated}
          onOpenConcierge={onOpenConcierge}
          onAccessStay={onAccessStay}
        />
      </div>

      {/* Nearby place modal — portal-style (renders above the grid) */}
      <NearbyPlaceModal
        place={selectedPlace}
        s={s}
        onClose={handleCloseModal}
      />
    </>
  );
}
