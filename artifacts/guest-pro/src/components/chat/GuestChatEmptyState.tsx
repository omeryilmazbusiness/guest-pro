import { GuestChatStarterGrid } from "@/components/chat/GuestChatStarterGrid";
import { GuestVoiceMicHero } from "@/components/guest/GuestVoiceMicHero";
import type { ResolvedGuestChatStarter } from "@/lib/guest-chat-starters";

interface GuestChatEmptyStateProps {
  welcomeText: string;
  sectionLabel: string;
  starters: ResolvedGuestChatStarter[];
  onSelectStarter: (starter: ResolvedGuestChatStarter) => void;
  hint: string;
  listeningState: string;
  transcript?: string;
  isListening: boolean;
  amplitude?: number;
  onMicClick: () => void;
  micAriaLabel: string;
  sttSupported: boolean;
}

/** Empty guest chat — iOS starter grid with premium voice mic below. */
export function GuestChatEmptyState({
  welcomeText,
  sectionLabel,
  starters,
  onSelectStarter,
  hint,
  listeningState,
  transcript,
  isListening,
  amplitude = 0,
  onMicClick,
  micAriaLabel,
  sttSupported,
}: GuestChatEmptyStateProps) {
  const statusText = isListening
    ? transcript
      ? `"${transcript}"`
      : listeningState
    : hint;

  return (
    <div
      className="flex w-full max-w-md flex-col items-center animate-in fade-in duration-500"
      data-testid="guest-chat-empty-state"
    >
      <p className="mb-4 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
        {welcomeText}
      </p>

      <GuestChatStarterGrid
        sectionLabel={sectionLabel}
        starters={starters}
        onSelect={onSelectStarter}
      />

      {sttSupported && (
        <div className="mt-5 w-full">
          <GuestVoiceMicHero
            isListening={isListening}
            amplitude={amplitude}
            onClick={onMicClick}
            ariaLabel={micAriaLabel}
            className="h-[6.5rem]"
          />
          <p className="mt-1 min-h-[18px] text-center text-[11px] leading-relaxed text-zinc-500">
            {statusText}
          </p>
        </div>
      )}
    </div>
  );
}
