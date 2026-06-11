import { COUNTRIES } from "@/lib/locale";

/** Major cities per country for GM local-tips picker (searchable). */
export const CITIES_BY_COUNTRY: Record<string, string[]> = {
  TR: ["Istanbul", "Ankara", "Izmir", "Antalya", "Bodrum", "Marmaris", "Cappadocia", "Bursa", "Trabzon", "Alanya"],
  AE: ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah"],
  SA: ["Riyadh", "Jeddah", "Mecca", "Medina", "Dammam", "Khobar"],
  EG: ["Cairo", "Alexandria", "Luxor", "Aswan", "Sharm El Sheikh", "Hurghada"],
  GB: ["London", "Manchester", "Edinburgh", "Birmingham", "Liverpool", "Bristol"],
  US: ["New York", "Los Angeles", "Miami", "Las Vegas", "Chicago", "San Francisco", "Orlando", "Boston"],
  FR: ["Paris", "Nice", "Lyon", "Marseille", "Cannes", "Bordeaux"],
  DE: ["Berlin", "Munich", "Hamburg", "Frankfurt", "Cologne", "Düsseldorf"],
  IT: ["Rome", "Milan", "Venice", "Florence", "Naples", "Amalfi Coast"],
  ES: ["Madrid", "Barcelona", "Seville", "Valencia", "Marbella", "Ibiza", "Palma de Mallorca"],
  GR: ["Athens", "Thessaloniki", "Santorini", "Mykonos", "Crete", "Rhodes"],
  PT: ["Lisbon", "Porto", "Algarve", "Madeira"],
  NL: ["Amsterdam", "Rotterdam", "The Hague", "Utrecht"],
  CH: ["Zurich", "Geneva", "Bern", "Lucerne", "Interlaken"],
  AT: ["Vienna", "Salzburg", "Innsbruck"],
  RU: ["Moscow", "Saint Petersburg", "Sochi", "Kazan"],
  QA: ["Doha"],
  KW: ["Kuwait City"],
  BH: ["Manama"],
  OM: ["Muscat", "Salalah"],
  JO: ["Amman", "Petra", "Aqaba"],
  LB: ["Beirut"],
  MA: ["Marrakech", "Casablanca", "Fez", "Tangier"],
  TH: ["Bangkok", "Phuket", "Chiang Mai", "Pattaya", "Krabi"],
  ID: ["Bali", "Jakarta", "Yogyakarta"],
  MY: ["Kuala Lumpur", "Langkawi", "Penang"],
  SG: ["Singapore"],
  JP: ["Tokyo", "Osaka", "Kyoto", "Hiroshima", "Sapporo"],
  KR: ["Seoul", "Busan", "Jeju"],
  CN: ["Beijing", "Shanghai", "Hong Kong", "Guangzhou", "Shenzhen"],
  IN: ["Mumbai", "Delhi", "Goa", "Jaipur", "Bangalore"],
  AU: ["Sydney", "Melbourne", "Brisbane", "Gold Coast", "Perth"],
  CA: ["Toronto", "Vancouver", "Montreal", "Calgary"],
  MX: ["Mexico City", "Cancún", "Playa del Carmen", "Los Cabos"],
  BR: ["Rio de Janeiro", "São Paulo", "Salvador"],
  AR: ["Buenos Aires", "Bariloche", "Mendoza"],
  ZA: ["Cape Town", "Johannesburg", "Durban"],
  CY: ["Nicosia", "Limassol", "Paphos", "Ayia Napa"],
  HR: ["Dubrovnik", "Split", "Zagreb", "Hvar"],
  PL: ["Warsaw", "Kraków", "Gdańsk"],
  CZ: ["Prague", "Brno", "Karlovy Vary"],
  HU: ["Budapest"],
  SE: ["Stockholm", "Gothenburg", "Malmö"],
  NO: ["Oslo", "Bergen", "Tromsø"],
  DK: ["Copenhagen", "Aarhus"],
  IE: ["Dublin", "Galway", "Cork"],
  IL: ["Tel Aviv", "Jerusalem", "Haifa", "Eilat"],
  IR: ["Tehran", "Isfahan", "Shiraz"],
  PK: ["Karachi", "Lahore", "Islamabad"],
  KU: ["Erbil", "Sulaymaniyah", "Duhok"],
};

export function citiesForCountry(countryCode: string): string[] {
  return CITIES_BY_COUNTRY[countryCode.toUpperCase()] ?? [];
}

export function findCountryForCity(cityName: string): string | null {
  const needle = cityName.trim().toLowerCase();
  if (!needle) return null;
  for (const [code, cities] of Object.entries(CITIES_BY_COUNTRY)) {
    if (cities.some((c) => c.toLowerCase() === needle)) return code;
  }
  return null;
}

export function resolveCitySelection(
  storedCity: string | null | undefined,
  storedCountry?: string | null,
): {
  countryCode: string;
  cityName: string;
} {
  const city = storedCity?.trim() ?? "";
  if (!city) return { countryCode: storedCountry?.trim().toUpperCase() || "TR", cityName: "" };
  const country =
    storedCountry?.trim().toUpperCase() || findCountryForCity(city) || "TR";
  return { countryCode: country, cityName: city };
}

export const PICKER_COUNTRIES = COUNTRIES.filter((c) => citiesForCountry(c.code).length > 0 || c.code === "TR");
