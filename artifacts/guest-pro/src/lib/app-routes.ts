/**
 * Canonical client-side paths for Guest Pro SPA routing.
 * Keep redirects and links in sync with App.tsx route definitions.
 */
export { MARKETING_ROUTES } from "@/lib/marketing-routes";

export const ROUTES = {
  marketingHome: "/",
  marketingHomeAlias: "/home",
  marketingAbout: "/about",
  marketingContact: "/contact",
  platform: "/platform",
  platformLogin: "/platform/login",
  login: "/login",
  guestLogin: "/guest-login",
  managerLogin: "/manager-login",
  personelLogin: "/personel-login",
  restaurantLogin: "/restaurant-login",
  guest: "/guest",
  guestChat: "/guest/chat",
  guestLiveChat: "/guest/live-chat",
  guestFlow: "/guest/flow",
  guestAutoLogin: "/guest/auto-login",
  guestPassportScan: "/guest/passport-scan",
  manager: "/manager",
  managerSettings: "/manager/settings",
  managerCreateGuest: "/manager/guests/new",
  restaurant: "/restaurant",
  staff: "/staff",
  welcoming: "/welcoming",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];

/** Paths that render the public marketing landing page. */
export const MARKETING_HOME_PATHS = [ROUTES.marketingHome, ROUTES.marketingHomeAlias] as const;

export function isMarketingHomePath(path: string): boolean {
  return (MARKETING_HOME_PATHS as readonly string[]).includes(path);
}

/** OAuth / auth callback query params must be handled on the login screen. */
export function hasAuthCallbackQuery(search: string): boolean {
  if (!search || search === "?") return false;
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  if (params.has("google_code")) return true;
  const error = params.get("error");
  return !!error && error.startsWith("google");
}

export function loginPathWithSearch(search = ""): string {
  if (!search) return ROUTES.guestLogin;
  return `${ROUTES.guestLogin}${search.startsWith("?") ? search : `?${search}`}`;
}
