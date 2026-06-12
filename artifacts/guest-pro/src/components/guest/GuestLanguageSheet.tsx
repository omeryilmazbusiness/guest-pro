import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  GUEST_LANGUAGE_OPTIONS,
  type GuestUiLocale,
} from "@/lib/guest-locale";
import { GuestPremiumSheet } from "@/components/guest/GuestPremiumSheet";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { triggerHaptic } from "@/lib/haptic";

interface GuestLanguageSheetProps {
  open: boolean;
  onClose: () => void;
  currentLocale: GuestUiLocale;
  onSelect: (locale: GuestUiLocale) => void;
  title: string;
  cancelLabel: string;
}

export function GuestLanguageSheet({
  open,
  onClose,
  currentLocale,
  onSelect,
  title,
  cancelLabel,
}: GuestLanguageSheetProps) {
  const handleOpenChange = (next: boolean) => {
    if (!next) onClose();
  };

  return (
    <GuestPremiumSheet
      open={open}
      onOpenChange={handleOpenChange}
      ariaLabel={title}
      placement="center"
      className="flex max-h-[min(85dvh,560px)] flex-col gap-0 p-0"
    >
      <div className="border-b border-zinc-100 px-5 pb-4 pt-5 text-center">
        <h2 className="text-[17px] font-semibold tracking-tight text-zinc-900">{title}</h2>
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2"
        role="listbox"
        aria-label={title}
      >
        {GUEST_LANGUAGE_OPTIONS.map((lang) => {
          const isActive = lang.code === currentLocale;
          return (
            <button
              key={lang.code}
              type="button"
              role="option"
              aria-selected={isActive}
              onClick={() => {
                triggerHaptic("light");
                onSelect(lang.code);
                onClose();
              }}
              className={cn(
                "guest-tactile-pill flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-start transition-all duration-200",
                isActive
                  ? "bg-zinc-950 text-white shadow-sm"
                  : "text-zinc-800 hover:bg-zinc-50 active:scale-[0.98]",
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                  isActive ? "bg-white/10" : "bg-zinc-100",
                )}
              >
                <CountryFlag code={lang.flagCode} size="md" />
              </span>
              <span className="flex-1 text-[15px] font-medium">{lang.label}</span>
              {isActive && (
                <Check className="h-4 w-4 shrink-0 text-white/70" strokeWidth={2} />
              )}
            </button>
          );
        })}
      </div>

      <div className="border-t border-zinc-100 p-2">
        <button
          type="button"
          onClick={onClose}
          className="guest-tactile-pill w-full rounded-xl py-3 text-[14px] font-medium text-zinc-500 transition-all hover:bg-zinc-50 active:scale-[0.98]"
        >
          {cancelLabel}
        </button>
      </div>
    </GuestPremiumSheet>
  );
}
