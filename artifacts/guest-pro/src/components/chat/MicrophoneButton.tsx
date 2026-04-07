import { Mic, MicOff, Square } from "lucide-react";

interface MicrophoneButtonProps {
  isListening: boolean;
  isSupported: boolean;
  amplitude: number;
  transcript?: string;
  onToggle: () => void;
  size?: "sm" | "md" | "lg";
  variant?: "hero" | "inline";
}

/**
 * Premium animated microphone button.
 * - Idle: clean mic icon with soft border
 * - Listening: animated rings that pulse based on amplitude, mic active indicator
 * - Uses CSS animations for performance on mobile
 */
export function MicrophoneButton({
  isListening,
  isSupported,
  amplitude,
  transcript,
  onToggle,
  size = "md",
  variant = "inline",
}: MicrophoneButtonProps) {
  if (!isSupported) return null;

  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-7 h-7",
  };

  // Amplitude-driven ring scale: 1 at silence, up to 1.6 at full volume
  const ringScale = 1 + Math.min(amplitude * 0.6, 0.6);

  if (variant === "hero") {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="relative flex items-center justify-center">
          {/* Outer animated ring — amplitude driven */}
          {isListening && (
            <div
              className="absolute rounded-full bg-zinc-200/60 transition-transform duration-100"
              style={{
                width: 80,
                height: 80,
                transform: `scale(${ringScale})`,
              }}
            />
          )}
          {/* Mid ring */}
          {isListening && (
            <div
              className="absolute rounded-full bg-zinc-300/40 transition-transform duration-150"
              style={{
                width: 64,
                height: 64,
                transform: `scale(${1 + Math.min(amplitude * 0.3, 0.3)})`,
              }}
            />
          )}

          <button
            onClick={onToggle}
            className={`
              relative z-10 w-14 h-14 rounded-full flex items-center justify-center
              transition-all duration-200 active:scale-95
              ${isListening
                ? "bg-zinc-900 text-white shadow-lg shadow-zinc-900/25"
                : "bg-white border-2 border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 shadow-sm"
              }
            `}
            aria-label={isListening ? "Stop listening" : "Start voice conversation"}
          >
            {isListening ? (
              <Square className="w-5 h-5 fill-current" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </button>
        </div>

        {isListening && transcript && (
          <p className="text-[13px] text-zinc-500 italic max-w-[200px] text-center truncate">
            "{transcript}"
          </p>
        )}

        <p className="text-[12px] text-zinc-400">
          {isListening ? "Listening… tap to stop" : "Voice"}
        </p>
      </div>
    );
  }

  // Inline variant (used inside chat input bar)
  return (
    <div className="relative flex items-center justify-center">
      {isListening && (
        <div
          className="absolute rounded-full bg-zinc-200/50 transition-transform duration-100 pointer-events-none"
          style={{
            width: 48,
            height: 48,
            transform: `scale(${ringScale})`,
          }}
        />
      )}
      <button
        onClick={onToggle}
        className={`
          relative z-10 ${sizeClasses[size]} rounded-2xl flex items-center justify-center
          transition-all duration-200 active:scale-95
          ${isListening
            ? "bg-zinc-900 text-white"
            : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
          }
        `}
        aria-label={isListening ? "Stop listening" : "Voice input"}
      >
        {isListening ? (
          <MicOff className={iconSizes[size]} />
        ) : (
          <Mic className={iconSizes[size]} />
        )}
      </button>
    </div>
  );
}
