import { cn } from "@/lib/utils";
import { PremiumMicWithSparkle, PremiumMicIcon } from "@/components/guest/icons/PremiumMicIcon";

interface GuestVoiceMicHeroProps {
  isListening: boolean;
  amplitude?: number;
  onClick: () => void;
  ariaLabel: string;
}

/** Multi-color spectrum ring — matches premium AI voice UI references. */
const SPECTRUM_RING =
  "conic-gradient(from 210deg, #34d399 0deg, #22d3ee 52deg, #6366f1 118deg, #d946ef 188deg, #fb7185 248deg, #fbbf24 308deg, #34d399 360deg)";

export function GuestVoiceMicHero({
  isListening,
  amplitude = 0,
  onClick,
  ariaLabel,
}: GuestVoiceMicHeroProps) {
  const bloomScale = isListening ? 1 + Math.min(amplitude * 0.35, 0.35) : 1;
  const ringGlow = isListening
    ? "shadow-[0_0_42px_rgba(99,102,241,0.45),0_0_64px_rgba(34,211,238,0.22),0_0_48px_rgba(217,70,239,0.18)]"
    : "shadow-[0_0_28px_rgba(99,102,241,0.28),0_0_40px_rgba(34,211,238,0.14),0_0_32px_rgba(217,70,239,0.12)]";

  return (
    <div className="relative mb-4 flex h-[7rem] w-full items-center justify-center">
      {/* Horizontal lens flare — subtle cinematic depth */}
      <div
        className="pointer-events-none absolute h-px w-[min(18rem,88vw)] opacity-60"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(52,211,153,0.35) 22%, rgba(34,211,238,0.45) 50%, rgba(99,102,241,0.35) 78%, transparent 100%)",
          filter: "blur(1px)",
        }}
        aria-hidden
      />

      {/* Outer spectrum bloom */}
      <div
        className="pointer-events-none absolute flex items-center justify-center"
        style={{ transform: isListening ? `scale(${bloomScale})` : undefined }}
        aria-hidden
      >
        <div
          className={cn(
            "guest-mic-spectrum-bloom h-[5.75rem] w-[5.75rem] rounded-full blur-2xl",
            isListening ? "opacity-70" : "opacity-50",
          )}
          style={{ background: SPECTRUM_RING }}
        />
      </div>

      {/* Mid soft halo */}
      <div
        className="guest-mic-spectrum-halo pointer-events-none absolute h-[5.25rem] w-[5.25rem] rounded-full blur-lg opacity-40"
        style={{ background: SPECTRUM_RING }}
        aria-hidden
      />

      {/* Gradient ring + black disc */}
      <div
        className={cn(
          "relative z-10 rounded-full p-[2px] transition-shadow duration-500 ease-out",
          ringGlow,
        )}
        style={{ background: SPECTRUM_RING }}
      >
        <button
          type="button"
          onClick={onClick}
          className={cn(
            "relative flex h-[4.85rem] w-[4.85rem] items-center justify-center rounded-full bg-black",
            "transition-all duration-300 ease-out active:scale-[0.96]",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
            isListening && "shadow-[inset_0_0_20px_rgba(255,255,255,0.04)]",
          )}
          aria-label={ariaLabel}
        >
          {isListening ? (
            <PremiumMicIcon variant="light" className="h-8 w-8 scale-105" />
          ) : (
            <PremiumMicWithSparkle />
          )}
        </button>
      </div>
    </div>
  );
}
