/**
 * Paginated guests list for reception dashboard infinite scroll.
 */
import { customFetch } from "@workspace/api-client-react";
import type { Guest } from "@workspace/api-client-react";

export const GUESTS_PAGE_SIZE = 50;

export interface GuestsPagination {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface GuestsPageResponse {
  items: Guest[];
  pagination: GuestsPagination;
}

export async function fetchGuestsPage(
  page: number,
  limit = GUESTS_PAGE_SIZE,
): Promise<GuestsPageResponse> {
  const url = new URL("/api/guests", window.location.origin);
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(limit));
  return customFetch<GuestsPageResponse>(url.pathname + url.search);
}
