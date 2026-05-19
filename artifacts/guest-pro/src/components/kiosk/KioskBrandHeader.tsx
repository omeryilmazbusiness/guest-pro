/**
 * KioskBrandHeader — Guest Pro logo + hotel name for kiosk flows.
 */

import { GuestProLogo } from "@/components/GuestProLogo";
import { HOTEL_CONFIG } from "@/lib/welcoming/hotel-content";
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
        <GuestProLogo
          variant="header"
          className={cn("invert", isFixed ? "w-7 h-7 opacity-90" : "w-6 h-6 opacity-80")}
        />
        <span className="kiosk-brand-hotel-name truncate max-w-[min(72vw,14rem)] sm:max-w-none">
          {HOTEL_CONFIG.name}
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
