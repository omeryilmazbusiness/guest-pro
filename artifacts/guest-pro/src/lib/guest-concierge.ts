/**
 * Guest concierge bookings — laundry, spa, taxi, salon.
 * Creates GENERAL_SERVICE_REQUEST records visible on reception (staff requests board).
 */

import type { LucideIcon } from "lucide-react";
import { Shirt, Sparkles, Car, Scissors } from "lucide-react";
import type { GuestTranslations } from "@/lib/i18n";
import { tFmt } from "@/lib/i18n";

export type ConciergeService = "laundry" | "spa_wellness" | "taxi" | "salon";

export type ConciergeWhen = "asap" | "morning" | "afternoon" | "evening" | "tomorrow";

export interface ConciergeServiceConfig {
  id: ConciergeService;
  icon: LucideIcon;
  iconColor: string;
  titleKey: keyof GuestTranslations;
}

export const CONCIERGE_SERVICES: ConciergeServiceConfig[] = [
  {
    id: "laundry",
    icon: Shirt,
    iconColor: "text-violet-500",
    titleKey: "conciergeLaundry",
  },
  {
    id: "spa_wellness",
    icon: Sparkles,
    iconColor: "text-emerald-500",
    titleKey: "conciergeSpa",
  },
  {
    id: "taxi",
    icon: Car,
    iconColor: "text-amber-500",
    titleKey: "conciergeTaxi",
  },
  {
    id: "salon",
    icon: Scissors,
    iconColor: "text-fuchsia-500",
    titleKey: "conciergeSalon",
  },
];

export const CONCIERGE_WHEN_OPTIONS: ConciergeWhen[] = [
  "asap",
  "morning",
  "afternoon",
  "evening",
  "tomorrow",
];

const WHEN_LABEL_KEYS: Record<ConciergeWhen, keyof GuestTranslations> = {
  asap: "conciergeWhenAsap",
  morning: "conciergeWhenMorning",
  afternoon: "conciergeWhenAfternoon",
  evening: "conciergeWhenEvening",
  tomorrow: "conciergeWhenTomorrow",
};

export function conciergeServiceLabel(t: GuestTranslations, service: ConciergeService): string {
  const cfg = CONCIERGE_SERVICES.find((s) => s.id === service);
  return cfg ? t[cfg.titleKey] : service;
}

export function conciergeWhenLabel(t: GuestTranslations, when: ConciergeWhen): string {
  return t[WHEN_LABEL_KEYS[when]];
}

export function buildConciergeStructuredData(
  service: ConciergeService,
  when: ConciergeWhen,
  notes: string,
): Record<string, unknown> {
  return {
    kind: "concierge_booking",
    service,
    when,
    notes: notes.trim() || null,
    destination: "reception",
  };
}

export function buildConciergeSummary(
  t: GuestTranslations,
  service: ConciergeService,
  when: ConciergeWhen,
  notes: string,
): string {
  const serviceLabel = conciergeServiceLabel(t, service);
  const whenLabel = conciergeWhenLabel(t, when);
  const base = tFmt(t.conciergeSummary, { service: serviceLabel, when: whenLabel });
  const trimmed = notes.trim();
  if (!trimmed) return base.slice(0, 500);
  return `${base} · ${trimmed}`.slice(0, 500);
}

/** Parse concierge booking from stored structuredData (guest + staff display). */
export function parseConciergeBooking(
  structuredData: Record<string, unknown> | null | undefined,
): { service: ConciergeService; when: ConciergeWhen; notes: string | null } | null {
  if (!structuredData || structuredData.kind !== "concierge_booking") return null;
  const service = structuredData.service as ConciergeService;
  const when = structuredData.when as ConciergeWhen;
  if (!CONCIERGE_SERVICES.some((s) => s.id === service)) return null;
  if (!CONCIERGE_WHEN_OPTIONS.includes(when)) return null;
  const notes = typeof structuredData.notes === "string" ? structuredData.notes : null;
  return { service, when, notes };
}
