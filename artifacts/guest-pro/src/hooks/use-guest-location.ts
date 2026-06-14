import { useCallback, useEffect, useState } from "react";
import { readPositionOnce } from "@/lib/geolocation";
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
    const result = await readPositionOnce();
    if (result.ok) {
      setPosition({ lat: result.position.lat, lng: result.position.lng });
      setDenied(false);
    } else {
      setPosition(null);
      setDenied(result.reason === "denied");
    }
    setLoading(false);
  }, [enabled]);

  useEffect(() => {
    void load();
  }, [load]);

  return { position, loading, denied, refresh: () => void load() };
}
