import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { PremiumMicIcon } from "@/components/guest/icons/PremiumMicIcon";
import { cn } from "@/lib/utils";
import { GUEST_OVERLAY_FADE } from "@/lib/guest-motion";

const SPECTRUM_RING =
  "conic-gradient(from 210deg, #34d399 0deg, #22d3ee 52deg, #6366f1 118deg, #d946ef 188deg, #fb7185 248deg, #fbbf24 308deg, #34d399 360deg)";

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
  const bloomScale = listening ? 1 + Math.min(amplitude * 0.4, 0.4) : 1;
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
            className="absolute inset-0 bg-black/72 backdrop-blur-md"
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
            <div className="overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-zinc-950 shadow-[0_32px_80px_-24px_rgba(0,0,0,0.85)]">
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-24 opacity-40"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(99,102,241,0.22) 0%, rgba(34,211,238,0.08) 45%, transparent 100%)",
                }}
                aria-hidden
              />

              <div className="relative flex flex-col items-center px-6 pb-6 pt-8">
                <div className="relative mb-6 flex h-[5.5rem] w-[5.5rem] items-center justify-center">
                  <div
                    className="absolute inset-0 rounded-full blur-2xl opacity-60"
                    style={{
                      background: SPECTRUM_RING,
                      transform: `scale(${bloomScale})`,
                    }}
                    aria-hidden
                  />
                  <div
                    className="relative rounded-full p-[2px] shadow-[0_0_40px_rgba(99,102,241,0.35)]"
                    style={{ background: SPECTRUM_RING }}
                  >
                    <div
                      className={cn(
                        "flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-black",
                        listening && "guest-voice-pulse",
                      )}
                    >
                      <PremiumMicIcon variant="light" className="h-7 w-7" />
                    </div>
                  </div>
                </div>

                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  {listening ? listeningLabel : subtitle}
                </p>

                <div className="mt-5 min-h-[4.5rem] w-full rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-4 text-center">
                  {displayText ? (
                    <p className="text-[17px] font-medium leading-relaxed text-white">
                      <span className="text-zinc-500">&ldquo;</span>
                      {displayText}
                      <span className="text-zinc-500">&rdquo;</span>
                      {listening && (
                        <span className="ms-0.5 inline-block h-[1.1em] w-[2px] animate-pulse bg-teal-400 align-[-2px]" />
                      )}
                    </p>
                  ) : (
                    <p className="text-[14px] leading-relaxed text-zinc-500">{subtitle}</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={onCancel}
                  className="mt-6 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-[13px] font-semibold text-zinc-300 transition-colors hover:bg-white/[0.08] hover:text-white"
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
