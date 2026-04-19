/**
 * InfoBlocks — hospitality information cards for the welcoming screen.
 *
 * Sections: Essentials (Wi-Fi + Emergency) · Dining · Menu · Nearby · Support.
 * Desktop: 2-column grid. Mobile: 1-column stack.
 * Fully driven by HotelConfig + WelcomingStrings — no hardcoded text.
 *
 * SupportCard shows two CTAs:
 *   - Authenticated guests: "Open Concierge" → /guest/chat
 *   - Unauthenticated visitors: a login-note prompt and an "Access your stay" link
 */

import {
  Wifi,
  Phone,
  MapPin,
  ChefHat,
  MessageSquare,
  Clock,
  Copy,
  CheckCheck,
  LogIn,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { HotelConfig, WelcomingStrings } from "@/lib/welcoming/hotel-content";
import type { NearbyPlace } from "@/lib/welcoming/types";

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

function EmergencyCard({ config, s }: { config: HotelConfig; s: WelcomingStrings }) {
  return (
    <InfoCard>
      <CardHeader icon={Phone} label={s.emergencyTitle} iconClass="text-rose-600" iconBg="bg-rose-50" />
      <div className="flex items-center justify-between">
        <p className="text-2xl font-semibold text-zinc-900 tracking-tight font-mono">
          {config.emergency.number}
        </p>
        <a
          href={`tel:${config.emergency.number}`}
          className="px-3 py-1.5 rounded-xl bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-700 transition-colors"
        >
          {s.emergencyCallLabel}
        </a>
      </div>
    </InfoCard>
  );
}

// ── Dining hours card ─────────────────────────────────────────────────────────

function DiningCard({ config, s }: { config: HotelConfig; s: WelcomingStrings }) {
  const rows = [
    { label: s.breakfastLabel, hours: config.dining.breakfast },
    { label: s.lunchLabel,     hours: config.dining.lunch },
    { label: s.dinnerLabel,    hours: config.dining.dinner },
  ];
  return (
    <InfoCard>
      <CardHeader icon={Clock} label={s.diningSection} iconClass="text-amber-600" iconBg="bg-amber-50" />
      <div className="flex flex-col gap-2.5">
        {rows.map(({ label, hours }) => (
          <div key={label} className="flex items-center justify-between">
            <p className="text-sm text-zinc-600">{label}</p>
            <p className="text-sm font-medium text-zinc-900 tabular-nums">
              {hours.open} – {hours.close}
            </p>
          </div>
        ))}
        <div className="h-px bg-zinc-50 my-0.5" />
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-600">{s.roomServiceLabel}</p>
          <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            {config.dining.roomService}
          </span>
        </div>
      </div>
    </InfoCard>
  );
}

// ── Menu preview card ─────────────────────────────────────────────────────────

function MenuCard({ config, s }: { config: HotelConfig; s: WelcomingStrings }) {
  return (
    <InfoCard>
      <CardHeader icon={ChefHat} label={s.menuTitle} iconClass="text-violet-600" iconBg="bg-violet-50" />
      <div className="flex flex-col gap-4">
        {config.menu.map((section) => (
          <div key={section.category}>
            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1.5">
              {section.category}
            </p>
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
        ))}
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

const PLACE_LABEL = (s: WelcomingStrings): Record<NearbyPlace["type"], string> => ({
  market:     s.placeTypeMarket,
  pharmacy:   s.placeTypePharmacy,
  bazaar:     s.placeTypeBazaar,
  restaurant: s.placeTypeRestaurant,
  other:      s.placeTypeOther,
});

function NearbyCard({ config, s }: { config: HotelConfig; s: WelcomingStrings }) {
  const labels = PLACE_LABEL(s);
  return (
    <InfoCard>
      <CardHeader icon={MapPin} label={s.nearbySection} iconClass="text-teal-600" iconBg="bg-teal-50" />
      <div className="flex flex-col gap-2.5">
        {config.nearbyPlaces.map((place) => (
          <div key={place.name} className="flex items-center gap-3">
            <span
              className={cn(
                "w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-[10px] font-bold",
                PLACE_ICON[place.type] ?? PLACE_ICON.other,
              )}
            >
              {labels[place.type][0]}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-900 truncate">{place.name}</p>
              <p className="text-[11px] text-zinc-400">{labels[place.type]}</p>
            </div>
            <span className="text-[11px] font-medium text-zinc-400 shrink-0">{place.distance}</span>
          </div>
        ))}
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
          /* Authenticated guests go directly to the concierge chat */
          <button
            onClick={onOpenConcierge}
            className="shrink-0 px-5 py-2.5 rounded-xl bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-700 active:scale-95 transition-all duration-150"
          >
            {s.supportAction}
          </button>
        ) : (
          /* Unauthenticated visitors see a login prompt instead */
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
  isAuthenticated: boolean;
  onOpenConcierge: () => void;
  onAccessStay: () => void;
}

export function InfoBlocks({ config, s, isAuthenticated, onOpenConcierge, onAccessStay }: InfoBlocksProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Essentials row */}
      <SectionHeading label={s.essentialsSection} />
      <WifiCard config={config} s={s} />
      <EmergencyCard config={config} s={s} />

      {/* Dining row */}
      <SectionHeading label={s.diningSection} />
      <DiningCard config={config} s={s} />
      <MenuCard config={config} s={s} />

      {/* Nearby row */}
      <SectionHeading label={s.nearbySection} />
      <NearbyCard config={config} s={s} />

      {/* Support — full width */}
      <SectionHeading label={s.helpSection} />
      <SupportCard
        s={s}
        isAuthenticated={isAuthenticated}
        onOpenConcierge={onOpenConcierge}
        onAccessStay={onAccessStay}
      />
    </div>
  );
}
