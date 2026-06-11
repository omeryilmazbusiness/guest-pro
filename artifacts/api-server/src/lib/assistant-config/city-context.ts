import type { HotelAssistantConfigDto } from "./types";

/** ISO country code → display name for roadmap / prompts */
export const COUNTRY_NAMES: Record<string, string> = {
  TR: "Turkey",
  AE: "United Arab Emirates",
  SA: "Saudi Arabia",
  EG: "Egypt",
  GB: "United Kingdom",
  US: "United States",
  FR: "France",
  DE: "Germany",
  IT: "Italy",
  ES: "Spain",
  GR: "Greece",
  PT: "Portugal",
  NL: "Netherlands",
  CH: "Switzerland",
  AT: "Austria",
  RU: "Russia",
  QA: "Qatar",
  KW: "Kuwait",
  BH: "Bahrain",
  OM: "Oman",
  JO: "Jordan",
  LB: "Lebanon",
  MA: "Morocco",
  TH: "Thailand",
  ID: "Indonesia",
  MY: "Malaysia",
  SG: "Singapore",
  JP: "Japan",
  KR: "South Korea",
  CN: "China",
  IN: "India",
  AU: "Australia",
  CA: "Canada",
  MX: "Mexico",
  BR: "Brazil",
  AR: "Argentina",
  ZA: "South Africa",
  CY: "Cyprus",
  HR: "Croatia",
  PL: "Poland",
  CZ: "Czech Republic",
  HU: "Hungary",
  SE: "Sweden",
  NO: "Norway",
  DK: "Denmark",
  IE: "Ireland",
  IL: "Israel",
  IR: "Iran",
  PK: "Pakistan",
  KU: "Iraq",
};

/** Keep in sync with guest-pro src/lib/hotel-cities.ts */
const CITIES_BY_COUNTRY: Record<string, string[]> = {
  TR: ["Istanbul", "Ankara", "Izmir", "Antalya", "Bodrum", "Marmaris", "Cappadocia", "Bursa", "Trabzon", "Alanya"],
  AE: ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah"],
  US: ["New York", "Los Angeles", "Miami", "Las Vegas", "Chicago", "San Francisco", "Orlando", "Boston"],
  FR: ["Paris", "Nice", "Lyon", "Marseille", "Cannes", "Bordeaux"],
  GB: ["London", "Manchester", "Edinburgh", "Birmingham", "Liverpool", "Bristol"],
  IT: ["Rome", "Milan", "Venice", "Florence", "Naples", "Amalfi Coast"],
  ES: ["Madrid", "Barcelona", "Seville", "Valencia", "Marbella", "Ibiza", "Palma de Mallorca"],
  DE: ["Berlin", "Munich", "Hamburg", "Frankfurt", "Cologne", "Düsseldorf"],
  EG: ["Cairo", "Alexandria", "Luxor", "Aswan", "Sharm El Sheikh", "Hurghada"],
};

export function findCountryForCity(cityName: string): string | null {
  const needle = cityName.trim().toLowerCase();
  if (!needle) return null;
  for (const [code, cities] of Object.entries(CITIES_BY_COUNTRY)) {
    if (cities.some((c) => c.toLowerCase() === needle)) return code;
  }
  return null;
}

export interface ExploreCityContext {
  city: string;
  countryCode: string | null;
  countryName: string | null;
  /** e.g. "Istanbul, Turkey" */
  label: string;
}

export function resolveExploreCity(config: HotelAssistantConfigDto): ExploreCityContext | null {
  const city = config.cityName?.trim();
  if (!city) return null;

  const countryCode =
    config.countryCode?.trim().toUpperCase() || findCountryForCity(city) || null;
  const countryName = countryCode ? (COUNTRY_NAMES[countryCode] ?? countryCode) : null;
  const label = countryName ? `${city}, ${countryName}` : city;

  return { city, countryCode, countryName, label };
}
