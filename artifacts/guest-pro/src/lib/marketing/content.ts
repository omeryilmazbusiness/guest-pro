import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  BarChart3,
  Bot,
  Clock,
  Globe2,
  Headphones,
  Languages,
  MapPin,
  MessageSquare,
  MessageSquareWarning,
  Mic,
  QrCode,
  Route,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Workflow,
} from "lucide-react";

export interface MarketingNavItem {
  id: string;
  href: string;
  labelKey: "why" | "howItWorks" | "product" | "forHotels" | "demo";
}

export const MARKETING_NAV: MarketingNavItem[] = [
  { id: "challenges", labelKey: "why", href: "#challenges" },
  { id: "how-it-works", labelKey: "howItWorks", href: "#how-it-works" },
  { id: "features", labelKey: "product", href: "#features" },
  { id: "for-hotels", labelKey: "forHotels", href: "#for-hotels" },
  { id: "demo", labelKey: "demo", href: "#demo" },
];

/** ISO codes for country ticker flags (names from i18n `countries`) */
export const MARKETING_COUNTRY_CODES = [
  "TR", "AE", "SA", "GB", "US", "DE", "FR", "ES", "IT", "JP", "CN", "RU", "BR", "IN", "NL", "CH",
  "QA", "EG", "GR", "PT", "PL", "SE", "KR", "TH", "VN", "ID",
] as const;

export const HERO_VALUE_PILLS = [
  { icon: Bot, key: "pillConcierge" as const },
  { icon: Languages, key: "pillLanguages" as const },
  { icon: Headphones, key: "pillTranslator" as const },
] as const;

export const HERO_STATS = [
  { value: "24/7", key: "statConcierge" as const },
  { value: "country", key: "statCountries" as const },
  { value: "Live", key: "statTranslator" as const },
] as const;

export const PROBLEM_ICONS = [
  MessageSquareWarning,
  Globe2,
  Route,
  Clock,
  AlertTriangle,
  Users,
] as const;

export const SOLUTION_ICONS = [QrCode, Mic, Workflow] as const;

export const HOW_STEP_ICONS = [QrCode, Bot, Sparkles] as const;

export const FEATURE_ICONS = [Bot, Languages, Headphones, Route, Globe2, Workflow] as const;

export const HOTEL_STORY_ICONS = [MessageSquare, Languages, MapPin, BarChart3] as const;

export const HOTEL_PILLAR_ICONS = [TrendingUp, Workflow, Star] as const;
