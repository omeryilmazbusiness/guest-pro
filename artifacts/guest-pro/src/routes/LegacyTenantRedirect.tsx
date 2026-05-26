import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { hotelPath } from "@/lib/tenant-path";

interface PublicConfig {
  defaultHotelSlug: string | null;
}

/**
 * Redirects legacy flat routes (/guest, /login, …) to /{defaultSlug}/…
 */
export default function LegacyTenantRedirect({ segment }: { segment: string }) {
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/public/config", { headers: { Accept: "application/json" } })
      .then(async (res) => {
        if (!res.ok) throw new Error("Config unavailable");
        return res.json() as Promise<PublicConfig>;
      })
      .then((cfg) => {
        if (cancelled) return;
        if (cfg.defaultHotelSlug) {
          setLocation(hotelPath(cfg.defaultHotelSlug, segment), { replace: true });
        } else {
          setError("No default hotel configured. Use /{hotel-slug}/login.");
        }
      })
      .catch(() => {
        if (!cancelled) setError("Could not resolve hotel tenant.");
      });
    return () => {
      cancelled = true;
    };
  }, [segment, setLocation]);

  if (error) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-2 bg-zinc-50 px-6 text-center">
        <p className="text-sm font-medium text-zinc-900">{error}</p>
        <a href="/" className="text-sm text-zinc-600 underline">
          Home
        </a>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-zinc-50">
      <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
    </div>
  );
}
