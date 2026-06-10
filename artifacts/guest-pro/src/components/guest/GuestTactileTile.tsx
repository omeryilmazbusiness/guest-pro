import { useCallback, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/lib/haptic";
import { GUEST_TAP_SPRING } from "@/lib/guest-motion";

interface GuestTactileTileProps {
  onClick: () => void;
  className?: string;
  icon: React.FC<{ className?: string; strokeWidth?: number }>;
  iconWrapClassName?: string;
  iconClassName?: string;
  labelClassName?: string;
  label: string;
  commitHaptic?: boolean;
  size?: "md" | "sm";
}

export function GuestTactileTile({
  onClick,
  className,
  icon: Icon,
  iconWrapClassName,
  iconClassName,
  labelClassName,
  label,
  commitHaptic = true,
  size = "md",
}: GuestTactileTileProps) {
  const reduceMotion = useReducedMotion();
  const [firm, setFirm] = useState(false);
  const firmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSm = size === "sm";

  const clearFirmTimer = useCallback(() => {
    if (firmTimer.current) {
      clearTimeout(firmTimer.current);
      firmTimer.current = null;
    }
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      setFirm(false);
      clearFirmTimer();
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      firmTimer.current = setTimeout(() => setFirm(true), 110);
    },
    [clearFirmTimer],
  );

  const handlePointerEnd = useCallback(() => {
    clearFirmTimer();
    setFirm(false);
  }, [clearFirmTimer]);

  const handleClick = useCallback(() => {
    triggerHaptic(commitHaptic ? "open" : "medium");
    onClick();
  }, [commitHaptic, onClick]);

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      whileTap={reduceMotion ? undefined : { scale: 0.96 }}
      transition={GUEST_TAP_SPRING}
      className={cn(
        "guest-tactile-tile group flex flex-col items-center justify-center",
        isSm ? "gap-2 rounded-[1.15rem] px-1.5 py-3 min-h-[5.75rem]" : "gap-2.5 rounded-[1.35rem] px-2 py-4 min-h-[7.5rem]",
        "shadow-lg select-none touch-manipulation",
        firm && "guest-tactile--firm",
        className,
      )}
    >
      <span
        className={cn(
          "flex items-center justify-center transition-transform duration-200 group-hover:scale-105",
          isSm ? "h-9 w-9 rounded-xl" : "h-11 w-11 rounded-2xl",
          iconWrapClassName,
        )}
      >
        <Icon className={cn(isSm ? "h-4 w-4" : "h-5 w-5", iconClassName)} strokeWidth={1.75} />
      </span>
      <span
        className={cn(
          "font-semibold leading-tight text-center line-clamp-2 px-0.5",
          isSm ? "text-[9px]" : "text-[11px]",
          labelClassName,
        )}
      >
        {label}
      </span>
    </motion.button>
  );
}
