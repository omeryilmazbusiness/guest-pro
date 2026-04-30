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
import GuestWelcoming from "@/pages/guest/welcoming";
import PassportScanPage from "@/pages/guest/passport-scan";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/manager" component={ManagerDashboard} />
      <Route path="/manager/guests/new" component={CreateGuest} />
      <Route path="/manager/settings" component={ManagerSettings} />
      <Route path="/guest" component={GuestHome} />
      <Route path="/guest/chat" component={GuestChat} />
      <Route path="/guest/flow" component={GuestFlow} />
      <Route path="/guest/auto-login" component={GuestAutoLogin} />
      <Route path="/guest/passport-scan" component={PassportScanPage} />
      <Route path="/welcoming" component={GuestWelcoming} />
      <Route component={NotFound} />
    </Switch>
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
