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
        "group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-start touch-manipulation select-none transition-colors",
        active
          ? "bg-teal-50 ring-1 ring-teal-100"
          : "bg-white hover:bg-zinc-50",
      )}
    >
      <NearbyPlaceTypeIcon type={place.type} size="sm" className="!h-7 !w-7 !rounded-md" />
      <span className="relative min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-zinc-900">{place.name}</p>
        {place.distance !== "—" && (
          <p className="text-[9px] font-medium text-zinc-400">{place.distance}</p>
        )}
      </span>
      <ChevronRight className="relative h-3.5 w-3.5 shrink-0 text-zinc-300 transition-colors group-hover:text-teal-600" />
    </motion.button>
  );
}
