import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MicAiWaveRingProps {
  children: ReactNode;
  /** Show idle AI halo (not actively listening). */
  idle?: boolean;
  /** Pulse stronger while listening. */
  listening?: boolean;
  className?: string;
}

/** Subtle AI spectrum halo around inline mic — prod-safe CSS only. */
export function MicAiWaveRing({
  children,
  idle = true,
  listening = false,
  className,
}: MicAiWaveRingProps) {
  const show = idle || listening;

  return (
    <div className={cn("relative flex h-10 w-10 items-center justify-center", className)}>
      {show && (
        <>
          <span
            className={cn(
              "pointer-events-none absolute -inset-[5px] rounded-[15px] opacity-60 blur-[4px]",
              "bg-[conic-gradient(from_0deg,#38bdf8,#6366f1,#a855f7,#f472b6,#fb923c,#38bdf8)]",
              listening ? "animate-pulse opacity-80" : "animate-[spin_10s_linear_infinite] opacity-50",
            )}
            aria-hidden
          />
          <span
            className={cn(
              "pointer-events-none absolute -inset-[2px] rounded-[13px] border border-white/40",
              listening && "border-indigo-300/50",
            )}
            aria-hidden
          />
        </>
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
