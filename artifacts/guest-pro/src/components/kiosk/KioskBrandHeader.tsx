/**
 * KioskBrandHeader — hotel logo + name for per-tenant kiosk flows.
 */

import { HotelBrandMark } from "@/components/HotelBrandMark";
import { useHotelDisplay } from "@/hooks/use-hotel-display";
import { cn } from "@/lib/utils";

type KioskBrandHeaderVariant = "fixed" | "embedded";

interface KioskBrandHeaderProps {
  variant?: KioskBrandHeaderVariant;
  className?: string;
}

export function KioskBrandHeader({
  variant = "embedded",
  className,
}: KioskBrandHeaderProps) {
  const isFixed = variant === "fixed";
  const { appName, hotelName } = useHotelDisplay();
  const displayName = hotelName || appName;

  return (
    <header
      className={cn(
        "z-30 flex justify-center px-5 welcoming-brand-enter",
        isFixed
          ? "fixed top-0 inset-x-0 pt-[max(1rem,env(safe-area-inset-top))] pb-4"
          : "relative pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 shrink-0",
        className,
      )}
    >
      <div className="flex items-center gap-2.5">
        <HotelBrandMark
          variant="header"
          className={cn(
            "ring-1 ring-white/20",
            isFixed ? "h-9 w-9" : "h-8 w-8",
          )}
        />
        <span className="kiosk-brand-hotel-name truncate max-w-[min(72vw,14rem)] sm:max-w-none">
          {displayName}
        </span>
      </div>
      {isFixed && (
        <div
          className="pointer-events-none absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent"
          aria-hidden="true"
        />
      )}
    </header>
  );
}
