/**
 * GuestMobileNavDrawer — left slide-in menu (mobile dashboard).
 */

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GuestDashboardNavItem } from "@/lib/guest-dashboard-nav";
import { GuestProLogo } from "@/components/GuestProLogo";

const DRAWER_EASE = "duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]";

interface GuestMobileNavDrawerProps {
  open: boolean;
  onClose: () => void;
  items: GuestDashboardNavItem[];
  menuTitle: string;
  appName: string;
  closeLabel: string;
  onSelectItem: (sectionId: string) => void;
}

export function GuestMobileNavDrawer({
  open,
  onClose,
  items,
  menuTitle,
  appName,
  closeLabel,
  onSelectItem,
}: GuestMobileNavDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[110]" role="presentation">
      <button
        type="button"
        className={cn(
          "absolute inset-0 bg-black/50 backdrop-blur-[2px] animate-in fade-in",
          DRAWER_EASE,
        )}
        aria-label={closeLabel}
        onClick={onClose}
      />
      <nav
        id="guest-mobile-nav"
        ref={panelRef}
        tabIndex={-1}
        role="navigation"
        aria-label={menuTitle}
        className={cn(
          "absolute inset-y-0 left-0 flex w-[min(18.5rem,86vw)] flex-col bg-zinc-950 text-white shadow-2xl outline-none",
          "pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]",
          "animate-in slide-in-from-left",
          DRAWER_EASE,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10">
              <GuestProLogo variant="header" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold tracking-tight">{appName}</p>
              <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-500">
                {menuTitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
            aria-label={closeLabel}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <ul className="flex-1 overflow-y-auto overscroll-contain px-2 py-3">
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelectItem(item.sectionId)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors",
                    "hover:bg-white/8 active:bg-white/12 active:scale-[0.99]",
                    "animate-in fade-in slide-in-from-left-2 duration-300",
                  )}
                  style={{ animationDelay: `${Math.min(index * 35, 280)}ms` }}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                    <Icon className="h-[18px] w-[18px] text-white" strokeWidth={1.75} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-medium leading-snug text-white">
                      {item.label}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>,
    document.body,
  );
}
