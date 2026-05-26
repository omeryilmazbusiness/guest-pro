import { useCallback } from "react";
import { useLocation } from "wouter";
import { useOptionalHotelTenant } from "@/hooks/use-hotel-tenant";
import { tenantNavigatePath } from "@/lib/tenant-path";

/** Navigate within the current hotel tenant or legacy flat path. */
export function useTenantNav() {
  const tenant = useOptionalHotelTenant();
  const [, setLocation] = useLocation();

  return useCallback(
    (path: string) => {
      if (tenant) {
        setLocation(tenantNavigatePath(tenant.slug, path));
        return;
      }
      const segment = path.startsWith("/") ? path : `/${path}`;
      setLocation(segment);
    },
    [tenant, setLocation],
  );
}
