import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { fetchPublicHotel, type PublicHotelTenant } from "@/lib/platform-api";
import { ROUTES } from "@/lib/app-routes";
import { isReservedHotelSlug } from "@/lib/reserved-slugs";
import { hotelPath } from "@/lib/tenant-path";

interface HotelTenantContextValue {
  slug: string;
  hotel: PublicHotelTenant | null;
  isLoading: boolean;
  error: string | null;
  /** Prefix-aware navigation helper */
  path: (segment: string) => string;
}

const HotelTenantContext = createContext<HotelTenantContextValue | null>(null);

export function HotelTenantProvider({
  slug,
  children,
}: {
  slug: string;
  children: ReactNode;
}) {
  const [hotel, setHotel] = useState<PublicHotelTenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const normalizedSlug = slug.trim().toLowerCase();

  useEffect(() => {
    if (normalizedSlug === "platform") {
      window.location.replace(ROUTES.platformLogin);
      return;
    }
    if (!normalizedSlug || isReservedHotelSlug(normalizedSlug)) {
      setIsLoading(false);
      if (normalizedSlug === "colega") {
        window.location.replace("/colega/index.html");
      } else {
        window.location.replace("/");
      }
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetchPublicHotel(normalizedSlug)
      .then((data) => {
        if (!cancelled) setHotel(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setHotel(null);
          setError(err instanceof Error ? err.message : "Hotel not found");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [normalizedSlug]);

  const value = useMemo<HotelTenantContextValue>(
    () => ({
      slug: normalizedSlug,
      hotel,
      isLoading,
      error,
      path: (segment) => hotelPath(normalizedSlug, segment),
    }),
    [normalizedSlug, hotel, isLoading, error],
  );

  return <HotelTenantContext.Provider value={value}>{children}</HotelTenantContext.Provider>;
}

export function useHotelTenant(): HotelTenantContextValue {
  const ctx = useContext(HotelTenantContext);
  if (!ctx) {
    throw new Error("useHotelTenant must be used within HotelTenantProvider");
  }
  return ctx;
}

export function useOptionalHotelTenant(): HotelTenantContextValue | null {
  return useContext(HotelTenantContext);
}
