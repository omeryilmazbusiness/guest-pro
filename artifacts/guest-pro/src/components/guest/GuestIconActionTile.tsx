import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/lib/haptic";

interface GuestIconActionTileProps {
  icon: LucideIcon;
  label: string;
  iconClassName: string;
  onClick: () => void;
  size?: "md" | "sm";
}

const tileButton = cn(
  "group flex w-full flex-col items-center justify-center gap-2.5 py-2 px-1 text-center",
  "transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/10 rounded-2xl",
);

export function GuestIconActionTile({
  icon: Icon,
  label,
  iconClassName,
  onClick,
  size = "md",
}: GuestIconActionTileProps) {
  const isSm = size === "sm";

  return (
    <button
      type="button"
      onClick={() => {
        triggerHaptic("open");
        onClick();
      }}
      className={tileButton}
    >
      <span
        className={cn(
          "relative inline-flex items-center justify-center",
          isSm ? "h-12 w-12" : "h-14 w-14",
        )}
        aria-hidden
      >
        <Icon
          className={cn(
            "guest-chat-entry-icon",
            isSm ? "h-9 w-9" : "h-11 w-11",
            iconClassName,
          )}
          strokeWidth={1.5}
        />
      </span>
      <span
        className={cn(
          "block w-full font-semibold leading-snug tracking-tight text-zinc-900",
          isSm ? "text-[11px] line-clamp-2 px-0.5" : "text-[13px] max-w-[6.5rem]",
        )}
      >
        {label}
      </span>
    </button>
  );
}
