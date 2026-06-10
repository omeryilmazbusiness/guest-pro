import { motion, useReducedMotion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/lib/haptic";
import { GUEST_TAP_SPRING } from "@/lib/guest-motion";
import { NearbyPlaceTypeIcon } from "@/components/welcoming/NearbyPlaceTypeIcon";
import type { NearbyPlace } from "@/lib/welcoming/types";

interface GuestNearbyPlaceRowProps {
  place: NearbyPlace;
  active: boolean;
  onOpen: (place: NearbyPlace) => void;
}

export function GuestNearbyPlaceRow({ place, active, onOpen }: GuestNearbyPlaceRowProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.button
      type="button"
      onClick={() => {
        triggerHaptic("open");
        onOpen(place);
      }}
      whileTap={reduceMotion ? undefined : { scale: 0.98 }}
      transition={GUEST_TAP_SPRING}
      className={cn(
        "guest-nearby-row group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border px-3 py-2.5 text-start touch-manipulation select-none",
        active
          ? "border-teal-200/90 bg-white shadow-md ring-1 ring-teal-500/20"
          : "border-transparent bg-white/95 hover:border-zinc-200/80 hover:bg-white hover:shadow-sm",
      )}
    >
      <NearbyPlaceTypeIcon type={place.type} size="sm" />
      <span className="relative min-w-0 flex-1">
        <p className="truncate text-[14px] font-semibold text-zinc-900">{place.name}</p>
        {place.distance !== "—" && (
          <p className="text-[10px] font-medium text-zinc-400">{place.distance}</p>
        )}
      </span>
      <ChevronRight className="relative h-4 w-4 shrink-0 text-zinc-300 transition-colors group-hover:text-teal-600" />
    </motion.button>
  );
}
