import { useEffect } from "react";
import { useLocation } from "wouter";
import { fixDuplicateTenantSlugPath, wouterAbsolutePath } from "@/lib/tenant-path";

/** Redirects /{slug}/{slug}/login → /{slug}/login (legacy bad links). */
export function HotelTenantPathFix({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const full = window.location.pathname;
    const fixed = fixDuplicateTenantSlugPath(full);
    if (fixed && fixed !== full) {
      setLocation(wouterAbsolutePath(fixed), { replace: true });
    }
  }, [setLocation]);

  return <>{children}</>;
}
