/**
 * Public marketing site paths (Colega static pages embedded at `/`).
 */

export const MARKETING_ROUTES = {
  home: "/",
  homeAlias: "/home",
  about: "/about",
  contact: "/contact",
} as const;

export type MarketingRoute =
  (typeof MARKETING_ROUTES)[keyof typeof MARKETING_ROUTES];

export const MARKETING_SITE_PATHS = [
  MARKETING_ROUTES.home,
  MARKETING_ROUTES.homeAlias,
  MARKETING_ROUTES.about,
  MARKETING_ROUTES.contact,
] as const;

export type ColegaPage = "index.html" | "about.html" | "contact.html";

export function isMarketingSitePath(path: string): boolean {
  const p = path.replace(/\/+$/, "") || "/";
  return (MARKETING_SITE_PATHS as readonly string[]).includes(p);
}

export function colegaPageForPath(path: string): ColegaPage | null {
  const p = path.replace(/\/+$/, "") || "/";
  switch (p) {
    case "/":
    case "/home":
      return "index.html";
    case "/about":
      return "about.html";
    case "/contact":
      return "contact.html";
    default:
      return null;
  }
}
