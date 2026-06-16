import { useInfiniteQuery, useQuery, type QueryClient } from "@tanstack/react-query";
import { useStaffLocale } from "@/hooks/use-staff-locale";
import {
  fetchLiveChatInbox,
  isLiveChatNetworkError,
  type LiveChatInboxItem,
} from "@/lib/live-chat-api";
import {
  LIVE_CHAT_POLL_BASE_MS,
  LIVE_CHAT_POLL_MAX_MS,
} from "@/lib/live-chat-sync-poll";

/** Shared react-query key — all live-chat inbox consumers must use this. */
export const LIVE_CHAT_INBOX_QUERY_KEY = ["live-chat-inbox"] as const;

export const LIVE_CHAT_INBOX_POLL_MS = LIVE_CHAT_POLL_BASE_MS;
export const LIVE_CHAT_INBOX_PAGE_SIZE = 50;

function liveChatInboxRetryDelay(attempt: number): number {
  return Math.min(LIVE_CHAT_INBOX_POLL_MS * 2 ** attempt, LIVE_CHAT_POLL_MAX_MS);
}

function liveChatInboxRefetchInterval(failureCount: number): number | false {
  if (failureCount > 0) {
    return liveChatInboxRetryDelay(failureCount);
  }
  return LIVE_CHAT_INBOX_POLL_MS;
}

const liveChatInboxQueryOptions = {
  staleTime: 0,
  refetchIntervalInBackground: true,
  refetchOnWindowFocus: true,
  refetchOnMount: "always" as const,
  retry: (failureCount: number, error: unknown) => {
    if (isLiveChatNetworkError(error)) return failureCount < 5;
    return failureCount < 2;
  },
  retryDelay: liveChatInboxRetryDelay,
};

export function liveChatInboxQueryKey(locale: string) {
  return [...LIVE_CHAT_INBOX_QUERY_KEY, locale] as const;
}

export function invalidateLiveChatInbox(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: LIVE_CHAT_INBOX_QUERY_KEY });
}

export function countLiveChatUnread(items: LiveChatInboxItem[] | undefined): number {
  return (items ?? []).filter((i) => i.hasUnread).length;
}

/**
 * Badge + emergency polling — uses server unreadCount (not limited to loaded pages).
 */
export function useLiveChatInboxBadgeQuery(options?: { enabled?: boolean }) {
  const { locale } = useStaffLocale();
  const enabled = options?.enabled ?? true;

  return useQuery({
    queryKey: [...liveChatInboxQueryKey(locale), "badge"] as const,
    queryFn: ({ signal }) => fetchLiveChatInbox(locale, { page: 1, limit: 20 }, signal),
    enabled,
    ...liveChatInboxQueryOptions,
    refetchInterval: (query) =>
      enabled ? liveChatInboxRefetchInterval(query.state.fetchFailureCount) : false,
    select: (data) => ({
      unreadCount: data.unreadCount ?? countLiveChatUnread(data.items),
      pendingEmergencies: data.pendingEmergencies,
      items: data.items,
    }),
  });
}

/** @deprecated Use useLiveChatInboxBadgeQuery for badge or useLiveChatInboxInfiniteQuery for list */
export function useLiveChatInboxQuery(options?: { enabled?: boolean }) {
  return useLiveChatInboxBadgeQuery(options);
}

/**
 * Reception inbox list — infinite scroll, 50 per page.
 */
export function useLiveChatInboxInfiniteQuery(options?: { enabled?: boolean }) {
  const { locale } = useStaffLocale();
  const enabled = options?.enabled ?? true;

  return useInfiniteQuery({
    queryKey: [...liveChatInboxQueryKey(locale), "pages"] as const,
    queryFn: ({ pageParam, signal }) =>
      fetchLiveChatInbox(locale, { page: pageParam, limit: LIVE_CHAT_INBOX_PAGE_SIZE }, signal),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination?.hasMore ? (last.pagination.page + 1) : undefined,
    enabled,
    ...liveChatInboxQueryOptions,
    refetchInterval: (query) =>
      enabled ? liveChatInboxRefetchInterval(query.state.fetchFailureCount) : false,
  });
}

export function flattenInboxPages(
  data: ReturnType<typeof useLiveChatInboxInfiniteQuery>["data"],
): LiveChatInboxItem[] {
  return data?.pages.flatMap((p) => p.items) ?? [];
}
