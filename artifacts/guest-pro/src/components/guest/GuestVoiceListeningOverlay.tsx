import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { PremiumMicIcon } from "@/components/guest/icons/PremiumMicIcon";
import { SonicWaveform } from "@/components/ui/sonic-waveform";
import { GUEST_OVERLAY_FADE } from "@/lib/guest-motion";

interface GuestVoiceListeningOverlayProps {
  open: boolean;
  listening: boolean;
  amplitude?: number;
  transcript: string;
  listeningLabel: string;
  subtitle: string;
  cancelLabel: string;
  onCancel: () => void;
}

export function GuestVoiceListeningOverlay({
  open,
  listening,
  amplitude = 0,
  transcript,
  listeningLabel,
  subtitle,
  cancelLabel,
  onCancel,
}: GuestVoiceListeningOverlayProps) {
  const reduceMotion = useReducedMotion();
  const displayText = transcript.trim();

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center px-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={reduceMotion ? { duration: 0.12 } : GUEST_OVERLAY_FADE}
          role="dialog"
          aria-modal="true"
          aria-label={listeningLabel}
        >
          <motion.button
            type="button"
            className="absolute inset-0 bg-white/72 backdrop-blur-xl"
            aria-label={cancelLabel}
            onClick={onCancel}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            className="relative z-10 w-full max-w-sm"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="overflow-hidden rounded-[1.75rem] border border-zinc-200/90 bg-white/95 shadow-[0_24px_64px_-20px_rgba(0,0,0,0.18)] backdrop-blur-2xl">
              <div className="relative flex flex-col items-center px-6 pb-6 pt-8">
                <div className="relative mb-6 flex h-28 w-full items-center justify-center">
                  <SonicWaveform
                    amplitude={amplitude}
                    active={listening}
                    theme="light"
                    className="rounded-2xl"
                  />
                  <div className="relative z-10 flex h-[4.85rem] w-[4.85rem] items-center justify-center rounded-full bg-white shadow-[0_8px_28px_-8px_rgba(0,0,0,0.14),inset_0_1px_0_rgba(255,255,255,0.95)]">
                    <PremiumMicIcon variant="dark" className="h-8 w-8" />
                  </div>
                </div>

                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
                  {listening ? listeningLabel : subtitle}
                </p>

                <div className="mt-5 min-h-[4.5rem] w-full rounded-2xl border border-zinc-100 bg-zinc-50/80 px-4 py-4 text-center">
                  {displayText ? (
                    <p className="text-[17px] font-medium leading-relaxed text-zinc-900">
                      <span className="text-zinc-400">&ldquo;</span>
                      {displayText}
                      <span className="text-zinc-400">&rdquo;</span>
                      {listening && (
                        <span className="ms-0.5 inline-block h-[1.1em] w-[2px] animate-pulse bg-indigo-400 align-[-2px]" />
                      )}
                    </p>
                  ) : (
                    <p className="text-[14px] leading-relaxed text-zinc-500">{subtitle}</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={onCancel}
                  className="mt-6 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-[13px] font-semibold text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
                >
                  {cancelLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
