import { useEffect, useRef } from "react";

/** Calls onLoadMore when sentinel enters viewport. */
export function useInfiniteScrollSentinel(
  onLoadMore: () => void,
  options?: { enabled?: boolean; rootMargin?: string },
) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const enabled = options?.enabled ?? true;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !enabled) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMore();
      },
      { rootMargin: options?.rootMargin ?? "120px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [onLoadMore, enabled, options?.rootMargin]);

  return sentinelRef;
}
