import { useGetHotelBranding } from "@workspace/api-client-react";
import { useOptionalHotelTenant } from "@/hooks/use-hotel-tenant";
import { HOTEL_CONFIG } from "@/lib/welcoming/hotel-content";

/**
 * Tenant-aware hotel display names — public tenant API + /hotel/branding + static fallback.
 */
export function useHotelDisplay() {
  const tenant = useOptionalHotelTenant();
  const { data: branding } = useGetHotelBranding();

  const appName =
    tenant?.hotel?.branding?.appName ??
    branding?.appName ??
    tenant?.hotel?.name ??
    HOTEL_CONFIG.name;

  const hotelName = tenant?.hotel?.name ?? HOTEL_CONFIG.name;
  const welcomeText =
    tenant?.hotel?.branding?.welcomeText ?? branding?.welcomeText ?? null;

  const logoUrl =
    tenant?.hotel?.branding?.logoUrl ?? branding?.logoUrl ?? null;

  return {
    appName,
    hotelName,
    welcomeText,
    logoUrl,
    branding,
    tenant,
  };
}
