/**
 * Centered modal shell with iOS-style motion (manager detail popups).
 */

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { IOS_EASE, PANEL_SPRING } from "@/lib/manager-motion";

interface ManagerCenterSheetProps {
  open: boolean;
  onClose: () => void;
  ariaLabel: string;
  closeLabel: string;
  children: React.ReactNode;
  className?: string;
}

export function ManagerCenterSheet({
  open,
  onClose,
  ariaLabel,
  closeLabel,
  children,
  className,
}: ManagerCenterSheetProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          className={cn(
            "fixed inset-0 z-[120] flex items-center justify-center",
            "px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]",
          )}
          role="presentation"
        >
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: IOS_EASE }}
            className="absolute inset-0 bg-black/50 backdrop-blur-[3px]"
            aria-label={closeLabel}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={PANEL_SPRING}
            className={cn(
              "relative z-10 flex w-full max-w-sm flex-col overflow-hidden rounded-3xl bg-white shadow-2xl shadow-black/20 isolate",
              "max-h-[min(88dvh,560px)]",
              className,
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-900"
              aria-label={closeLabel}
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
