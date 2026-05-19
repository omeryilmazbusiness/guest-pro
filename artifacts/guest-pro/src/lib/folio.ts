import { customFetch } from "@workspace/api-client-react";

export type FolioCategory = "FOOD" | "ROOM_SERVICE" | "MINIBAR" | "OTHER";

export interface FolioLine {
  id: number;
  description: string;
  category: FolioCategory;
  quantity: number;
  unitAmount: string;
  lineTotal: string;
  currency: string;
  createdAt: string;
}

export interface DailyBill {
  date: string;
  currency: string;
  subtotal: string;
  itemCount: number;
  lines: FolioLine[];
}

export interface FolioDaySummary {
  date: string;
  currency: string;
  subtotal: string;
  itemCount: number;
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function fetchDailyBill(date?: string): Promise<DailyBill> {
  const url = new URL("/api/folio/daily", window.location.origin);
  if (date) url.searchParams.set("date", date);
  return customFetch<DailyBill>(url.pathname + url.search);
}

export async function fetchFolioDays(limit = 14): Promise<{ days: FolioDaySummary[] }> {
  const url = new URL("/api/folio/days", window.location.origin);
  url.searchParams.set("limit", String(limit));
  return customFetch<{ days: FolioDaySummary[] }>(url.pathname + url.search);
}
