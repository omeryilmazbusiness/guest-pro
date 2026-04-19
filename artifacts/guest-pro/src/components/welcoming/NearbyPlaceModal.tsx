/**
 * NearbyPlaceModal — detailed info overlay for a nearby place.
 *
 * Shows:
 *   • Place name + type badge + description
 *   • OpenStreetMap embed (no API key required) — only when coords available
 *   • "Open in Google Maps" link button
 *   • QR code encoding a Google Maps walking-directions deep-link
 *
 * Opened from NearbyCard when the user taps a place row.
 */

import { X, MapPin, Navigation, QrCode } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { cn } from "@/lib/utils";
import type { NearbyPlace } from "@/lib/welcoming/types";
import type { WelcomingStrings } from "@/lib/welcoming/hotel-content";
import {
  buildGoogleMapsDirectionsLink,
  buildQrPayload,
  buildOsmEmbedUrl,
} from "@/lib/welcoming/maps";

// ── Type label colour mapping ────────────────────────────────────────────────

const TYPE_BADGE: Record<NearbyPlace["type"], string> = {
  market:     "bg-teal-50 text-teal-700 border-teal-100",
  pharmacy:   "bg-rose-50 text-rose-700 border-rose-100",
  bazaar:     "bg-amber-50 text-amber-700 border-amber-100",
  restaurant: "bg-orange-50 text-orange-700 border-orange-100",
  other:      "bg-zinc-100 text-zinc-600 border-zinc-200",
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

// ── QR panel (toggle-able) ───────────────────────────────────────────────────

function QrPanel({
  place,
  s,
}: {
  place: NearbyPlace;
  s: WelcomingStrings;
}) {
  if (!place.coords) return null;
  const qrValue = buildQrPayload(place.coords, place.name);
  return (
    <div className="mt-4 pt-4 border-t border-zinc-100 flex flex-col items-center gap-3">
      <div className="p-3 bg-white border border-zinc-100 rounded-2xl shadow-sm">
        <QRCodeSVG
          value={qrValue}
          size={160}
          level="M"
          bgColor="#ffffff"
          fgColor="#18181b"
          style={{ display: "block" }}
        />
      </div>
      <p className="text-[11px] text-zinc-400 text-center">{s.nearbyQrScanNote}</p>
    </div>
  );
}

// ── Map iframe ───────────────────────────────────────────────────────────────

function MapEmbed({ place }: { place: NearbyPlace }) {
  if (!place.coords) return null;
  const src = buildOsmEmbedUrl(place.coords);
  return (
    <div className="w-full rounded-xl overflow-hidden border border-zinc-100 bg-zinc-50" style={{ height: 200 }}>
      <iframe
        src={src}
        title={`Map for ${place.name}`}
        width="100%"
        height="200"
        style={{ border: 0, display: "block" }}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

// ── Modal shell ──────────────────────────────────────────────────────────────

interface NearbyPlaceModalProps {
  place: NearbyPlace | null;
  s: WelcomingStrings;
  onClose: () => void;
}

export function NearbyPlaceModal({ place, s, onClose }: NearbyPlaceModalProps) {
  const [showQr, setShowQr] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Reset QR state when place changes
  useEffect(() => {
    setShowQr(false);
  }, [place]);

  if (!place) return null;

  const typeLabel = s[TYPE_TO_LABEL_KEY[place.type]];
  const mapsLink = place.coords
    ? buildGoogleMapsDirectionsLink(place.coords, place.name)
    : `https://www.google.com/maps/search/${encodeURIComponent(place.name)}`;

  return (
    /* Overlay */
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" aria-hidden="true" />

      {/* Panel */}
      <div className="relative w-full sm:max-w-sm bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-zinc-50">
          <div>
            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1">
              {s.nearbyModalTitle}
            </p>
            <h2 className="text-lg font-semibold text-zinc-900 leading-tight">{place.name}</h2>
            <div className="flex items-center gap-2 mt-1.5">
              <span
                className={cn(
                  "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                  TYPE_BADGE[place.type],
                )}
              >
                {typeLabel}
              </span>
              <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                <MapPin className="w-3 h-3" aria-hidden="true" />
                {place.distance}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-2 p-2 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 overflow-y-auto max-h-[calc(100svh-8rem)]">
          {/* Description */}
          {place.description && (
            <p className="text-sm text-zinc-600 leading-relaxed mb-4">{place.description}</p>
          )}

          {/* Map */}
          <MapEmbed place={place} />

          {/* Actions */}
          <div className="flex gap-2 mt-4">
            <a
              href={mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-700 active:scale-95 transition-all duration-150"
            >
              <Navigation className="w-3.5 h-3.5" aria-hidden="true" />
              {s.nearbyOpenInMaps}
            </a>
            {place.coords && (
              <button
                onClick={() => setShowQr((v) => !v)}
                className={cn(
                  "flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all duration-150 active:scale-95",
                  showQr
                    ? "bg-zinc-100 text-zinc-700 border-zinc-200"
                    : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50",
                )}
              >
                <QrCode className="w-3.5 h-3.5" aria-hidden="true" />
                {s.nearbyGetQr}
              </button>
            )}
          </div>

          {/* QR panel — animated toggle */}
          {showQr && <QrPanel place={place} s={s} />}
        </div>
      </div>
    </div>
  );
}
