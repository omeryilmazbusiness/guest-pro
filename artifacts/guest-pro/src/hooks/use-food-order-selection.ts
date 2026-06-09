import { useCallback, useMemo, useState } from "react";
import type { GuestMenuItem } from "@/hooks/use-guest-menu";
import {
  createLineSelection,
  type FoodOrderLineDraft,
  type FoodOrderLineSelection,
} from "@/lib/guest-food-order";

type SelectionMap = Record<number, FoodOrderLineDraft>;

const DEFAULT_DRAFT: FoodOrderLineDraft = { quantity: 1, note: "" };

export function useFoodOrderSelection() {
  const [selections, setSelections] = useState<SelectionMap>({});

  const isSelected = useCallback(
    (itemId: number) => selections[itemId] !== undefined,
    [selections],
  );

  const toggleItem = useCallback((item: GuestMenuItem) => {
    setSelections((prev) => {
      if (prev[item.id]) {
        const next = { ...prev };
        delete next[item.id];
        return next;
      }
      return { ...prev, [item.id]: { ...DEFAULT_DRAFT } };
    });
  }, []);

  const setQuantity = useCallback((itemId: number, quantity: number) => {
    setSelections((prev) => {
      const current = prev[itemId];
      if (!current) return prev;
      return {
        ...prev,
        [itemId]: { ...current, quantity: Math.max(1, Math.min(99, quantity)) },
      };
    });
  }, []);

  const setNote = useCallback((itemId: number, note: string) => {
    setSelections((prev) => {
      const current = prev[itemId];
      if (!current) return prev;
      return { ...prev, [itemId]: { ...current, note } };
    });
  }, []);

  const clearAll = useCallback(() => setSelections({}), []);

  const selectedCount = useMemo(() => Object.keys(selections).length, [selections]);

  const totalQuantity = useMemo(
    () => Object.values(selections).reduce((sum, s) => sum + s.quantity, 0),
    [selections],
  );

  const buildLines = useCallback(
    (itemsById: Map<number, GuestMenuItem>): FoodOrderLineSelection[] =>
      Object.entries(selections)
        .map(([id, draft]) => {
          const item = itemsById.get(Number(id));
          if (!item) return null;
          return createLineSelection(item, draft);
        })
        .filter((line): line is FoodOrderLineSelection => line !== null),
    [selections],
  );

  return {
    selections,
    isSelected,
    toggleItem,
    setQuantity,
    setNote,
    clearAll,
    selectedCount,
    totalQuantity,
    buildLines,
  };
}
