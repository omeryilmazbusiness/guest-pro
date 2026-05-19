/**
 * NearbyPlaceDetail — map, directions, QR for a single nearby place.
 */

import { useState, useEffect } from "react";
import { MapPin, Navigation, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { cn } from "@/lib/utils";
import type { NearbyPlace } from "@/lib/welcoming/types";
import type { WelcomingStrings } from "@/lib/welcoming/hotel-content";
import { getNearbyTypeLabel } from "@/lib/welcoming/nearby-place-meta";
import { NearbyPlaceTypeIcon } from "./NearbyPlaceTypeIcon";
import {
  buildGoogleMapsDirectionsLink,
  buildQrPayload,
  buildOsmEmbedUrl,
} from "@/lib/welcoming/maps";

function QrPanel({ place, s }: { place: NearbyPlace; s: WelcomingStrings }) {
  if (!place.coords) return null;
  const qrValue = buildQrPayload(place.coords, place.name);
  return (
    <div className="mt-4 border-t border-zinc-100 pt-4 flex flex-col items-center gap-3">
      <div className="rounded-2xl border border-zinc-100 bg-white p-3 shadow-sm">
        <QRCodeSVG
          value={qrValue}
          size={160}
          level="M"
          bgColor="#ffffff"
          fgColor="#18181b"
          style={{ display: "block" }}
        />
      </div>
      <p className="text-center text-[11px] text-zinc-400">{s.nearbyQrScanNote}</p>
    </div>
  );
}

function MapEmbed({ place }: { place: NearbyPlace }) {
  if (!place.coords) return null;
  const src = buildOsmEmbedUrl(place.coords);
  return (
    <div
      className="w-full overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50"
      style={{ height: 180 }}
    >
      <iframe
        src={src}
        title={`Map for ${place.name}`}
        width="100%"
        height="180"
        style={{ border: 0, display: "block" }}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

interface NearbyPlaceDetailProps {
  place: NearbyPlace;
  s: WelcomingStrings;
  className?: string;
}

export function NearbyPlaceDetail({ place, s, className }: NearbyPlaceDetailProps) {
  const [showQr, setShowQr] = useState(false);
  const typeLabel = getNearbyTypeLabel(s, place.type);
  const mapsLink = place.coords
    ? buildGoogleMapsDirectionsLink(place.coords, place.name)
    : `https://www.google.com/maps/search/${encodeURIComponent(place.name)}`;

  useEffect(() => {
    setShowQr(false);
  }, [place.name]);

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <div className="shrink-0 border-b border-zinc-100 px-4 pb-3 pt-4">
        <div className="flex items-start gap-3">
          <NearbyPlaceTypeIcon type={place.type} size="md" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
              {s.nearbyModalTitle}
            </p>
            <h3 className="mt-0.5 text-[17px] font-semibold leading-snug text-zinc-900">
              {place.name}
            </h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-medium text-zinc-600">{typeLabel}</span>
              <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                <MapPin className="h-3 w-3" aria-hidden />
                {place.distance}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3">
        {place.description && (
          <p className="mb-3 text-[14px] leading-relaxed text-zinc-600">{place.description}</p>
        )}
        <MapEmbed place={place} />
        <div className="mt-3 flex gap-2">
          <a
            href={mapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-3 py-2.5 text-sm font-medium text-white transition-all hover:bg-zinc-700 active:scale-[0.98]"
          >
            <Navigation className="h-3.5 w-3.5" aria-hidden />
            {s.nearbyOpenInMaps}
          </a>
          {place.coords && (
            <button
              type="button"
              onClick={() => setShowQr((v) => !v)}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all active:scale-[0.98]",
                showQr
                  ? "border-zinc-200 bg-zinc-100 text-zinc-700"
                  : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50",
              )}
            >
              <QrCode className="h-3.5 w-3.5" aria-hidden />
              {s.nearbyGetQr}
            </button>
          )}
        </div>
        {showQr && <QrPanel place={place} s={s} />}
      </div>
    </div>
  );
}
