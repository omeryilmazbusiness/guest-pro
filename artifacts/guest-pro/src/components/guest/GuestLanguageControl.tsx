import { useState } from "react";
import { Languages } from "lucide-react";
import { useLocale } from "@/hooks/use-locale";
import { cn } from "@/lib/utils";
import { GuestLanguageSheet } from "@/components/guest/GuestLanguageSheet";

interface GuestLanguageControlProps {
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function GuestLanguageControl({
  className,
  open: controlledOpen,
  onOpenChange,
}: GuestLanguageControlProps) {
  const { t, uiLocale, setLocale } = useLocale();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-zinc-400 transition-colors",
          "hover:bg-zinc-50 hover:text-zinc-700 active:scale-95",
          className,
        )}
        aria-label={t.languageMenuLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Languages className="h-4 w-4" strokeWidth={1.75} />
      </button>

      <GuestLanguageSheet
        open={open}
        onClose={() => setOpen(false)}
        currentLocale={uiLocale}
        onSelect={setLocale}
        title={t.languageSheetTitle}
        cancelLabel={t.cancel}
      />
    </>
  );
}
