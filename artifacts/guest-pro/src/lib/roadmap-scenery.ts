import { findCountryForCity } from "@/lib/hotel-cities";

export interface RoadmapSceneryTheme {
  countryCode: string;
  accent: string;
  accentSoft: string;
  /** CSS linear-gradient for reliable prod backgrounds (no external CDN). */
  gradientCss: string;
  overlayTop: string;
  overlayBottom: string;
}

const COUNTRY_THEMES: Record<
  string,
  { accent: string; accentSoft: string; from: string; via: string; to: string }
> = {
  TR: { accent: "#c2410c", accentSoft: "#ffedd5", from: "#7c2d12", via: "#c2410c", to: "#1e1b4b" },
  AE: { accent: "#b45309", accentSoft: "#fef3c7", from: "#78350f", via: "#d97706", to: "#0c4a6e" },
  SA: { accent: "#a16207", accentSoft: "#fef9c3", from: "#92400e", via: "#ca8a04", to: "#1c1917" },
  EG: { accent: "#a16207", accentSoft: "#fef08a", from: "#854d0e", via: "#eab308", to: "#1e3a5f" },
  GB: { accent: "#1e40af", accentSoft: "#dbeafe", from: "#1e3a8a", via: "#3b82f6", to: "#0f172a" },
  US: { accent: "#1d4ed8", accentSoft: "#bfdbfe", from: "#1e3a8a", via: "#2563eb", to: "#172554" },
  FR: { accent: "#1d4ed8", accentSoft: "#dbeafe", from: "#1e3a8a", via: "#6366f1", to: "#312e81" },
  DE: { accent: "#374151", accentSoft: "#e5e7eb", from: "#111827", via: "#4b5563", to: "#030712" },
  IT: { accent: "#15803d", accentSoft: "#bbf7d0", from: "#14532d", via: "#16a34a", to: "#1e1b4b" },
  ES: { accent: "#c2410c", accentSoft: "#fed7aa", from: "#9a3412", via: "#ea580c", to: "#1e1b4b" },
  GR: { accent: "#0369a1", accentSoft: "#bae6fd", from: "#0c4a6e", via: "#0284c7", to: "#0f172a" },
  PT: { accent: "#b45309", accentSoft: "#fde68a", from: "#9a3412", via: "#d97706", to: "#1e3a8a" },
  NL: { accent: "#ea580c", accentSoft: "#ffedd5", from: "#9a3412", via: "#f97316", to: "#1e3a8a" },
  CH: { accent: "#dc2626", accentSoft: "#fecaca", from: "#7f1d1d", via: "#ef4444", to: "#1e293b" },
  AT: { accent: "#dc2626", accentSoft: "#fee2e2", from: "#991b1b", via: "#b91c1c", to: "#0f172a" },
  RU: { accent: "#1d4ed8", accentSoft: "#bfdbfe", from: "#1e3a8a", via: "#3b82f6", to: "#18181b" },
  QA: { accent: "#7c3aed", accentSoft: "#ede9fe", from: "#4c1d95", via: "#8b5cf6", to: "#0f172a" },
  MA: { accent: "#b45309", accentSoft: "#fef3c7", from: "#78350f", via: "#d97706", to: "#451a03" },
  TH: { accent: "#be123c", accentSoft: "#fecdd3", from: "#9f1239", via: "#e11d48", to: "#1e3a8a" },
  JP: { accent: "#be123c", accentSoft: "#fecdd3", from: "#881337", via: "#db2777", to: "#1e1b4b" },
  KR: { accent: "#4f46e5", accentSoft: "#c7d2fe", from: "#312e81", via: "#6366f1", to: "#0f172a" },
  CN: { accent: "#dc2626", accentSoft: "#fecaca", from: "#7f1d1d", via: "#ef4444", to: "#1c1917" },
  IN: { accent: "#ea580c", accentSoft: "#ffedd5", from: "#9a3412", via: "#f97316", to: "#581c87" },
  AU: { accent: "#0284c7", accentSoft: "#bae6fd", from: "#075985", via: "#0ea5e9", to: "#172554" },
  CA: { accent: "#dc2626", accentSoft: "#fee2e2", from: "#7f1d1d", via: "#ef4444", to: "#1e3a8a" },
  MX: { accent: "#15803d", accentSoft: "#bbf7d0", from: "#14532d", via: "#22c55e", to: "#7f1d1d" },
  BR: { accent: "#16a34a", accentSoft: "#bbf7d0", from: "#14532d", via: "#22c55e", to: "#1e3a8a" },
  IL: { accent: "#0369a1", accentSoft: "#bae6fd", from: "#0c4a6e", via: "#0284c7", to: "#f8fafc" },
  DEFAULT: { accent: "#4f46e5", accentSoft: "#e0e7ff", from: "#312e81", via: "#6366f1", to: "#0f172a" },
};

/** City-specific gradient tweaks (same country palette, different mood). */
const CITY_GRADIENT_HINT: Record<string, Partial<{ via: string }>> = {
  istanbul: { via: "#b45309" },
  cappadocia: { via: "#ea580c" },
  paris: { via: "#818cf8" },
  dubai: { via: "#fbbf24" },
  riyadh: { via: "#d97706" },
  tokyo: { via: "#f472b6" },
  rome: { via: "#22c55e" },
  barcelona: { via: "#fb923c" },
  london: { via: "#60a5fa" },
  "new york": { via: "#3b82f6" },
};

function resolveCountryCode(city?: string): string {
  const primary = city?.split(",")[0]?.trim() ?? "";
  return findCountryForCity(primary) ?? findCountryForCity(city ?? "") ?? "TR";
}

function themeForCountry(code: string) {
  return COUNTRY_THEMES[code] ?? COUNTRY_THEMES.DEFAULT!;
}

function normalizeCityKey(city?: string): string {
  if (!city?.trim()) return "";
  return city
    .split(",")[0]!
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i");
}

export function resolveRoadmapScenery(city?: string): RoadmapSceneryTheme {
  const countryCode = resolveCountryCode(city);
  const base = themeForCountry(countryCode);
  const cityKey = normalizeCityKey(city);
  const hint = CITY_GRADIENT_HINT[cityKey];
  const via = hint?.via ?? base.via;

  return {
    countryCode,
    accent: base.accent,
    accentSoft: base.accentSoft,
    gradientCss: `linear-gradient(165deg, ${base.from} 0%, ${via} 42%, ${base.to} 100%)`,
    overlayTop: "rgba(8, 8, 14, 0.35)",
    overlayBottom: "rgba(8, 8, 14, 0.55)",
  };
}
