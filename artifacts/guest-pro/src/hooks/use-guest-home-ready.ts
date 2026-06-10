import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useGetHotelBranding, useListQuickActions } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { listMyRequests } from "@/lib/service-requests";
import { MY_REQUESTS_QUERY_KEY } from "@/lib/guest-my-requests-cache";
import { GUEST_MIN_SKELETON_MS } from "@/lib/guest-motion";

/**
 * True while the guest home dashboard is still loading critical data,
 * including a minimum skeleton display time for a polished reveal.
 */
export function useGuestHomeReady() {
  const { user, isLoading: authLoading, isAuthenticated, token } = useAuth();
  const { isLoading: brandingLoading } = useGetHotelBranding();
  const { isLoading: quickActionsLoading } = useListQuickActions();

  const guestReady = isAuthenticated && user?.role === "guest";
  const { isLoading: requestsLoading } = useQuery({
    queryKey: MY_REQUESTS_QUERY_KEY,
    queryFn: listMyRequests,
    enabled: guestReady,
    staleTime: 15_000,
  });

  const dataLoading =
    (!!token && authLoading) ||
    (guestReady && (brandingLoading || quickActionsLoading || requestsLoading));

  const bootStartedAt = useRef<number | null>(null);
  const [holdSkeleton, setHoldSkeleton] = useState(true);

  useEffect(() => {
    if (dataLoading) {
      if (bootStartedAt.current === null) {
        bootStartedAt.current = Date.now();
      }
      setHoldSkeleton(true);
      return;
    }

    if (bootStartedAt.current === null) {
      setHoldSkeleton(false);
      return;
    }

    const elapsed = Date.now() - bootStartedAt.current;
    const remaining = Math.max(0, GUEST_MIN_SKELETON_MS - elapsed);

    const timer = window.setTimeout(() => {
      setHoldSkeleton(false);
      bootStartedAt.current = null;
    }, remaining);

    return () => window.clearTimeout(timer);
  }, [dataLoading]);

  const isBootstrapping = dataLoading || holdSkeleton;

  return { isBootstrapping, guestReady };
}
