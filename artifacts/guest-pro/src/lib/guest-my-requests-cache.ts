import type { QueryClient } from "@tanstack/react-query";
import type { ServiceRequest } from "@/lib/service-requests";

import { markGuestDashboardScrollRestore } from "@/lib/guest-dashboard-scroll";

export const MY_REQUESTS_QUERY_KEY = ["my-requests"] as const;

/** @deprecated Use markGuestDashboardScrollRestore */
export function markScrollToGuestRequests(): void {
  markGuestDashboardScrollRestore();
}

/** Prepend a newly created request so the home screen updates without refresh. */
export function addMyRequestToCache(
  queryClient: QueryClient,
  request: ServiceRequest,
): void {
  queryClient.setQueryData<ServiceRequest[]>(MY_REQUESTS_QUERY_KEY, (prev) => {
    if (!prev) return [request];
    if (prev.some((r) => r.id === request.id)) return prev;
    return [request, ...prev];
  });
}

export function invalidateMyRequests(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: MY_REQUESTS_QUERY_KEY });
}

/** Optimistic list update + background sync with server. */
export function syncMyRequestToCache(
  queryClient: QueryClient,
  request: ServiceRequest,
): void {
  addMyRequestToCache(queryClient, request);
  invalidateMyRequests(queryClient);
}
