import { useEffect } from "react";
import { useLocation } from "wouter";
import MarketingHome from "@/pages/marketing/home";
import { hasAuthCallbackQuery, loginPathWithSearch } from "@/lib/app-routes";

/**
 * Public landing at `/` and `/home`.
 * Forwards legacy OAuth callbacks that still target `/` to `/login`.
 */
export default function MarketingHomePage() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const { search } = window.location;
    if (!hasAuthCallbackQuery(search)) return;
    const target = loginPathWithSearch(search);
    window.history.replaceState(null, "", target);
    setLocation(target);
  }, [setLocation]);

  return <MarketingHome />;
}
