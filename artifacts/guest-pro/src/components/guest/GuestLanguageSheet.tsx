import { cn } from "@/lib/utils";
import {
  GUEST_LANGUAGE_OPTIONS,
  type GuestUiLocale,
} from "@/lib/guest-locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[min(100vw-1.5rem,22rem)] gap-0 overflow-hidden rounded-[1.35rem] border-zinc-100 p-0">
        <DialogHeader className="border-b border-zinc-100 px-4 pb-3 pt-4 text-start">
          <DialogTitle className="text-base font-semibold text-zinc-900">{title}</DialogTitle>
        </DialogHeader>

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
                  onSelect(lang.code);
                  onClose();
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-start transition-all touch-manipulation",
                  isActive
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-800 hover:bg-zinc-50 active:bg-zinc-100",
                )}
              >
                <span className="text-xl leading-none" aria-hidden="true">
                  {lang.flag}
                </span>
                <span
                  className={cn(
                    "flex-1 text-[15px] font-semibold",
                    lang.code === "ar" && "font-arabic",
                  )}
                >
                  {lang.label}
                </span>
                {isActive && (
                  <span className="text-[11px] font-bold text-white/70" aria-hidden="true">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="border-t border-zinc-100 p-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl px-3 py-2.5 text-[14px] font-medium text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-800"
          >
            {cancelLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
