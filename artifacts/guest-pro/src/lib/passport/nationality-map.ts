/**
 * nationality-map.ts
 *
 * Maps ISO 3166-1 alpha-3 codes (as found in MRZ) to alpha-2 codes
 * (as used by the COUNTRIES list in the reception form).
 *
 * Covers the most common passport-issuing countries.
 * Falls back to empty string when unknown — reception can correct manually.
 */

const ALPHA3_TO_ALPHA2: Readonly<Record<string, string>> = {
  AFG: "AF", ALB: "AL", DZA: "DZ", AND: "AD", AGO: "AO", ARG: "AR",
  ARM: "AM", AUS: "AU", AUT: "AT", AZE: "AZ", BHS: "BS", BHR: "BH",
  BGD: "BD", BLR: "BY", BEL: "BE", BLZ: "BZ", BEN: "BJ", BTN: "BT",
  BOL: "BO", BIH: "BA", BWA: "BW", BRA: "BR", BRN: "BN", BGR: "BG",
  BFA: "BF", BDI: "BI", CPV: "CV", KHM: "KH", CMR: "CM", CAN: "CA",
  CAF: "CF", TCD: "TD", CHL: "CL", CHN: "CN", COL: "CO", COM: "KM",
  COG: "CG", COD: "CD", CRI: "CR", CIV: "CI", HRV: "HR", CUB: "CU",
  CYP: "CY", CZE: "CZ", DNK: "DK", DJI: "DJ", DOM: "DO", ECU: "EC",
  EGY: "EG", SLV: "SV", GNQ: "GQ", ERI: "ER", EST: "EE", SWZ: "SZ",
  ETH: "ET", FJI: "FJ", FIN: "FI", FRA: "FR", GAB: "GA", GMB: "GM",
  GEO: "GE", DEU: "DE", GHA: "GH", GRC: "GR", GTM: "GT", GIN: "GN",
  GNB: "GW", GUY: "GY", HTI: "HT", HND: "HN", HUN: "HU", ISL: "IS",
  IND: "IN", IDN: "ID", IRN: "IR", IRQ: "IQ", IRL: "IE", ISR: "IL",
  ITA: "IT", JAM: "JM", JPN: "JP", JOR: "JO", KAZ: "KZ", KEN: "KE",
  PRK: "KP", KOR: "KR", KWT: "KW", KGZ: "KG", LAO: "LA", LVA: "LV",
  LBN: "LB", LSO: "LS", LBR: "LR", LBY: "LY", LIE: "LI", LTU: "LT",
  LUX: "LU", MDG: "MG", MWI: "MW", MYS: "MY", MDV: "MV", MLI: "ML",
  MLT: "MT", MRT: "MR", MUS: "MU", MEX: "MX", MDA: "MD", MCO: "MC",
  MNG: "MN", MNE: "ME", MAR: "MA", MOZ: "MZ", MMR: "MM", NAM: "NA",
  NPL: "NP", NLD: "NL", NZL: "NZ", NIC: "NI", NER: "NE", NGA: "NG",
  MKD: "MK", NOR: "NO", OMN: "OM", PAK: "PK", PAN: "PA", PNG: "PG",
  PRY: "PY", PER: "PE", PHL: "PH", POL: "PL", PRT: "PT", QAT: "QA",
  ROU: "RO", RUS: "RU", RWA: "RW", SAU: "SA", SEN: "SN", SRB: "RS",
  SLE: "SL", SGP: "SG", SVK: "SK", SVN: "SI", SOM: "SO", ZAF: "ZA",
  SSD: "SS", ESP: "ES", LKA: "LK", SDN: "SD", SUR: "SR", SWE: "SE",
  CHE: "CH", SYR: "SY", TWN: "TW", TJK: "TJ", TZA: "TZ", THA: "TH",
  TLS: "TL", TGO: "TG", TTO: "TT", TUN: "TN", TUR: "TR", TKM: "TM",
  UGA: "UG", UKR: "UA", ARE: "AE", GBR: "GB", USA: "US", URY: "UY",
  UZB: "UZ", VEN: "VE", VNM: "VN", YEM: "YE", ZMB: "ZM", ZWE: "ZW",
  // Special MRZ codes
  D: "DE", // Germany abbreviation sometimes used
};

/**
 * Convert an ISO 3166-1 alpha-3 nationality code (from MRZ) to
 * the alpha-2 code used by the reception form's COUNTRIES list.
 * Returns empty string when the mapping is unknown.
 */
export function alpha3ToAlpha2(alpha3: string): string {
  return ALPHA3_TO_ALPHA2[alpha3.toUpperCase()] ?? "";
}
