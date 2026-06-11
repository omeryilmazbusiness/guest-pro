import type { ReactNode } from "react";
import { GuestVoiceMicHero } from "@/components/guest/GuestVoiceMicHero";
import { GlassEffect } from "@/components/ui/liquid-glass";
import { cn } from "@/lib/utils";

interface GuestVoiceTalkCardProps {
  voiceLabel: string;
  title?: string;
  subtitle: string;
  statusText: string;
  isListening: boolean;
  amplitude?: number;
  onMicClick: () => void;
  micAriaLabel: string;
  sttSupported?: boolean;
  footer?: ReactNode;
  /** Dashboard hero uses liquid glass + vivid wave motion. */
  variant?: "default" | "liquid";
  className?: string;
}

function DecorativeDots({ className }: { className?: string }) {
  return (
    <div
      className={cn("pointer-events-none grid grid-cols-3 gap-[3px]", className)}
      aria-hidden
    >
      {Array.from({ length: 9 }).map((_, i) => (
        <span key={i} className="h-[3px] w-[3px] rounded-full bg-zinc-300/70" />
      ))}
    </div>
  );
}

function TalkCardContent({
  voiceLabel,
  title,
  subtitle,
  statusText,
  isListening,
  amplitude,
  onMicClick,
  micAriaLabel,
  sttSupported,
  footer,
  isLiquid,
}: {
  voiceLabel: string;
  title?: string;
  subtitle: string;
  statusText: string;
  isListening: boolean;
  amplitude: number;
  onMicClick: () => void;
  micAriaLabel: string;
  sttSupported: boolean;
  footer?: ReactNode;
  isLiquid: boolean;
}) {
  return (
    <>
      <DecorativeDots className="absolute right-5 top-5 opacity-40" />
      <DecorativeDots className="absolute -right-1 top-8 opacity-25" />

      <div className="relative mb-3">
        <span
          className="absolute -top-1.5 left-1/2 h-1 w-1 -translate-x-[0.35rem] rounded-full bg-red-500/80"
          aria-hidden
        />
        <p
          className={cn(
            "font-semibold uppercase tracking-[0.18em]",
            isLiquid ? "text-[11px] text-zinc-500" : "text-[10px] text-zinc-400",
          )}
        >
          {voiceLabel}
        </p>
      </div>

      {title ? (
        <h2
          className={cn(
            "font-serif font-semibold tracking-tight text-zinc-900",
            isLiquid ? "text-[30px] leading-tight" : "text-[26px]",
          )}
        >
          {title}
        </h2>
      ) : null}

      <p
        className={cn(
          "mx-auto max-w-[18rem] leading-relaxed",
          isLiquid ? "text-[13px] text-zinc-600" : "text-[12px] text-zinc-500",
          title ? "mt-2" : "mt-0",
        )}
      >
        {subtitle}
      </p>

      {sttSupported && (
        <GuestVoiceMicHero
          className={cn(title ? "mt-5" : "mt-3.5", "mb-1")}
          isListening={isListening}
          amplitude={amplitude}
          onClick={onMicClick}
          ariaLabel={micAriaLabel}
          waveIntensity={isLiquid ? "vivid" : "normal"}
        />
      )}

      <p
        className={cn(
          "min-h-[18px] leading-relaxed",
          isLiquid ? "text-[12px] font-medium text-zinc-600" : "text-[11px] text-zinc-500",
        )}
      >
        {statusText}
      </p>

      {footer ? <div className="relative mt-3">{footer}</div> : null}
    </>
  );
}

/** Premium iOS-style voice card shared by guest home and AI chat empty state. */
export function GuestVoiceTalkCard({
  voiceLabel,
  title,
  subtitle,
  statusText,
  isListening,
  amplitude = 0,
  onMicClick,
  micAriaLabel,
  sttSupported = true,
  footer,
  variant = "default",
  className,
}: GuestVoiceTalkCardProps) {
  const isLiquid = variant === "liquid";

  if (isLiquid) {
    return (
      <div className={cn("relative", className)} data-testid="guest-voice-talk-card">
        <GlassEffect
          interactive={false}
          className="rounded-[28px] shadow-[0_18px_48px_-20px_rgba(0,0,0,0.14),0_6px_16px_-8px_rgba(0,0,0,0.08)]"
          style={{
            boxShadow:
              "0 18px 48px -18px rgba(0, 0, 0, 0.13), 0 6px 16px -6px rgba(0, 0, 0, 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.88)",
          }}
        >
          <div className="relative overflow-hidden px-5 pb-5 pt-6 text-center">
            <TalkCardContent
              voiceLabel={voiceLabel}
              title={title}
              subtitle={subtitle}
              statusText={statusText}
              isListening={isListening}
              amplitude={amplitude}
              onMicClick={onMicClick}
              micAriaLabel={micAriaLabel}
              sttSupported={sttSupported}
              footer={footer}
              isLiquid
            />
          </div>
        </GlassEffect>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[28px] border border-white/80 bg-white/95 px-5 pb-5 pt-6 text-center",
        "shadow-[0_20px_50px_-20px_rgba(0,0,0,0.14),0_1px_0_rgba(255,255,255,0.9)_inset]",
        "backdrop-blur-xl",
        className,
      )}
      data-testid="guest-voice-talk-card"
    >
      <TalkCardContent
        voiceLabel={voiceLabel}
        title={title}
        subtitle={subtitle}
        statusText={statusText}
        isListening={isListening}
        amplitude={amplitude}
        onMicClick={onMicClick}
        micAriaLabel={micAriaLabel}
        sttSupported={sttSupported}
        footer={footer}
        isLiquid={false}
      />
    </div>
  );
}
