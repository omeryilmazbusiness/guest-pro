import { useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import PlatformLogin from "@/pages/platform/login";
import PlatformDashboard from "@/pages/platform/dashboard";
import { PlatformAuthProvider } from "@/hooks/use-platform-auth";
function PlatformIndexRedirect() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation("/", { replace: true });
  }, [setLocation]);
  return null;
}

/** Fixes /platform/platform/… mistaken as hotel tenant slug. */
function PlatformDuplicateRedirect() {
  useEffect(() => {
    const p = window.location.pathname.replace(/\/+$/, "") || "/";
    if (p === "/platform/platform" || p.startsWith("/platform/platform/")) {
      const rest = p.slice("/platform/platform".length);
      window.location.replace(`/platform${rest || "/"}`);
    }
  }, []);
  return null;
}

/**
 * Nested under /platform (wouter nest).
 * /platform/login → path /login, /platform → path /
 */
export default function PlatformRoutes() {
  return (
    <PlatformAuthProvider>
      <PlatformDuplicateRedirect />
      <Switch>
        <Route path="/login" component={PlatformLogin} />
        <Route path="/" component={PlatformDashboard} />
        <Route component={PlatformIndexRedirect} />
      </Switch>
    </PlatformAuthProvider>
  );
}
