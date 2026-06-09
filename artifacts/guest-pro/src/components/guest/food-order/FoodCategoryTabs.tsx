import { cn } from "@/lib/utils";
import { FOOD_ORDER_ALL_CATEGORY, type FoodCategoryFilter } from "@/lib/guest-food-order";
import type { GuestMenuCategory } from "@/hooks/use-guest-menu";
import type { GuestTranslations } from "@/lib/i18n";

interface FoodCategoryTabsProps {
  categories: GuestMenuCategory[];
  active: FoodCategoryFilter;
  onSelect: (key: FoodCategoryFilter) => void;
  t: GuestTranslations;
}

export function FoodCategoryTabs({ categories, active, onSelect, t }: FoodCategoryTabsProps) {
  return (
    <div className="sticky top-[60px] z-10 bg-white/95 backdrop-blur-sm border-b border-zinc-100">
      <div className="max-w-lg mx-auto px-3 py-2.5">
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5 -mx-1 px-1">
          <CategoryPill
            label={t.flowFoodAllTab}
            active={active === FOOD_ORDER_ALL_CATEGORY}
            onClick={() => onSelect(FOOD_ORDER_ALL_CATEGORY)}
          />
          {categories.map((cat) => (
            <CategoryPill
              key={cat.key}
              label={cat.label}
              count={cat.itemCount}
              active={active === cat.key}
              onClick={() => onSelect(cat.key)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function CategoryPill({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-semibold transition-all touch-manipulation",
        active
          ? "bg-zinc-900 text-white shadow-sm"
          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200/80",
      )}
    >
      {label}
      {count != null && count > 0 && (
        <span
          className={cn(
            "min-w-[18px] rounded-full px-1 text-[10px] font-bold leading-[18px] text-center",
            active ? "bg-white/20 text-white" : "bg-white text-zinc-500",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
