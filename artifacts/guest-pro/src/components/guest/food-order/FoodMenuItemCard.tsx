import { Minus, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMenuPrice } from "@/lib/guest-food-order";
import type { GuestMenuItem } from "@/hooks/use-guest-menu";
import type { GuestTranslations } from "@/lib/i18n";

interface FoodMenuItemCardProps {
  item: GuestMenuItem;
  selected: boolean;
  quantity: number;
  note: string;
  onToggle: () => void;
  onQuantityChange: (qty: number) => void;
  onNoteChange: (note: string) => void;
  t: GuestTranslations;
}

export function FoodMenuItemCard({
  item,
  selected,
  quantity,
  note,
  onToggle,
  onQuantityChange,
  onNoteChange,
  t,
}: FoodMenuItemCardProps) {
  const price = formatMenuPrice(item.priceAmount, item.currency);
  const meta = [item.portionInfo, item.description].filter(Boolean).join(" · ");

  return (
    <article
      className={cn(
        "rounded-2xl border-2 bg-white transition-all touch-manipulation overflow-hidden",
        selected
          ? "border-amber-400 shadow-md shadow-amber-100/60 ring-1 ring-amber-100"
          : "border-zinc-100 shadow-sm hover:border-zinc-200",
      )}
    >
      <button type="button" onClick={onToggle} className="w-full text-start p-3.5 flex gap-3">
        <div
          className={cn(
            "relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-zinc-100 ring-1 ring-zinc-100",
          )}
        >
          {item.imageUrl ? (
            <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[20px] font-serif text-zinc-300">
              {item.name.trim()[0]?.toUpperCase() ?? "?"}
            </div>
          )}
          {selected && (
            <span className="absolute inset-0 flex items-center justify-center bg-amber-500/20">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white shadow">
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </span>
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[15px] font-semibold text-zinc-900 leading-snug">{item.name}</p>
            {price && (
              <span className="shrink-0 text-[13px] font-bold text-amber-700 tabular-nums">{price}</span>
            )}
          </div>
          {meta && (
            <p className="mt-1 text-[12px] text-zinc-500 leading-relaxed line-clamp-2">{meta}</p>
          )}
          {item.allergenNotes && (
            <p className="mt-1 text-[11px] text-rose-500/90 line-clamp-1">{item.allergenNotes}</p>
          )}
        </div>
      </button>

      {selected && (
        <div className="border-t border-amber-100/80 bg-amber-50/40 px-3.5 pb-3.5 pt-3 space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              {t.flowFoodQty}
            </span>
            <div className="inline-flex items-center rounded-xl bg-white ring-1 ring-zinc-200/80 shadow-sm">
              <QtyButton
                aria-label="-"
                disabled={quantity <= 1}
                onClick={() => onQuantityChange(quantity - 1)}
              >
                <Minus className="h-3.5 w-3.5" />
              </QtyButton>
              <span className="min-w-[2.25rem] text-center text-[15px] font-bold text-zinc-900 tabular-nums">
                {quantity}
              </span>
              <QtyButton
                aria-label="+"
                disabled={quantity >= 99}
                onClick={() => onQuantityChange(quantity + 1)}
              >
                <Plus className="h-3.5 w-3.5" />
              </QtyButton>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-zinc-500 mb-1.5">
              {t.flowFoodItemNote}
            </label>
            <textarea
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder={t.flowFoodItemNotePlaceholder}
              rows={2}
              className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-[13px] text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </article>
  );
}

function QtyButton({
  children,
  disabled,
  onClick,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
      className="flex h-9 w-9 items-center justify-center text-zinc-600 transition-colors hover:bg-zinc-50 disabled:opacity-30"
      {...rest}
    >
      {children}
    </button>
  );
}
