import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { GUEST_MODAL_SPRING, GUEST_OVERLAY_FADE, GUEST_SHEET_SPRING } from "@/lib/guest-motion";

interface GuestPremiumSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
  showClose?: boolean;
  /** bottom = slide-up sheet; center = centered modal */
  placement?: "bottom" | "center";
}

export function GuestPremiumSheet({
  open,
  onOpenChange,
  children,
  className,
  ariaLabel,
  showClose = false,
  placement = "bottom",
}: GuestPremiumSheetProps) {
  const reduceMotion = useReducedMotion();
  const isCenter = placement === "center";

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (typeof document === "undefined") return null;

  const panelInitial = reduceMotion
    ? { opacity: 0 }
    : isCenter
      ? { opacity: 0, scale: 0.94, y: 16 }
      : { opacity: 0, y: "100%" };

  const panelAnimate = reduceMotion
    ? { opacity: 1 }
    : isCenter
      ? { opacity: 1, scale: 1, y: 0 }
      : { opacity: 1, y: 0 };

  const panelExit = reduceMotion
    ? { opacity: 0 }
    : isCenter
      ? { opacity: 0, scale: 0.97, y: 10 }
      : { opacity: 0, y: "100%" };

  const panelTransition = reduceMotion
    ? { duration: 0.15 }
    : isCenter
      ? GUEST_MODAL_SPRING
      : GUEST_SHEET_SPRING;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          className={cn(
            "fixed inset-0 z-50",
            isCenter && "flex items-center justify-center p-4 sm:p-6",
          )}
          role="presentation"
        >
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reduceMotion ? { duration: 0.01 } : GUEST_OVERLAY_FADE}
            className={cn(
              "absolute inset-0 bg-black/40 backdrop-blur-[4px]",
              isCenter && "bg-black/50 backdrop-blur-md",
            )}
            aria-label="Close"
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            initial={panelInitial}
            animate={panelAnimate}
            exit={panelExit}
            transition={panelTransition}
            className={cn(
              "relative z-10 mx-auto w-full max-w-lg outline-none overflow-hidden bg-white shadow-2xl",
              isCenter
                ? "max-h-[min(85dvh,520px)] rounded-[1.35rem] border border-zinc-100/90 shadow-zinc-900/20"
                : "absolute inset-x-0 bottom-0 max-h-[min(92dvh,720px)] rounded-t-[1.5rem] border border-zinc-100/80 shadow-zinc-900/15",
              className,
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {!isCenter && (
              <div className="flex justify-center pt-2.5 pb-1" aria-hidden>
                <span className="h-1 w-10 rounded-full bg-zinc-200/90" />
              </div>
            )}
            {children}
            {(showClose || isCenter) && (
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="absolute right-3.5 top-3.5 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-800"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
