import { useEffect } from "react";
import { useLocation } from "wouter";
import { fixDuplicateTenantSlugPath, wouterAbsolutePath } from "@/lib/tenant-path";

/**
 * Repairs /{slug}/{slug}/… URLs at the app root (uses full pathname + wouter ~ prefix).
 */
export function DuplicateTenantSlugRedirect() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const full = window.location.pathname;
    const fixed = fixDuplicateTenantSlugPath(full);
    if (fixed && fixed !== full) {
      setLocation(wouterAbsolutePath(fixed), { replace: true });
    }
  }, [setLocation]);

  return null;
}
