import { Route, Switch, useParams } from "wouter";
import { Loader2 } from "lucide-react";
import { HotelTenantProvider, useHotelTenant } from "@/hooks/use-hotel-tenant";
import { ROUTES } from "@/lib/app-routes";
import Login from "@/pages/login";
import GuestLoginPage from "@/pages/login/guest-login";
import ManagerLoginPage from "@/pages/login/manager-login";
import PersonelLoginPage from "@/pages/login/personel-login";
import RestaurantLoginPage from "@/pages/login/restaurant-login";
import {
  GuestHomePage,
  GuestChatPage,
  GuestFlowPage,
  GuestAutoLoginPage,
  GuestPassportScanPage,
} from "@/routes/guest-route-pages";
import GuestWelcoming from "@/pages/guest/welcoming";
import StaffPortalPage from "@/pages/staff/dashboard";
import RestaurantDashboard from "@/pages/restaurant/dashboard";
import ManagerDashboard from "@/pages/manager/dashboard";
import CreateGuest from "@/pages/manager/create-guest";
import ManagerSettings from "@/pages/manager/settings";
import NotFound from "@/pages/not-found";
import { HotelTenantPathFix } from "@/routes/HotelTenantPathFix";
import { GuestLogoutProvider } from "@/contexts/guest-logout-context";

export default function HotelTenantRoutes() {
  const params = useParams<{ hotelSlug: string }>();
  const slug = params.hotelSlug ?? "";

  return (
    <HotelTenantProvider slug={slug}>
      <HotelTenantPathFix>
        <HotelTenantGate />
      </HotelTenantPathFix>
    </HotelTenantProvider>
  );
}

function HotelTenantGate() {
  const { isLoading, error, hotel } = useHotelTenant();

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-zinc-50">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-zinc-50 px-6 text-center">
        <p className="text-lg font-medium text-zinc-900">Hotel not found</p>
        <p className="text-sm text-zinc-500">{error ?? "This property URL is invalid or inactive."}</p>
        <a href="/" className="text-sm text-zinc-700 underline">
          Back to Guest Pro
        </a>
      </div>
    );
  }

  return (
    <GuestLogoutProvider>
    <Switch>
      <Route path={ROUTES.login} component={Login} />
      <Route path={ROUTES.guestLogin} component={GuestLoginPage} />
      <Route path={ROUTES.managerLogin} component={ManagerLoginPage} />
      <Route path={ROUTES.personelLogin} component={PersonelLoginPage} />
      <Route path={ROUTES.restaurantLogin} component={RestaurantLoginPage} />
      <Route path={ROUTES.welcoming} component={GuestWelcoming} />
      <Route path={ROUTES.guest} component={GuestHomePage} />
      <Route path={ROUTES.guestChat} component={GuestChatPage} />
      <Route path={ROUTES.guestFlow} component={GuestFlowPage} />
      <Route path={ROUTES.guestAutoLogin} component={GuestAutoLoginPage} />
      <Route path={ROUTES.guestPassportScan} component={GuestPassportScanPage} />
      <Route path={ROUTES.manager} component={ManagerDashboard} />
      <Route path={ROUTES.managerCreateGuest} component={CreateGuest} />
      <Route path={`${ROUTES.managerSettings}/guest`} component={ManagerSettings} />
      <Route path={`${ROUTES.managerSettings}/tracking`} component={ManagerSettings} />
      <Route path={ROUTES.managerSettings} component={ManagerSettings} />
      <Route path={ROUTES.staff} component={StaffPortalPage} />
      <Route path={ROUTES.restaurant} component={RestaurantDashboard} />
      <Route component={NotFound} />
    </Switch>
    </GuestLogoutProvider>
  );
}
