import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { processHotelLogoFile } from "@/lib/hotel-logo-image";

export function HotelLogoUpload({
  value,
  onChange,
  hotelName,
  className,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  hotelName?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const onPick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const dataUrl = await processHotelLogoFile(file);
      onChange(dataUrl);
    } catch (err) {
      const { toast } = await import("sonner");
      toast.error(err instanceof Error ? err.message : "Could not load image");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const letter = (hotelName?.trim()[0] ?? "H").toUpperCase();

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="sr-only"
        onChange={(e) => void onPick(e.target.files?.[0])}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className={cn(
          "group relative flex aspect-square w-full max-w-[140px] flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition-colors",
          value
            ? "border-zinc-200 bg-white"
            : "border-zinc-200 bg-zinc-50/80 hover:border-zinc-300 hover:bg-zinc-50",
        )}
      >
        {busy ? (
          <Loader2 className="h-7 w-7 animate-spin text-zinc-400" />
        ) : value ? (
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-600 text-lg font-semibold text-white shadow-sm">
              {letter}
            </div>
            <ImagePlus className="mt-2 h-5 w-5 text-zinc-400 group-hover:text-zinc-600" />
            <span className="mt-1 px-2 text-center text-[11px] font-medium text-zinc-500">
              Upload logo
            </span>
          </>
        )}
        {value && !busy && (
          <span className="absolute inset-x-0 bottom-0 bg-zinc-900/70 py-1 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
            Change
          </span>
        )}
      </button>
      {value && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="inline-flex max-w-[140px] items-center justify-center gap-1 rounded-lg py-1 text-xs text-zinc-500 hover:text-zinc-800"
        >
          <X className="h-3.5 w-3.5" />
          Remove logo
        </button>
      )}
    </div>
  );
}
