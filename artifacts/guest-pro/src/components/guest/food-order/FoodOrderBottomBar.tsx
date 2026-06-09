import { Loader2, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { tFmt } from "@/lib/i18n";
import type { GuestTranslations } from "@/lib/i18n";

interface FoodOrderBottomBarProps {
  selectedCount: number;
  totalQuantity: number;
  isSubmitting: boolean;
  onSubmit: () => void;
  t: GuestTranslations;
}

export function FoodOrderBottomBar({
  selectedCount,
  totalQuantity,
  isSubmitting,
  onSubmit,
  t,
}: FoodOrderBottomBarProps) {
  const disabled = selectedCount === 0 || isSubmitting;

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-zinc-100 bg-white/95 backdrop-blur-md pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="max-w-lg mx-auto px-4 pt-3 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-zinc-800">
            <ShoppingBag className="h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-[13px] font-semibold truncate">
              {selectedCount > 0
                ? tFmt(t.flowFoodItemsSelected, { count: String(totalQuantity) })
                : t.flowFoodNoItems}
            </p>
          </div>
          {selectedCount > 0 && (
            <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
              {tFmt(t.flowFoodLinesSelected, { count: String(selectedCount) })}
            </p>
          )}
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={onSubmit}
          className={cn(
            "shrink-0 h-12 min-w-[132px] rounded-2xl px-5 text-[14px] font-semibold transition-all touch-manipulation",
            disabled
              ? "bg-zinc-200 text-zinc-400"
              : "bg-zinc-900 text-white shadow-lg shadow-zinc-900/15 active:scale-[0.98] hover:bg-zinc-800",
          )}
        >
          {isSubmitting ? (
            <Loader2 className="mx-auto h-5 w-5 animate-spin" />
          ) : (
            t.flowFoodPlaceOrder
          )}
        </button>
      </div>
    </div>
  );
}
