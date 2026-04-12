/**
 * VoiceConversationPanel
 * Premium bottom panel shown when voice conversation mode is active.
 *
 * Shows the current conversation state with calm, minimal visuals:
 *   - Amplitude rings during listening
 *   - Status label for each state
 *   - Live transcript preview
 *   - Tap-to-interrupt during speaking
 *   - Stop button always visible
 *   - Unsupported / fallback notice
 */

import { Mic, Square, Volume2, Loader2, WifiOff, X } from "lucide-react";
import type { ConversationState } from "@/hooks/use-voice-conversation";
import type { VoiceCapabilityModel } from "@/lib/voice/capability";

interface VoiceConversationPanelProps {
  state: ConversationState;
  transcript: string;
  amplitude: number;
  capability: VoiceCapabilityModel;
  errorMessage: string | null;
  onStop: () => void;
  onInterrupt: () => void;
  onRetry: () => void;
}

// ─── State config ─────────────────────────────────────────────────────────────

const STATE_CONFIG: Record<
  ConversationState,
  { label: string; sublabel?: string; icon: React.ReactNode; color: string }
> = {
  listening: {
    label: "Listening",
    sublabel: "Speak now",
    icon: <Mic className="w-6 h-6" />,
    color: "text-zinc-900",
  },
  processing: {
    label: "Thinking",
    sublabel: "Getting a response",
    icon: <Loader2 className="w-6 h-6 animate-spin" />,
    color: "text-zinc-500",
  },
  speaking: {
    label: "Speaking",
    sublabel: "Tap to interrupt",
    icon: <Volume2 className="w-6 h-6" />,
    color: "text-zinc-700",
  },
  idle: {
    label: "Ready",
    sublabel: "Tap to start",
    icon: <Mic className="w-6 h-6" />,
    color: "text-zinc-400",
  },
  stopped: {
    label: "Stopped",
    icon: <Square className="w-6 h-6" />,
    color: "text-zinc-300",
  },
  error: {
    label: "Error",
    sublabel: "Tap to retry",
    icon: <WifiOff className="w-6 h-6" />,
    color: "text-red-500",
  },
  unsupported: {
    label: "Not supported",
    sublabel: "Use text input instead",
    icon: <WifiOff className="w-6 h-6" />,
    color: "text-zinc-400",
  },
};

// ─── Amplitude rings ──────────────────────────────────────────────────────────

function AmplitudeRings({ amplitude, listening }: { amplitude: number; listening: boolean }) {
  if (!listening) return null;

  const outerScale = 1 + Math.min(amplitude * 0.65, 0.65);
  const midScale = 1 + Math.min(amplitude * 0.35, 0.35);

  return (
    <>
      <div
        className="absolute rounded-full bg-zinc-200/50 transition-transform duration-100 pointer-events-none"
        style={{ width: 96, height: 96, transform: `scale(${outerScale})` }}
      />
      <div
        className="absolute rounded-full bg-zinc-300/40 transition-transform duration-150 pointer-events-none"
        style={{ width: 76, height: 76, transform: `scale(${midScale})` }}
      />
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function VoiceConversationPanel({
  state,
  transcript,
  amplitude,
  capability,
  errorMessage,
  onStop,
  onInterrupt,
  onRetry,
}: VoiceConversationPanelProps) {
  const config = STATE_CONFIG[state] ?? STATE_CONFIG.idle;
  const isListening = state === "listening";
  const isSpeaking = state === "speaking";
  const isProcessing = state === "processing";
  const isError = state === "error";
  const isUnsupported = state === "unsupported";

  // Unsupported notice — static, no interactive elements
  if (isUnsupported) {
    return (
      <div className="bg-white border border-zinc-100 rounded-3xl px-5 py-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center shrink-0 mt-0.5">
            <WifiOff className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-medium text-zinc-700">
              Voice not available
            </p>
            <p className="text-[12px] text-zinc-400 mt-0.5 leading-relaxed">
              {capability.isPwa
                ? "Voice recognition may be limited in home-screen mode. Try opening in Safari or Chrome."
                : "Your browser doesn't support voice input. Please type your message."}
            </p>
          </div>
          <button
            onClick={onStop}
            className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-zinc-300 hover:text-zinc-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const handleCenterTap = () => {
    if (isSpeaking) onInterrupt();
    if (isError) onRetry();
  };

  return (
    <div className="bg-white border border-zinc-100 rounded-3xl shadow-sm overflow-hidden">
      {/* Main voice area */}
      <div className="px-5 py-5 flex flex-col items-center gap-4">
        {/* Central indicator */}
        <div className="relative flex items-center justify-center h-24 w-24">
          <AmplitudeRings amplitude={amplitude} listening={isListening} />

          <button
            onClick={handleCenterTap}
            disabled={isProcessing || isListening}
            className={`
              relative z-10 w-14 h-14 rounded-full flex items-center justify-center
              transition-all duration-200 active:scale-95
              ${isListening
                ? "bg-zinc-900 text-white shadow-lg shadow-zinc-900/20 cursor-default"
                : isSpeaking
                ? "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 cursor-pointer"
                : isError
                ? "bg-red-50 text-red-500 hover:bg-red-100 cursor-pointer"
                : isProcessing
                ? "bg-zinc-50 text-zinc-400 cursor-default"
                : "bg-zinc-100 text-zinc-400 cursor-default"
              }
            `}
            aria-label={isSpeaking ? "Tap to interrupt" : config.label}
          >
            <span className={config.color}>{config.icon}</span>
          </button>
        </div>

        {/* Status text */}
        <div className="text-center space-y-0.5">
          <p className={`text-[15px] font-semibold ${config.color}`}>
            {config.label}
          </p>
          {isError && errorMessage ? (
            <p className="text-[12px] text-red-400 leading-snug max-w-[220px] text-center">
              {errorMessage}
            </p>
          ) : config.sublabel ? (
            <p className="text-[12px] text-zinc-400">{config.sublabel}</p>
          ) : null}
        </div>

        {/* Live transcript */}
        {isListening && transcript && (
          <div className="w-full bg-zinc-50 rounded-2xl px-4 py-2.5 min-h-[40px] flex items-center justify-center">
            <p className="text-[13px] text-zinc-500 italic text-center line-clamp-2 leading-snug">
              "{transcript}"
            </p>
          </div>
        )}
      </div>

      {/* Footer: Stop button */}
      <div className="border-t border-zinc-50 px-5 py-3 flex items-center justify-between">
        <p className="text-[11px] text-zinc-400 font-medium uppercase tracking-wide">
          {isListening ? "Voice Conversation" : isSpeaking ? "AI is speaking — tap circle to interrupt" : isProcessing ? "Sending to AI…" : "Voice Conversation"}
        </p>
        <button
          onClick={onStop}
          className="flex items-center gap-1.5 text-[12px] font-medium text-zinc-500 hover:text-zinc-900 transition-colors px-3 py-1.5 rounded-xl hover:bg-zinc-50 active:scale-95"
        >
          <Square className="w-3 h-3 fill-current" />
          End
        </button>
      </div>
    </div>
  );
}
