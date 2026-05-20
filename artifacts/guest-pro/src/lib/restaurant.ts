/**
 * Restaurant API client — typed wrappers around /api/restaurant/* endpoints.
 */
import { customFetch } from "@workspace/api-client-react";

// ── Types ─────────────────────────────────────────────────────────────────────

export const MENU_CATEGORIES = [
  "BREAKFAST", "SOUP", "SALAD", "APPETIZER", "MAIN_COURSE",
  "DESSERT", "BEVERAGE", "SNACK", "OTHER",
] as const;
export type MenuCategory = (typeof MENU_CATEGORIES)[number];

export const MENU_CATEGORY_LABELS: Record<MenuCategory, string> = {
  BREAKFAST:   "Kahvaltı",
  SOUP:        "Çorba",
  SALAD:       "Salata",
  APPETIZER:   "Başlangıç",
  MAIN_COURSE: "Ana Yemek",
  DESSERT:     "Tatlı",
  BEVERAGE:    "İçecek",
  SNACK:       "Atıştırmalık",
  OTHER:       "Diğer",
};

export const MENU_TYPES = ["DAILY", "ROOM_SERVICE"] as const;
export type MenuType = (typeof MENU_TYPES)[number];

export interface RestaurantMenuItem {
  id: number;
  hotelId: number;
  name: string;
  description: string | null;
  category: MenuCategory;
  menuType: MenuType;
  availableDate: string | null;
  priceAmount: string | null;
  currency: string;
  isActive: boolean;
  allergenNotes: string | null;
  portionInfo: string | null;
  sortOrder: number;
  createdByUserId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMenuItemInput {
  name: string;
  description?: string;
  category?: MenuCategory;
  menuType?: MenuType;
  availableDate?: string | null;
  priceAmount?: string | null;
  currency?: string;
  isActive?: boolean;
  allergenNotes?: string | null;
  portionInfo?: string | null;
  sortOrder?: number;
}

export interface RestaurantStockItem {
  id: number;
  hotelId: number;
  name: string;
  unit: string;
  quantityOnHand: string;
  lowStockThreshold: string | null;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStockItemInput {
  name: string;
  unit?: string;
  quantityOnHand?: string;
  lowStockThreshold?: string | null;
  notes?: string | null;
}

export interface RestaurantCareInsight {
  id?: number;
  hotelId?: number;
  date: string;
  insights: string[];
  sourceRequestCount: number;
  cached?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Re-use service request type for orders
export type OrderStatus = "open" | "in_progress" | "resolved";

export interface FoodOrder {
  id: number;
  guestId: number;
  hotelId: number;
  roomNumber: string;
  requestType: "FOOD_ORDER";
  summary: string;
  structuredData?: Record<string, unknown> | null;
  status: OrderStatus;
  guestFirstName: string;
  guestLastName: string;
  createdAt: string;
  updatedAt: string;
}

// ── Helper ────────────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  return customFetch<T>(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers as Record<string, string>) },
  });
}

// ── Menu ──────────────────────────────────────────────────────────────────────

export async function listMenuItems(params?: {
  menuType?: MenuType;
  date?: string;
  lang?: string;
}): Promise<RestaurantMenuItem[]> {
  const url = new URL("/api/restaurant/menu", window.location.origin);
  if (params?.menuType) url.searchParams.set("menuType", params.menuType);
  if (params?.date) url.searchParams.set("date", params.date);
  if (params?.lang) url.searchParams.set("lang", params.lang);
  return apiFetch<RestaurantMenuItem[]>(url.pathname + url.search);
}

export async function createMenuItem(data: CreateMenuItemInput): Promise<RestaurantMenuItem> {
  return apiFetch<RestaurantMenuItem>("/api/restaurant/menu", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateMenuItem(
  id: number,
  data: Partial<CreateMenuItemInput>
): Promise<RestaurantMenuItem> {
  return apiFetch<RestaurantMenuItem>(`/api/restaurant/menu/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteMenuItem(id: number): Promise<void> {
  await apiFetch<void>(`/api/restaurant/menu/${id}`, { method: "DELETE" });
}

// ── Stock ─────────────────────────────────────────────────────────────────────

export async function listStockItems(): Promise<RestaurantStockItem[]> {
  return apiFetch<RestaurantStockItem[]>("/api/restaurant/stock");
}

export async function createStockItem(data: CreateStockItemInput): Promise<RestaurantStockItem> {
  return apiFetch<RestaurantStockItem>("/api/restaurant/stock", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function adjustStock(id: number, delta: number): Promise<RestaurantStockItem> {
  return apiFetch<RestaurantStockItem>(`/api/restaurant/stock/${id}/adjust`, {
    method: "PATCH",
    body: JSON.stringify({ delta }),
  });
}

export async function updateStockItem(
  id: number,
  data: Partial<CreateStockItemInput>
): Promise<RestaurantStockItem> {
  return apiFetch<RestaurantStockItem>(`/api/restaurant/stock/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteStockItem(id: number): Promise<void> {
  await apiFetch<void>(`/api/restaurant/stock/${id}`, { method: "DELETE" });
}

// ── Orders ────────────────────────────────────────────────────────────────────

export async function listOrders(status?: OrderStatus): Promise<FoodOrder[]> {
  const url = new URL("/api/restaurant/orders", window.location.origin);
  if (status) url.searchParams.set("status", status);
  return apiFetch<FoodOrder[]>(url.pathname + url.search);
}

export async function updateOrderStatus(id: number, status: OrderStatus): Promise<FoodOrder> {
  return apiFetch<FoodOrder>(`/api/restaurant/orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

// ── Care insights ─────────────────────────────────────────────────────────────

export async function getCareInsights(date?: string): Promise<RestaurantCareInsight> {
  const url = new URL("/api/restaurant/care-insights", window.location.origin);
  if (date) url.searchParams.set("date", date);
  return apiFetch<RestaurantCareInsight>(url.pathname + url.search);
}

export async function refreshCareInsights(): Promise<RestaurantCareInsight> {
  return apiFetch<RestaurantCareInsight>("/api/restaurant/care-insights/refresh", {
    method: "POST",
  });
}

// ── Guest menu (public) ───────────────────────────────────────────────────────
// Used by the guest ordering flow to display current available menu.

export async function getGuestMenu(menuType: MenuType, date?: string): Promise<RestaurantMenuItem[]> {
  return listMenuItems({ menuType, date });
}
