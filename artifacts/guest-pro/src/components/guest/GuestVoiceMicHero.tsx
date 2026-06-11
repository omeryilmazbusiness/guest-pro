import { SonicWaveform } from "@/components/ui/sonic-waveform";
import { PremiumMicWithSparkle, PremiumMicIcon } from "@/components/guest/icons/PremiumMicIcon";
import { cn } from "@/lib/utils";

interface GuestVoiceMicHeroProps {
  isListening: boolean;
  amplitude?: number;
  onClick: () => void;
  ariaLabel: string;
  waveIntensity?: "normal" | "vivid";
  className?: string;
}

export function GuestVoiceMicHero({
  isListening,
  amplitude = 0,
  onClick,
  ariaLabel,
  waveIntensity = "normal",
  className,
}: GuestVoiceMicHeroProps) {
  const isVivid = waveIntensity === "vivid";

  return (
    <div className={cn("relative flex h-[7rem] w-full items-center justify-center", className)}>
      <div className="absolute inset-x-4 inset-y-2">
        <SonicWaveform
          amplitude={isListening ? amplitude : 0}
          active
          className="rounded-2xl"
        />
      </div>

      <button
        type="button"
        onClick={onClick}
        className={cn(
          "relative z-10 flex items-center justify-center rounded-full",
          "bg-white/92 backdrop-blur-md transition-all duration-300 ease-out active:scale-[0.96]",
          isVivid ? "h-[5.1rem] w-[5.1rem]" : "h-[4.85rem] w-[4.85rem]",
          isVivid
            ? "shadow-[0_10px_32px_-10px_rgba(79,70,229,0.25),inset_0_1px_0_rgba(255,255,255,0.98)]"
            : "shadow-[0_8px_24px_-8px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.95)]",
          isListening &&
            "shadow-[0_8px_28px_-6px_rgba(99,102,241,0.3),inset_0_0_16px_rgba(99,102,241,0.05)]",
        )}
        aria-label={ariaLabel}
      >
        {isListening ? (
          <PremiumMicIcon variant="dark" className="h-8 w-8 scale-105" />
        ) : (
          <PremiumMicWithSparkle variant="dark" />
        )}
      </button>
    </div>
  );
}
