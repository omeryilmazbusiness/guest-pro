/**
 * Centered modal shell for nearby place UI (guest + welcoming).
 * Keeps the panel fully on-screen on mobile (safe-area + max-height).
 */

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

const MODAL_EASE = "duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]";

interface NearbyDialogShellProps {
  open: boolean;
  onClose: () => void;
  ariaLabel: string;
  closeLabel: string;
  children: React.ReactNode;
  className?: string;
  onEscape?: () => void;
}

export function NearbyDialogShell({
  open,
  onClose,
  ariaLabel,
  closeLabel,
  children,
  className,
  onEscape,
}: NearbyDialogShellProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (onEscape) onEscape();
      else onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, onEscape]);

  if (!open) return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center",
        "px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]",
      )}
      role="presentation"
    >
      <button
        type="button"
        className={cn(
          "absolute inset-0 bg-black/45 backdrop-blur-sm animate-in fade-in",
          MODAL_EASE,
        )}
        aria-label={closeLabel}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className={cn(
          "relative z-10 flex w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-white shadow-2xl isolate",
          "max-h-[min(90dvh,640px)]",
          "animate-in fade-in zoom-in-95",
          MODAL_EASE,
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
