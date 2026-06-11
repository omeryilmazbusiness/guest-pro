import { useId } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GuestVoiceWaveformProps {
  isListening?: boolean;
  amplitude?: number;
  intensity?: "normal" | "vivid";
  className?: string;
}

/** Horizontal Siri-style spectrum wave — amplitude-reactive when listening. */
export function GuestVoiceWaveform({
  isListening = false,
  amplitude = 0,
  intensity = "normal",
  className,
}: GuestVoiceWaveformProps) {
  const uid = useId().replace(/:/g, "");
  const reduceMotion = useReducedMotion();
  const isVivid = intensity === "vivid";
  const amp = Math.min(Math.max(amplitude, 0), 1);

  const scaleY = isListening
    ? 1 + amp * 0.75
    : isVivid
      ? 1.02
      : 1;
  const scaleX = isListening ? 1 + amp * 0.42 : 1;
  const glowOpacity = isListening ? 0.55 + amp * 0.4 : isVivid ? 0.5 : 0.38;

  const motionClass = reduceMotion
    ? ""
    : cn(
        isListening ? "guest-voice-wave-active" : "guest-voice-wave-idle",
        isVivid && "guest-voice-wave-vivid",
      );

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 flex items-center justify-center",
        motionClass,
        className,
      )}
      aria-hidden
      style={{
        transform: `scaleX(${scaleX}) scaleY(${scaleY})`,
        transition: isListening ? "transform 80ms ease-out" : undefined,
      }}
    >
      <div
        className={cn(
          "guest-voice-ambient-glow absolute rounded-full",
          isVivid ? "h-[6.5rem] w-[min(18rem,92%)]" : "h-[5.5rem] w-[min(16rem,80%)]",
          !reduceMotion && "guest-voice-ambient-glow--animate",
        )}
        style={{
          opacity: glowOpacity,
          background: isVivid
            ? "radial-gradient(ellipse 72% 58% at 50% 50%, rgba(99,102,241,0.22) 0%, rgba(56,189,248,0.12) 42%, rgba(168,85,247,0.08) 62%, transparent 76%)"
            : "radial-gradient(ellipse 70% 55% at 50% 50%, rgba(99,102,241,0.18) 0%, rgba(56,189,248,0.1) 42%, transparent 72%)",
          transition: isListening ? "opacity 80ms ease-out" : undefined,
        }}
      />

      <svg
        viewBox="0 0 320 72"
        className={cn(
          "relative",
          isVivid ? "h-[5.25rem] w-[min(20rem,96%)]" : "h-[4.5rem] w-[min(19rem,92%)]",
        )}
        preserveAspectRatio="xMidYMid meet"
        style={{
          opacity: isListening ? 0.88 + amp * 0.12 : isVivid ? 0.9 : 0.82,
          transition: isListening ? "opacity 80ms ease-out" : undefined,
        }}
      >
        <defs>
          <linearGradient id={`${uid}-blue`} x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
            <stop offset="22%" stopColor="#38bdf8" stopOpacity={isVivid ? "0.5" : "0.45"} />
            <stop offset="50%" stopColor="#6366f1" stopOpacity={isVivid ? "0.72" : "0.65"} />
            <stop offset="78%" stopColor="#a855f7" stopOpacity={isVivid ? "0.45" : "0.38"} />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${uid}-violet`} x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0" />
            <stop offset="30%" stopColor="#818cf8" stopOpacity={isVivid ? "0.4" : "0.35"} />
            <stop offset="50%" stopColor="#c084fc" stopOpacity={isVivid ? "0.58" : "0.5"} />
            <stop offset="70%" stopColor="#f472b6" stopOpacity={isVivid ? "0.35" : "0.28"} />
            <stop offset="100%" stopColor="#fb923c" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${uid}-amber`} x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0" />
            <stop offset="35%" stopColor="#fbbf24" stopOpacity={isVivid ? "0.3" : "0.25"} />
            <stop offset="50%" stopColor="#fb923c" stopOpacity={isVivid ? "0.42" : "0.35"} />
            <stop offset="65%" stopColor="#f472b6" stopOpacity={isVivid ? "0.25" : "0.2"} />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </linearGradient>
          <filter id={`${uid}-blur-soft`} x="-20%" y="-80%" width="140%" height="260%">
            <feGaussianBlur stdDeviation={isVivid ? "3.8" : "3.2"} />
          </filter>
          <filter id={`${uid}-blur-tight`} x="-10%" y="-50%" width="120%" height="200%">
            <feGaussianBlur stdDeviation={isVivid ? "2" : "1.6"} />
          </filter>
        </defs>

        <g filter={`url(#${uid}-blur-soft)`} opacity={isVivid ? 0.78 : 0.68}>
          <g className={cn(!reduceMotion && "guest-voice-wave-layer guest-voice-wave-layer--back")}>
            <path
              d="M0 36 C 28 36, 52 14, 96 22 C 132 28, 148 48, 160 36 C 172 24, 188 8, 224 18 C 264 30, 292 36, 320 36 L 320 42 C 292 42, 264 36, 224 48 C 188 58, 172 48, 160 36 C 148 24, 132 44, 96 50 C 52 58, 28 36, 0 36 Z"
              fill={`url(#${uid}-blue)`}
            />
          </g>
        </g>

        <g filter={`url(#${uid}-blur-tight)`} opacity={isVivid ? 0.86 : 0.78}>
          <g className={cn(!reduceMotion && "guest-voice-wave-layer guest-voice-wave-layer--mid")}>
            <path
              d="M0 36 C 36 36, 64 20, 108 26 C 140 30, 152 44, 160 36 C 168 28, 180 16, 212 24 C 248 34, 284 36, 320 36 L 320 40 C 284 40, 248 38, 212 46 C 180 54, 168 44, 160 36 C 152 28, 140 42, 108 46 C 64 52, 36 36, 0 36 Z"
              fill={`url(#${uid}-violet)`}
            />
          </g>
        </g>

        <g opacity={isVivid ? 0.7 : 0.58}>
          <g className={cn(!reduceMotion && "guest-voice-wave-layer guest-voice-wave-layer--front")}>
            <path
              d="M0 36 C 44 36, 72 28, 120 30 C 144 31, 154 40, 160 36 C 166 32, 176 24, 200 28 C 244 34, 276 36, 320 36 L 320 38 C 276 38, 244 36, 200 40 C 176 44, 166 40, 160 36 C 154 32, 144 40, 120 42 C 72 44, 44 36, 0 36 Z"
              fill={`url(#${uid}-amber)`}
            />
          </g>
        </g>
      </svg>
    </div>
  );
}
