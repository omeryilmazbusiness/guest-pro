/**
 * NearbyPlaceModal — centered overlay with place detail (welcoming / kiosk).
 */

import { X } from "lucide-react";
import type { NearbyPlace } from "@/lib/welcoming/types";
import type { WelcomingStrings } from "@/lib/welcoming/hotel-content";
import { NearbyDialogShell } from "./NearbyDialogShell";
import { NearbyPlaceDetail } from "./NearbyPlaceDetail";

interface NearbyPlaceModalProps {
  place: NearbyPlace | null;
  s: WelcomingStrings;
  onClose: () => void;
  closeLabel?: string;
}

export function NearbyPlaceModal({
  place,
  s,
  onClose,
  closeLabel = "Close",
}: NearbyPlaceModalProps) {
  if (!place) return null;

  return (
    <NearbyDialogShell
      open
      onClose={onClose}
      ariaLabel={place.name}
      closeLabel={closeLabel}
    >
      <NearbyPlaceDetail place={place} s={s} />
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 z-10 rounded-xl p-2 text-zinc-400 transition-colors hover:bg-zinc-50 hover:text-zinc-700"
        aria-label={closeLabel}
      >
        <X className="h-4 w-4" />
      </button>
    </NearbyDialogShell>
  );
}
