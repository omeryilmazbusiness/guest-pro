import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Loader2, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useGuestMenu } from "@/hooks/use-guest-menu";
import { useFoodOrderSelection } from "@/hooks/use-food-order-selection";
import { useLocale } from "@/hooks/use-locale";
import { useTenantNav } from "@/hooks/use-tenant-nav";
import { ROUTES } from "@/lib/app-routes";
import { createServiceRequest } from "@/lib/service-requests";
import { syncMyRequestToCache } from "@/lib/guest-my-requests-cache";
import { markGuestDashboardScrollRestore } from "@/lib/guest-dashboard-scroll";
import {
  FOOD_ORDER_ALL_CATEGORY,
  buildFoodOrderStructuredData,
  buildFoodOrderSummary,
  categorySectionId,
  type FoodCategoryFilter,
} from "@/lib/guest-food-order";
import { FoodCategoryTabs } from "@/components/guest/food-order/FoodCategoryTabs";
import { FoodMenuItemCard } from "@/components/guest/food-order/FoodMenuItemCard";
import { FoodOrderBottomBar } from "@/components/guest/food-order/FoodOrderBottomBar";
import type { LucideIcon } from "lucide-react";

interface FoodOrderScreenProps {
  onBack: () => void;
  onComplete: () => void;
}

export function FoodOrderScreen({ onBack, onComplete }: FoodOrderScreenProps) {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const { sections, categories, allItems, isLoading, hasLiveData } = useGuestMenu();
  const selection = useFoodOrderSelection();

  const [activeCategory, setActiveCategory] = useState<FoodCategoryFilter>(FOOD_ORDER_ALL_CATEGORY);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);

  const itemsById = useMemo(
    () => new Map(allItems.map((item) => [item.id, item])),
    [allItems],
  );

  const visibleSections = useMemo(() => {
    if (activeCategory === FOOD_ORDER_ALL_CATEGORY) return sections;
    return sections.filter((s) => s.key === activeCategory);
  }, [sections, activeCategory]);

  const handleCategorySelect = useCallback((key: FoodCategoryFilter) => {
    setActiveCategory(key);
    isScrollingRef.current = true;

    if (key === FOOD_ORDER_ALL_CATEGORY) {
      scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      const el = document.getElementById(categorySectionId(key));
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    window.setTimeout(() => {
      isScrollingRef.current = false;
    }, 600);
  }, []);

  // Scroll-spy: highlight category pill while scrolling in "All" view
  useEffect(() => {
    if (activeCategory !== FOOD_ORDER_ALL_CATEGORY) return;

    const root = scrollRef.current;
    if (!root || sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingRef.current) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const top = visible[0]?.target.id;
        if (top?.startsWith("food-section-")) {
          setActiveCategory(top.replace("food-section-", ""));
        }
      },
      { root, rootMargin: "-120px 0px -55% 0px", threshold: 0 },
    );

    for (const section of sections) {
      const el = document.getElementById(categorySectionId(section.key));
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [sections, activeCategory]);

  const handleSubmit = async () => {
    const lines = selection.buildLines(itemsById);
    if (lines.length === 0) {
      toast.error(t.flowFoodNoItems);
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createServiceRequest({
        requestType: "FOOD_ORDER",
        summary: buildFoodOrderSummary(lines, t),
        structuredData: buildFoodOrderStructuredData(lines),
      });
      syncMyRequestToCache(queryClient, created);
      markGuestDashboardScrollRestore();
      onComplete();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.sendFailed);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#F8F8F8] flex flex-col">
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-zinc-100 shrink-0">
        <div className="max-w-lg mx-auto px-4 h-[60px] flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 transition-all -ms-1"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
              <UtensilsCrossed className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[15px] font-semibold text-zinc-900 truncate">{t.flowFoodLabel}</p>
              <p className="text-[11px] text-zinc-400 truncate">{t.flowFoodSelectHint}</p>
            </div>
          </div>
        </div>
      </header>

      {!isLoading && categories.length > 0 && (
        <FoodCategoryTabs
          categories={categories}
          active={activeCategory}
          onSelect={handleCategorySelect}
          t={t}
        />
      )}

      <main ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain">
        <div className="max-w-lg mx-auto px-4 pt-4 pb-36">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-400">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-[13px]">{t.flowMenuLoading}</p>
            </div>
          )}

          {!isLoading && !hasLiveData && (
            <div className="rounded-2xl border border-zinc-100 bg-white px-6 py-12 text-center">
              <p className="text-[14px] text-zinc-500">{t.flowMenuEmpty}</p>
            </div>
          )}

          {!isLoading &&
            visibleSections.map((section) => (
              <MenuSection
                key={section.key}
                sectionId={categorySectionId(section.key)}
                label={section.label}
                icon={section.icon}
                showHeading={activeCategory === FOOD_ORDER_ALL_CATEGORY}
                items={section.items}
                selection={selection}
                t={t}
              />
            ))}
        </div>
      </main>

      <FoodOrderBottomBar
        selectedCount={selection.selectedCount}
        totalQuantity={selection.totalQuantity}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        t={t}
      />
    </div>
  );
}

function MenuSection({
  sectionId,
  label,
  icon: Icon,
  showHeading,
  items,
  selection,
  t,
}: {
  sectionId: string;
  label: string;
  icon: LucideIcon;
  showHeading: boolean;
  items: ReturnType<typeof useGuestMenu>["sections"][number]["items"];
  selection: ReturnType<typeof useFoodOrderSelection>;
  t: ReturnType<typeof useLocale>["t"];
}) {
  return (
    <section id={sectionId} className="scroll-mt-[128px] mb-8 last:mb-4">
      {showHeading && (
        <div className="flex items-center gap-2 mb-3 sticky top-[108px] z-[1] py-1 bg-[#F8F8F8]/95 backdrop-blur-sm">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white ring-1 ring-zinc-100 shadow-sm">
            <Icon className="h-4 w-4 text-amber-600" />
          </span>
          <h2 className="text-[13px] font-bold uppercase tracking-wide text-zinc-700">{label}</h2>
          <span className="text-[11px] font-medium text-zinc-400">{items.length}</span>
        </div>
      )}

      <div className="space-y-3">
        {items.map((item) => {
          const draft = selection.selections[item.id];
          const selected = draft !== undefined;
          return (
            <FoodMenuItemCard
              key={item.id}
              item={item}
              selected={selected}
              quantity={draft?.quantity ?? 1}
              note={draft?.note ?? ""}
              onToggle={() => selection.toggleItem(item)}
              onQuantityChange={(qty) => selection.setQuantity(item.id, qty)}
              onNoteChange={(note) => selection.setNote(item.id, note)}
              t={t}
            />
          );
        })}
      </div>
    </section>
  );
}
