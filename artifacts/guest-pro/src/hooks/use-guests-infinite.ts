import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchGuestsPage, GUESTS_PAGE_SIZE } from "@/lib/guests-paginated";

export const GUESTS_INFINITE_QUERY_KEY = ["guests", "paginated"] as const;

export function useGuestsInfiniteQuery(options?: { enabled?: boolean }) {
  return useInfiniteQuery({
    queryKey: GUESTS_INFINITE_QUERY_KEY,
    queryFn: ({ pageParam }) => fetchGuestsPage(pageParam, GUESTS_PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination.hasMore ? last.pagination.page + 1 : undefined,
    enabled: options?.enabled ?? true,
    staleTime: 30_000,
  });
}

export function flattenGuestsPages(
  data: ReturnType<typeof useGuestsInfiniteQuery>["data"],
) {
  return data?.pages.flatMap((p) => p.items) ?? [];
}
