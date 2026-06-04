import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import ManagerDashboard from "@/pages/manager/dashboard";
import CreateGuest from "@/pages/manager/create-guest";
import ManagerSettings from "@/pages/manager/settings";
import GuestHome from "@/pages/guest/home";
import GuestChat from "@/pages/guest/chat";
import GuestFlow from "@/pages/guest/flow";
import GuestAutoLogin from "@/pages/guest/auto-login";
import PassportScanPage from "@/pages/guest/passport-scan";
import RestaurantDashboard from "@/pages/restaurant/dashboard";
import MarketingHomePage from "@/pages/marketing/MarketingHomePage";
import MarketingAboutPage from "@/pages/marketing/MarketingAboutPage";
import MarketingContactPage from "@/pages/marketing/MarketingContactPage";
import { MARKETING_ROUTES } from "@/lib/marketing-routes";
import HotelTenantRoutes from "@/routes/HotelTenantRoutes";
import PlatformRoutes from "@/routes/PlatformRoutes";
import LegacyTenantRedirect from "@/routes/LegacyTenantRedirect";
import { DuplicateTenantSlugRedirect } from "@/routes/DuplicateTenantSlugRedirect";
import { ROUTES } from "@/lib/app-routes";

const queryClient = new QueryClient();

function Router() {
  return (
    <>
      <DuplicateTenantSlugRedirect />
      <Switch>
      {/* Platform super-admin — nest so /platform/login works on mobile/PWA */}
      <Route path="/platform" nest>
        <PlatformRoutes />
      </Route>

      {/* Public marketing */}
      <Route path={ROUTES.marketingHomeAlias} component={MarketingHomePage} />
      <Route path={ROUTES.marketingHome} component={MarketingHomePage} />
      <Route path={MARKETING_ROUTES.about} component={MarketingAboutPage} />
      <Route path={MARKETING_ROUTES.contact} component={MarketingContactPage} />

      {/* Per-hotel tenant: /{slug}/login, /{slug}/guest, /{slug}/welcoming, … */}
      <Route path="/:hotelSlug" nest>
        <HotelTenantRoutes />
      </Route>

      {/* Legacy flat routes → redirect to /{defaultHotelSlug}/… */}
      <Route path={ROUTES.login}>
        <LegacyTenantRedirect segment={ROUTES.login} />
      </Route>
      <Route path={ROUTES.manager}>
        <LegacyTenantRedirect segment={ROUTES.manager} />
      </Route>
      <Route path={ROUTES.managerCreateGuest}>
        <LegacyTenantRedirect segment={ROUTES.managerCreateGuest} />
      </Route>
      <Route path={ROUTES.managerSettings}>
        <LegacyTenantRedirect segment={ROUTES.managerSettings} />
      </Route>
      <Route path={ROUTES.guest}>
        <LegacyTenantRedirect segment={ROUTES.guest} />
      </Route>
      <Route path={ROUTES.guestChat}>
        <LegacyTenantRedirect segment={ROUTES.guestChat} />
      </Route>
      <Route path={ROUTES.guestFlow}>
        <LegacyTenantRedirect segment={ROUTES.guestFlow} />
      </Route>
      <Route path={ROUTES.guestAutoLogin}>
        <LegacyTenantRedirect segment={ROUTES.guestAutoLogin} />
      </Route>
      <Route path={ROUTES.guestPassportScan}>
        <LegacyTenantRedirect segment={ROUTES.guestPassportScan} />
      </Route>
      <Route path={ROUTES.welcoming}>
        <LegacyTenantRedirect segment={ROUTES.welcoming} />
      </Route>
      <Route path={ROUTES.restaurant}>
        <LegacyTenantRedirect segment={ROUTES.restaurant} />
      </Route>

      <Route component={NotFound} />
    </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster position="top-center" richColors theme="light" />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
