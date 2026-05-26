import { useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import PlatformLogin from "@/pages/platform/login";
import PlatformDashboard from "@/pages/platform/dashboard";
import { PlatformAuthProvider } from "@/hooks/use-platform-auth";
import { ROUTES } from "@/lib/app-routes";

function PlatformPathRedirect() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation(ROUTES.platform, { replace: true });
  }, [setLocation]);
  return null;
}

/**
 * Platform super-admin routes at /platform, /platform/login.
 * Handles mistaken /platform/platform (white screen when matched as hotel tenant).
 */
export default function PlatformRoutes() {
  const [location] = useLocation();

  if (location === "/platform/platform" || location.startsWith("/platform/platform/")) {
    return <PlatformPathRedirect />;
  }

  return (
    <PlatformAuthProvider>
      <Switch>
        <Route path={ROUTES.platformLogin} component={PlatformLogin} />
        <Route path={ROUTES.platform} component={PlatformDashboard} />
        <Route component={PlatformPathRedirect} />
      </Switch>
    </PlatformAuthProvider>
  );
}
