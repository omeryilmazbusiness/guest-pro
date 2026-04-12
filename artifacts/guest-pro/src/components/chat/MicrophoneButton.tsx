/**
 * MicrophoneButton
 * Toggle button to start / stop voice conversation mode.
 *
 * Variants:
 *   hero     — large centered button shown on empty chat state
 *   inline   — compact button inside the input bar
 *
 * States communicated via props:
 *   isConversationActive — conversation loop is running (any state)
 *   isListening          — microphone is actively capturing
 */

import { Mic, Square } from "lucide-react";

interface MicrophoneButtonProps {
  /** True while the conversation loop is running (any inner state) */
  isConversationActive: boolean;
  /** True specifically while mic is open and listening */
  isListening?: boolean;
  /** 0–1 amplitude for pulse animation while listening */
  amplitude?: number;
  /** True if STT is supported in this browser */
  isSupported: boolean;
  /** Toggle conversation on/off */
  onToggle: () => void;
  size?: "sm" | "md" | "lg";
  variant?: "hero" | "inline";
  label?: string;
}

export function MicrophoneButton({
  isConversationActive,
  isListening = false,
  amplitude = 0,
  isSupported,
  onToggle,
  size = "md",
  variant = "inline",
  label,
}: MicrophoneButtonProps) {
  if (!isSupported) return null;

  const ringScale = 1 + Math.min(amplitude * 0.6, 0.6);

  if (variant === "hero") {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="relative flex items-center justify-center">
          {/* Amplitude ring */}
          {isListening && (
            <div
              className="absolute rounded-full bg-zinc-200/60 transition-transform duration-100 pointer-events-none"
              style={{ width: 80, height: 80, transform: `scale(${ringScale})` }}
            />
          )}
          {isListening && (
            <div
              className="absolute rounded-full bg-zinc-300/40 transition-transform duration-150 pointer-events-none"
              style={{ width: 64, height: 64, transform: `scale(${1 + Math.min(amplitude * 0.3, 0.3)})` }}
            />
          )}

          <button
            onClick={onToggle}
            className={`
              relative z-10 w-14 h-14 rounded-full flex items-center justify-center
              transition-all duration-200 active:scale-95
              ${isConversationActive
                ? "bg-zinc-900 text-white shadow-lg shadow-zinc-900/25"
                : "bg-white border-2 border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 shadow-sm"
              }
            `}
            aria-label={isConversationActive ? "End voice conversation" : "Start voice conversation"}
          >
            {isConversationActive ? (
              <Square className="w-5 h-5 fill-current" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </button>
        </div>

        <p className="text-[12px] text-zinc-400">
          {label ?? (isConversationActive ? "Tap to stop" : "Voice")}
        </p>
      </div>
    );
  }

  // Inline variant — used in the input bar
  const sizeClass = size === "sm" ? "w-10 h-10" : size === "lg" ? "w-14 h-14" : "w-12 h-12";
  const iconSize = size === "sm" ? "w-4 h-4" : size === "lg" ? "w-6 h-6" : "w-5 h-5";

  return (
    <div className="relative flex items-center justify-center">
      {isListening && (
        <div
          className="absolute rounded-full bg-zinc-200/50 transition-transform duration-100 pointer-events-none"
          style={{ width: 48, height: 48, transform: `scale(${ringScale})` }}
        />
      )}
      <button
        onClick={onToggle}
        className={`
          relative z-10 ${sizeClass} rounded-2xl flex items-center justify-center
          transition-all duration-200 active:scale-95
          ${isConversationActive
            ? "bg-zinc-900 text-white"
            : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
          }
        `}
        aria-label={isConversationActive ? "End voice conversation" : "Start voice conversation"}
      >
        {isConversationActive ? (
          <Square className={`${iconSize} fill-current`} />
        ) : (
          <Mic className={iconSize} />
        )}
      </button>
    </div>
  );
}
