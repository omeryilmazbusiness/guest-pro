import { cn } from "@/lib/utils";
import {
  GUEST_LANGUAGE_OPTIONS,
  type GuestUiLocale,
} from "@/lib/guest-locale";
import { GuestPremiumSheet } from "@/components/guest/GuestPremiumSheet";
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
      className="gap-0 p-0"
    >
      <div className="border-b border-zinc-100 px-4 pb-3 pt-0 text-start">
        <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
      </div>

      <div className="p-2" role="listbox" aria-label={title}>
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
                "guest-tactile-pill flex w-full items-center gap-3 rounded-xl px-3 py-3 text-start transition-all duration-200",
                isActive
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-800 hover:bg-zinc-50 active:scale-[0.98]",
              )}
            >
              <span className="text-lg leading-none">{lang.flag}</span>
              <span className="flex-1 text-[14px] font-medium">{lang.label}</span>
            </button>
          );
        })}
      </div>

      <div className="border-t border-zinc-100 p-2">
        <button
          type="button"
          onClick={onClose}
          className="guest-tactile-pill w-full rounded-xl py-3 text-[14px] font-medium text-zinc-500 hover:bg-zinc-50 active:scale-[0.98] transition-all"
        >
          {cancelLabel}
        </button>
      </div>
    </GuestPremiumSheet>
  );
}
