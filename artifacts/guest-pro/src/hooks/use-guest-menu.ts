/**
 * useGuestMenu
 * Fetches the live restaurant menu (DAILY for today + ROOM_SERVICE)
 * and returns items grouped by category for the guest food-order flow.
 *
 * Both query keys are stable so React Query deduplicates concurrent calls.
 * staleTime = 5 min — menu rarely changes mid-session.
 * Falls back gracefully when the API is unavailable (network error, 401, etc.)
 * so the static fallback in flow.tsx can take over.
 */
import { useQuery } from "@tanstack/react-query";
import { listMenuItems, type MenuCategory } from "@/lib/restaurant";
import type { LucideIcon } from "lucide-react";
import {
  Sunrise, UtensilsCrossed, Leaf, Coffee, Utensils,
} from "lucide-react";
import { useLocale } from "@/hooks/use-locale";

// ── Category → icon map ───────────────────────────────────────────────────────

export const CATEGORY_ICONS: Record<MenuCategory, LucideIcon> = {
  BREAKFAST:   Sunrise,
  SOUP:        Utensils,
  SALAD:       Leaf,
  APPETIZER:   UtensilsCrossed,
  MAIN_COURSE: UtensilsCrossed,
  DESSERT:     Coffee,
  BEVERAGE:    Coffee,
  SNACK:       Utensils,
  OTHER:       Utensils,
};

// ── Category sort order (breakfast first, drinks/other last) ──────────────────

const CATEGORY_ORDER: MenuCategory[] = [
  "BREAKFAST",
  "SOUP",
  "SALAD",
  "APPETIZER",
  "MAIN_COURSE",
  "DESSERT",
  "SNACK",
  "BEVERAGE",
  "OTHER",
];

// ── Public types ──────────────────────────────────────────────────────────────

export interface GuestMenuCategory {
  key: MenuCategory;
  label: string;
  itemCount: number;
  icon: LucideIcon;
}

export interface GuestMenuItem {
  id: number;
  name: string;
  description: string | null;
  category: MenuCategory;
  menuType: "DAILY" | "ROOM_SERVICE";
  priceAmount: string | null;
  currency: string;
  allergenNotes: string | null;
  portionInfo: string | null;
  sortOrder: number;
}

export interface UseGuestMenuResult {
  categories: GuestMenuCategory[];
  itemsByCategory: Record<string, GuestMenuItem[]>;
  isLoading: boolean;
  hasLiveData: boolean;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useGuestMenu(): UseGuestMenuResult {
  const { t, uiLocale } = useLocale();
  const today = new Date().toISOString().split("T")[0]!;

  const dailyQ = useQuery({
    queryKey: ["guest-menu-daily", today, uiLocale],
    queryFn: () => listMenuItems({ menuType: "DAILY", date: today, lang: uiLocale }),
    staleTime: 5 * 60_000,
    retry: 1,
    // Never throw — fallback to [] on error
    throwOnError: false,
  });

  const roomQ = useQuery({
    queryKey: ["guest-menu-room-service", uiLocale],
    queryFn: () => listMenuItems({ menuType: "ROOM_SERVICE", lang: uiLocale }),
    staleTime: 5 * 60_000,
    retry: 1,
    throwOnError: false,
  });

  const isLoading = dailyQ.isLoading || roomQ.isLoading;

  // Merge both menus, keep only active items
  const allItems: GuestMenuItem[] = [
    ...(dailyQ.data ?? []),
    ...(roomQ.data ?? []),
  ]
    .filter((item) => item.isActive)
    .map((item) => ({
      id:           item.id,
      name:         item.name,
      description:  item.description,
      category:     item.category as MenuCategory,
      menuType:     item.menuType as "DAILY" | "ROOM_SERVICE",
      priceAmount:  item.priceAmount,
      currency:     item.currency,
      allergenNotes: item.allergenNotes,
      portionInfo:  item.portionInfo,
      sortOrder:    item.sortOrder,
    }));

  // Group by category
  const grouped: Record<string, GuestMenuItem[]> = {};
  for (const item of allItems) {
    const k = item.category;
    if (!grouped[k]) grouped[k] = [];
    grouped[k]!.push(item);
  }

  // Sort items within each category by sortOrder
  for (const k of Object.keys(grouped)) {
    grouped[k]!.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  // Build category list in defined order, skip empty categories
  const categories: GuestMenuCategory[] = CATEGORY_ORDER.filter(
    (k) => (grouped[k]?.length ?? 0) > 0
  ).map((k) => ({
    key:       k,
    label:
      k === "BREAKFAST"
        ? t.flowCatBreakfast
        : k === "SOUP"
          ? t.flowCatSoup
          : k === "SALAD"
            ? t.flowCatSalad
            : k === "APPETIZER"
              ? t.flowCatAppetizer
              : k === "MAIN_COURSE"
                ? t.flowCatMain
                : k === "DESSERT"
                  ? t.flowCatDessert
                  : k === "SNACK"
                    ? t.flowCatSnack
                    : k === "BEVERAGE"
                      ? t.flowCatDrinks
                      : t.flowCatOther,
    itemCount: grouped[k]!.length,
    icon:      CATEGORY_ICONS[k],
  }));

  return {
    categories,
    itemsByCategory: grouped,
    isLoading,
    hasLiveData: allItems.length > 0,
  };
}
