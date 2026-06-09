import { useCallback, useEffect, useState } from "react";
import { readPositionOnce, type PositionReadResult } from "@/lib/geolocation";
import type { PlaceCoords } from "@/lib/welcoming/types";

export interface GuestLocationState {
  position: PlaceCoords | null;
  loading: boolean;
  denied: boolean;
  refresh: () => void;
}

export function useGuestLocation(enabled = true): GuestLocationState {
  const [position, setPosition] = useState<PlaceCoords | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [denied, setDenied] = useState(false);

  const load = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const result: PositionReadResult | null = await readPositionOnce();
    if (result) {
      setPosition({ lat: result.lat, lng: result.lng });
      setDenied(false);
    } else {
      setPosition(null);
      setDenied(true);
    }
    setLoading(false);
  }, [enabled]);

  useEffect(() => {
    void load();
  }, [load]);

  return { position, loading, denied, refresh: () => void load() };
}
