/**
 * Guest dashboard section anchors + mobile drawer navigation config.
 */

import {
  Mic,
  Bot,
  KeyRound,
  Zap,
  MapPin,
  Receipt,
  Building2,
  Sparkles,
  Hammer,
  type LucideIcon,
} from "lucide-react";
import type { GuestTranslations } from "@/lib/i18n";

type NavIcon = LucideIcon;

/** DOM ids for scroll targets (must match home.tsx section elements). */
export const GUEST_SECTION_IDS = {
  voice: "section-voice",
  ask: "section-ask",
  stay: "section-stay",
  quickActions: "section-quick-actions",
  requests: "section-requests",
  nearby: "section-nearby",
  bill: "section-bill",
  hotel: "section-hotel",
  atYourService: "section-at-your-service",
} as const;

export type GuestSectionId = (typeof GUEST_SECTION_IDS)[keyof typeof GUEST_SECTION_IDS];

export interface GuestDashboardNavContext {
  t: GuestTranslations;
  nearbyLabel: string;
  showRequests: boolean;
}

export interface GuestDashboardNavItem {
  id: string;
  sectionId: GuestSectionId;
  icon: NavIcon;
  label: string;
}

type NavItemDef = {
  id: string;
  sectionId: GuestSectionId;
  icon: NavIcon;
  resolveLabel: (ctx: GuestDashboardNavContext) => string;
  isVisible?: (ctx: GuestDashboardNavContext) => boolean;
};

const NAV_ITEM_DEFS: NavItemDef[] = [
  {
    id: "voice",
    sectionId: GUEST_SECTION_IDS.voice,
    icon: Mic,
    resolveLabel: ({ t }) => t.voiceLabel,
  },
  {
    id: "ask",
    sectionId: GUEST_SECTION_IDS.ask,
    icon: Bot,
    resolveLabel: ({ t }) => t.askSomethingLabel,
  },
  {
    id: "stay",
    sectionId: GUEST_SECTION_IDS.stay,
    icon: KeyRound,
    resolveLabel: ({ t }) => t.stayAboutTitle,
  },
  {
    id: "quick-actions",
    sectionId: GUEST_SECTION_IDS.quickActions,
    icon: Zap,
    resolveLabel: ({ t }) => t.quickActionsSection,
  },
  {
    id: "requests",
    sectionId: GUEST_SECTION_IDS.requests,
    icon: Hammer,
    resolveLabel: ({ t }) => t.myRequestsTitle,
    isVisible: ({ showRequests }) => showRequests,
  },
  {
    id: "nearby",
    sectionId: GUEST_SECTION_IDS.nearby,
    icon: MapPin,
    resolveLabel: ({ nearbyLabel }) => nearbyLabel,
  },
  {
    id: "bill",
    sectionId: GUEST_SECTION_IDS.bill,
    icon: Receipt,
    resolveLabel: ({ t }) => t.billSection,
  },
  {
    id: "hotel",
    sectionId: GUEST_SECTION_IDS.hotel,
    icon: Building2,
    resolveLabel: ({ t }) => t.hotelConnectSection,
  },
  {
    id: "at-your-service",
    sectionId: GUEST_SECTION_IDS.atYourService,
    icon: Sparkles,
    resolveLabel: ({ t }) => t.infoSection,
  },
];

export function buildGuestDashboardNavItems(ctx: GuestDashboardNavContext): GuestDashboardNavItem[] {
  return NAV_ITEM_DEFS.filter((def) => def.isVisible?.(ctx) !== false).map((def) => ({
    id: def.id,
    sectionId: def.sectionId,
    icon: def.icon,
    label: def.resolveLabel(ctx),
  }));
}

/** Smooth scroll with sticky header offset. */
export function scrollToGuestSection(
  sectionId: string,
  options?: { headerOffsetPx?: number; onComplete?: () => void },
): boolean {
  const el = document.getElementById(sectionId);
  if (!el) return false;

  const headerOffset = options?.headerOffsetPx ?? 72;
  const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  options?.onComplete?.();
  return true;
}
