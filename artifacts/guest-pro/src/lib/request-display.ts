/**
 * Request Display Layer
 *
 * Centralized mapper that converts internal enum/key values from structuredData
 * into premium, human-readable display text. Never scatter enum-to-label
 * mapping in individual UI components.
 *
 * Architecture:
 *   domain layer   → stores raw keys (MINIBAR_REFRESH, GLUTEN_FREE, …)
 *   this module    → maps keys → display text
 *   UI components  → consume display text, never raw keys
 */

import type { ServiceRequest, ServiceRequestType } from "./service-requests";

// ─── Support issue type labels ────────────────────────────────────────────────

const SUPPORT_ISSUE_LABELS: Record<string, string> = {
  MINIBAR_REFRESH: "Minibar yenileme",
  EXTRA_PILLOW: "Ekstra yastık",
  ROOM_CLEANING: "Oda temizliği",
  ROOM_ISSUE: "Oda sorunu",
  TECH_ISSUE: "Teknik sorun",
  NOISE_COMPLAINT: "Gürültü şikayeti",
  EXTRA_SUPPLIES: "Ekstra malzeme",
  OTHER: "Diğer",
};

const URGENCY_LABELS: Record<string, string> = {
  URGENT: "Acil",
  NORMAL: "Normal",
};

// ─── Care profile labels ──────────────────────────────────────────────────────

const SLEEP_LABELS: Record<string, string> = {
  EARLY: "Erken uyuyan",
  NORMAL: "Normal saatler",
  LATE: "Geç uyuyan",
};

const DIET_LABELS: Record<string, string> = {
  NORMAL: "Tercih yok",
  VEGETARIAN: "Vejetaryen",
  VEGAN: "Vegan",
  GLUTEN_FREE: "Glütensiz",
  HALAL: "Helal",
};

const COMFORT_LABELS: Record<string, string> = {
  STANDARD: "Standart",
  EXTRA_PILLOW: "Ekstra yastık",
  EXTRA_BLANKET: "Ekstra battaniye",
  COOL_ROOM: "Serin oda",
  WARM_ROOM: "Sıcak oda",
};

const SERVICE_LABELS: Record<string, string> = {
  FULL_SERVICE: "Tam servis",
  MINIMAL_DISTURBANCE: "Rahatsız edilmeme",
};

const FOOD_CATEGORY_LABELS: Record<string, string> = {
  breakfast: "Kahvaltı",
  light: "Hafif yemek",
  main: "Ana yemek",
  drinks: "İçecekler",
};

// ─── Individual resolvers (exported for reuse) ─────────────────────────────────

export function displaySupportIssue(key: string | null | undefined): string {
  if (!key) return "";
  return SUPPORT_ISSUE_LABELS[key] ?? key;
}

export function displayUrgency(key: string | null | undefined): string {
  if (!key) return "";
  return URGENCY_LABELS[key] ?? key;
}

export function displaySleep(key: string | null | undefined): string {
  if (!key) return "";
  return SLEEP_LABELS[key] ?? key;
}

export function displayDiet(key: string | null | undefined): string {
  if (!key) return "";
  return DIET_LABELS[key] ?? key;
}

export function displayComfort(key: string | null | undefined): string {
  if (!key) return "";
  return COMFORT_LABELS[key] ?? key;
}

export function displayService(key: string | null | undefined): string {
  if (!key) return "";
  return SERVICE_LABELS[key] ?? key;
}

export function displayFoodCategory(key: string | null | undefined): string {
  if (!key) return "";
  return FOOD_CATEGORY_LABELS[key] ?? key;
}

// ─── Primary display summary builder ──────────────────────────────────────────
//
// Takes a ServiceRequest and builds a clean, human-readable one-line summary
// for use in request cards. Falls back to the stored summary text if
// structuredData is missing or insufficient.

export function buildDisplaySummary(request: ServiceRequest): string {
  const { requestType, summary, structuredData: sd } = request;

  if (!sd) return summary;

  if (requestType === "FOOD_ORDER") {
    const item = sd.item as string | undefined;
    const qty = sd.quantity as number | undefined;
    const cat = displayFoodCategory(sd.category as string | undefined);
    const note = sd.note as string | undefined;
    const parts: string[] = [];
    if (item) parts.push(item);
    else if (cat) parts.push(cat);
    if (qty && qty > 1) parts.push(`× ${qty}`);
    if (note) parts.push(`— ${note}`);
    return parts.length > 0 ? parts.join(" ") : summary;
  }

  if (requestType === "SUPPORT_REQUEST") {
    const issueCustom = sd.issueTypeCustom as string | undefined;
    const issueKey = sd.issueTypeKey as string | undefined;
    const urgencyKey = sd.urgencyKey as string | undefined;
    const note = sd.note as string | undefined;
    const parts: string[] = [];
    if (issueCustom?.trim()) parts.push(issueCustom.trim());
    else if (issueKey) parts.push(displaySupportIssue(issueKey));
    if (urgencyKey && urgencyKey !== "NORMAL") parts.push(`· ${displayUrgency(urgencyKey)}`);
    if (note?.trim()) parts.push(`— ${note.trim()}`);
    return parts.length > 0 ? parts.join(" ") : summary;
  }

  if (requestType === "CARE_PROFILE_UPDATE") {
    const free = sd.freetext as string | undefined;
    const dietKey = sd.dietKey as string | undefined;
    const sleepKey = sd.sleepKey as string | undefined;
    const comfortKey = sd.comfortKey as string | undefined;
    const serviceKey = sd.serviceKey as string | undefined;
    const parts: string[] = [];
    if (free?.trim()) parts.push(free.trim());
    if (dietKey && dietKey !== "NORMAL") parts.push(displayDiet(dietKey));
    if (sleepKey && sleepKey !== "NORMAL") parts.push(displaySleep(sleepKey));
    if (comfortKey && comfortKey !== "STANDARD") parts.push(displayComfort(comfortKey));
    if (serviceKey) parts.push(displayService(serviceKey));
    return parts.length > 0 ? parts.join(", ") : summary;
  }

  return summary;
}

// ─── Structured data detail lines (for expanded cards) ─────────────────────────

export interface RequestDetailLine {
  label: string;
  value: string;
}

export function buildDetailLines(request: ServiceRequest): RequestDetailLine[] {
  const { requestType, structuredData: sd } = request;
  if (!sd) return [];

  if (requestType === "FOOD_ORDER") {
    const lines: RequestDetailLine[] = [];
    const cat = sd.category as string | undefined;
    if (cat) lines.push({ label: "Kategori", value: displayFoodCategory(cat) });
    const item = sd.item as string | undefined;
    if (item) lines.push({ label: "Ürün", value: item });
    const qty = sd.quantity as number | undefined;
    if (qty) lines.push({ label: "Adet", value: String(qty) });
    const note = sd.note as string | undefined;
    if (note?.trim()) lines.push({ label: "Not", value: note.trim() });
    return lines;
  }

  if (requestType === "SUPPORT_REQUEST") {
    const lines: RequestDetailLine[] = [];
    const issueCustom = sd.issueTypeCustom as string | undefined;
    const issueKey = sd.issueTypeKey as string | undefined;
    const issue = issueCustom?.trim() || displaySupportIssue(issueKey);
    if (issue) lines.push({ label: "Konu", value: issue });
    const urgencyKey = sd.urgencyKey as string | undefined;
    if (urgencyKey) lines.push({ label: "Öncelik", value: displayUrgency(urgencyKey) });
    const note = sd.note as string | undefined;
    if (note?.trim()) lines.push({ label: "Not", value: note.trim() });
    return lines;
  }

  if (requestType === "CARE_PROFILE_UPDATE") {
    const lines: RequestDetailLine[] = [];
    const free = sd.freetext as string | undefined;
    if (free?.trim()) lines.push({ label: "Not", value: free.trim() });
    const sleepKey = sd.sleepKey as string | undefined;
    if (sleepKey) lines.push({ label: "Uyku", value: displaySleep(sleepKey) });
    const dietKey = sd.dietKey as string | undefined;
    if (dietKey) lines.push({ label: "Diyet", value: displayDiet(dietKey) });
    const comfortKey = sd.comfortKey as string | undefined;
    if (comfortKey) lines.push({ label: "Konfor", value: displayComfort(comfortKey) });
    const serviceKey = sd.serviceKey as string | undefined;
    if (serviceKey) lines.push({ label: "Servis", value: displayService(serviceKey) });
    return lines;
  }

  return [];
}

// ─── Request type meta ────────────────────────────────────────────────────────

export const REQUEST_TYPE_META: Record<
  ServiceRequestType,
  { label: string; shortLabel: string }
> = {
  FOOD_ORDER: { label: "Yemek Siparişi", shortLabel: "Yemek" },
  SUPPORT_REQUEST: { label: "Destek Talebi", shortLabel: "Destek" },
  CARE_PROFILE_UPDATE: { label: "Care About Me", shortLabel: "Care" },
  GENERAL_SERVICE_REQUEST: { label: "Genel Talep", shortLabel: "Genel" },
};
