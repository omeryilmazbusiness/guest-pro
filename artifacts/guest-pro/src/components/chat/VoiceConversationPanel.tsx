/**
 * VoiceConversationPanel
 * Premium bottom panel shown when voice conversation mode is active.
 */

import { Square, Volume2, Loader2, WifiOff, X } from "lucide-react";
import { PremiumMicIcon } from "@/components/guest/icons/PremiumMicIcon";
import { SonicWaveform } from "@/components/ui/sonic-waveform";
import { cn } from "@/lib/utils";
import type { ConversationState } from "@/hooks/use-voice-conversation";
import type { VoiceCapabilityModel } from "@/lib/voice/capability";

export interface VoicePanelLabels {
  starting: string;
  listening: string;
  thinking: string;
  speaking: string;
  tapInterrupt: string;
  tapRetry: string;
  notSupported: string;
  modeLabel: string;
  speakingFooter: string;
  processingFooter: string;
  endLabel: string;
}

const statusClass =
  "font-serif text-[11px] italic font-medium tracking-[0.03em] text-zinc-500";
const footerClass =
  "font-serif text-[10px] italic font-medium tracking-[0.04em] text-zinc-400";

interface VoiceConversationPanelProps {
  state: ConversationState;
  transcript: string;
  amplitude: number;
  capability: VoiceCapabilityModel;
  errorMessage: string | null;
  labels: VoicePanelLabels;
  onStop: () => void;
  onInterrupt: () => void;
  onRetry: () => void;
}

function stateConfig(
  state: ConversationState,
  labels: VoicePanelLabels,
): { label: string; sublabel?: string; icon: React.ReactNode; color: string } {
  const map: Record<
    ConversationState,
    { label: string; sublabel?: string; icon: React.ReactNode; color: string }
  > = {
    starting: {
      label: labels.starting,
      icon: <Loader2 className="h-6 w-6 animate-spin" />,
      color: "text-zinc-400",
    },
    listening: {
      label: labels.listening,
      icon: <PremiumMicIcon variant="dark" className="h-6 w-6" />,
      color: "text-zinc-900",
    },
    processing: {
      label: labels.thinking,
      icon: <Loader2 className="h-6 w-6 animate-spin" />,
      color: "text-zinc-500",
    },
    speaking: {
      label: labels.speaking,
      sublabel: labels.tapInterrupt,
      icon: <Volume2 className="h-6 w-6" />,
      color: "text-zinc-700",
    },
    idle: {
      label: labels.listening,
      icon: <PremiumMicIcon variant="dark" className="h-6 w-6" />,
      color: "text-zinc-400",
    },
    stopped: {
      label: labels.speaking,
      icon: <Square className="h-6 w-6" />,
      color: "text-zinc-300",
    },
    error: {
      label: labels.thinking,
      sublabel: labels.tapRetry,
      icon: <WifiOff className="h-6 w-6" />,
      color: "text-red-500",
    },
    unsupported: {
      label: labels.notSupported,
      icon: <WifiOff className="h-6 w-6" />,
      color: "text-zinc-400",
    },
  };
  return map[state] ?? map.idle;
}

export function VoiceConversationPanel({
  state,
  transcript,
  amplitude,
  capability,
  errorMessage,
  labels,
  onStop,
  onInterrupt,
  onRetry,
}: VoiceConversationPanelProps) {
  const config = stateConfig(state, labels);
  const isListening = state === "listening";
  const isSpeaking = state === "speaking";
  const isProcessing = state === "processing";
  const isError = state === "error";
  const isUnsupported = state === "unsupported";

  if (isUnsupported) {
    return (
      <div className="rounded-3xl border border-zinc-100 bg-white px-5 py-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100">
            <WifiOff className="h-4 w-4 text-zinc-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-medium text-zinc-700">Voice not available</p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-zinc-400">
              {capability.isPwa
                ? "Voice recognition may be limited in home-screen mode. Try opening in Safari or Chrome."
                : "Your browser doesn't support voice input. Please type your message."}
            </p>
          </div>
          <button
            type="button"
            onClick={onStop}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-zinc-300 transition-colors hover:text-zinc-500"
          >
            <X className="h-4 w-4" />
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
    <div className="overflow-hidden rounded-3xl border border-zinc-100 bg-white shadow-sm">
      <div className="flex flex-col items-center gap-4 px-5 py-5">
        <div className="relative flex h-28 w-full max-w-[17rem] items-center justify-center">
          {(isListening || isSpeaking) && (
            <SonicWaveform
              amplitude={amplitude}
              active
              simulate={isSpeaking}
              className="rounded-2xl"
            />
          )}

          {isListening || isSpeaking ? (
            <button
              type="button"
              onClick={isSpeaking ? handleCenterTap : undefined}
              disabled={isListening}
              className={cn(
                "relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-[0_4px_20px_-4px_rgba(99,102,241,0.25),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-sm transition-all duration-200",
                isSpeaking && "cursor-pointer active:scale-95 hover:shadow-[0_6px_24px_-4px_rgba(99,102,241,0.3)]",
                isListening && "cursor-default",
              )}
              aria-label={isSpeaking ? "Tap to interrupt" : config.label}
            >
              <span className={config.color}>{config.icon}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCenterTap}
              disabled={isProcessing}
              className={cn(
                "relative z-10 flex h-14 w-14 items-center justify-center rounded-full transition-all duration-200 active:scale-95",
                isError
                  ? "cursor-pointer bg-red-50 text-red-500 hover:bg-red-100"
                  : isProcessing
                    ? "cursor-default bg-zinc-50 text-zinc-400"
                    : "cursor-default bg-zinc-100 text-zinc-400",
              )}
              aria-label={config.label}
            >
              <span className={config.color}>{config.icon}</span>
            </button>
          )}
        </div>

        <div className="space-y-1 text-center">
          <p className={cn(statusClass, isError && "text-red-400")}>{config.label}</p>
          {isError && errorMessage ? (
            <p className="max-w-[220px] text-center font-serif text-[10px] italic leading-snug text-red-400/90">
              {errorMessage}
            </p>
          ) : config.sublabel ? (
            <p className={footerClass}>{config.sublabel}</p>
          ) : null}
        </div>

        {isListening && transcript && (
          <div className="flex min-h-[40px] w-full items-center justify-center rounded-2xl bg-zinc-50 px-4 py-2.5">
            <p className="line-clamp-2 text-center text-[13px] italic leading-snug text-zinc-500">
              &ldquo;{transcript}&rdquo;
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-zinc-50 px-5 py-2.5">
        <p className={footerClass}>
          {isSpeaking
            ? labels.speakingFooter
            : isProcessing
              ? labels.processingFooter
              : labels.modeLabel}
        </p>
        <button
          type="button"
          onClick={onStop}
          className={cn(
            footerClass,
            "flex items-center gap-1 rounded-lg px-2 py-1 transition-colors hover:bg-zinc-50 hover:text-zinc-600 active:scale-95",
          )}
        >
          <Square className="h-2.5 w-2.5 fill-current opacity-70" />
          {labels.endLabel}
        </button>
      </div>
    </div>
  );
}
