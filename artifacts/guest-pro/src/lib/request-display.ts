/**
 * Request Display Layer — maps domain keys to localized guest-facing text.
 */

import type { GuestTranslations } from "@/lib/i18n";
import type { ServiceRequest, ServiceRequestType } from "./service-requests";

type T = GuestTranslations;

const SUPPORT_ISSUE_KEYS: Record<string, keyof T> = {
  MINIBAR_REFRESH: "flowIssueMinibark",
  EXTRA_PILLOW: "flowIssuePillow",
  ROOM_CLEANING: "flowIssueCleaning",
  ROOM_ISSUE: "flowIssueRoomIssue",
  TECH_ISSUE: "flowIssueTechIssue",
  NOISE_COMPLAINT: "flowIssueNoise",
  EXTRA_SUPPLIES: "flowIssueExtra",
  OTHER: "flowIssueOther",
};

const URGENCY_KEYS: Record<string, keyof T> = {
  URGENT: "flowUrgUrgent",
  NORMAL: "flowUrgNormal",
};

const SLEEP_KEYS: Record<string, keyof T> = {
  EARLY: "flowSleepEarly",
  NORMAL: "flowSleepNormal",
  LATE: "flowSleepLate",
};

const DIET_KEYS: Record<string, keyof T> = {
  NORMAL: "flowDietNormal",
  VEGETARIAN: "flowDietVeg",
  VEGAN: "flowDietVegan",
  GLUTEN_FREE: "flowDietGluten",
  HALAL: "flowDietHalal",
};

const COMFORT_KEYS: Record<string, keyof T> = {
  STANDARD: "flowComfortStd",
  EXTRA_PILLOW: "flowComfortPillow",
  EXTRA_BLANKET: "flowComfortBlanket",
  COOL_ROOM: "flowComfortCool",
  WARM_ROOM: "flowComfortWarm",
};

const SERVICE_KEYS: Record<string, keyof T> = {
  FULL_SERVICE: "flowServiceFull",
  MINIMAL_DISTURBANCE: "flowServiceMin",
};

const FOOD_CATEGORY_KEYS: Record<string, keyof T> = {
  breakfast: "flowCatBreakfast",
  light: "flowCatLight",
  main: "flowCatMain",
  drinks: "flowCatDrinks",
};

function labelFromMap(t: T, map: Record<string, keyof T>, key: string | null | undefined): string {
  if (!key) return "";
  const i18nKey = map[key];
  return i18nKey ? String(t[i18nKey]) : key;
}

// ─── Legacy Turkish resolvers (manager / staff dashboards) ───────────────────

const SUPPORT_ISSUE_LABELS_TR: Record<string, string> = {
  MINIBAR_REFRESH: "Minibar yenileme",
  EXTRA_PILLOW: "Ekstra yastık",
  ROOM_CLEANING: "Oda temizliği",
  ROOM_ISSUE: "Oda sorunu",
  TECH_ISSUE: "Teknik sorun",
  NOISE_COMPLAINT: "Gürültü şikayeti",
  EXTRA_SUPPLIES: "Ekstra malzeme",
  OTHER: "Diğer",
};

const URGENCY_LABELS_TR: Record<string, string> = {
  URGENT: "Acil",
  NORMAL: "Normal",
};

const SLEEP_LABELS_TR: Record<string, string> = {
  EARLY: "Erken uyuyan",
  NORMAL: "Normal saatler",
  LATE: "Geç uyuyan",
};

const DIET_LABELS_TR: Record<string, string> = {
  NORMAL: "Tercih yok",
  VEGETARIAN: "Vejetaryen",
  VEGAN: "Vegan",
  GLUTEN_FREE: "Glütensiz",
  HALAL: "Helal",
};

const COMFORT_LABELS_TR: Record<string, string> = {
  STANDARD: "Standart",
  EXTRA_PILLOW: "Ekstra yastık",
  EXTRA_BLANKET: "Ekstra battaniye",
  COOL_ROOM: "Serin oda",
  WARM_ROOM: "Sıcak oda",
};

const SERVICE_LABELS_TR: Record<string, string> = {
  FULL_SERVICE: "Tam servis",
  MINIMAL_DISTURBANCE: "Rahatsız edilmeme",
};

const FOOD_CATEGORY_LABELS_TR: Record<string, string> = {
  breakfast: "Kahvaltı",
  light: "Hafif yemek",
  main: "Ana yemek",
  drinks: "İçecekler",
};

function trLabel(map: Record<string, string>, key: string | null | undefined): string {
  if (!key) return "";
  return map[key] ?? key;
}

export function displaySupportIssue(key: string | null | undefined, t?: T): string {
  if (t) return labelFromMap(t, SUPPORT_ISSUE_KEYS, key);
  return trLabel(SUPPORT_ISSUE_LABELS_TR, key);
}

export function displayUrgency(key: string | null | undefined, t?: T): string {
  if (t) return labelFromMap(t, URGENCY_KEYS, key);
  return trLabel(URGENCY_LABELS_TR, key);
}

export function displaySleep(key: string | null | undefined, t?: T): string {
  if (t) return labelFromMap(t, SLEEP_KEYS, key);
  return trLabel(SLEEP_LABELS_TR, key);
}

export function displayDiet(key: string | null | undefined, t?: T): string {
  if (t) return labelFromMap(t, DIET_KEYS, key);
  return trLabel(DIET_LABELS_TR, key);
}

export function displayComfort(key: string | null | undefined, t?: T): string {
  if (t) return labelFromMap(t, COMFORT_KEYS, key);
  return trLabel(COMFORT_LABELS_TR, key);
}

export function displayService(key: string | null | undefined, t?: T): string {
  if (t) return labelFromMap(t, SERVICE_KEYS, key);
  return trLabel(SERVICE_LABELS_TR, key);
}

export function displayFoodCategory(key: string | null | undefined, t?: T): string {
  if (t) return labelFromMap(t, FOOD_CATEGORY_KEYS, key);
  return trLabel(FOOD_CATEGORY_LABELS_TR, key);
}

export function getRequestTypeMeta(t: T): Record<ServiceRequestType, { label: string; shortLabel: string }> {
  return {
    FOOD_ORDER: { label: t.flowFoodLabel, shortLabel: t.flowFoodLabel },
    SUPPORT_REQUEST: { label: t.flowSupportLabel, shortLabel: t.flowSupportLabel },
    CARE_PROFILE_UPDATE: { label: t.flowCareLabel, shortLabel: t.flowCareLabel },
    GENERAL_SERVICE_REQUEST: { label: t.reqTypeGeneral, shortLabel: t.reqTypeGeneral },
  };
}

/** @deprecated Use getRequestTypeMeta(t) for guest UI */
export const REQUEST_TYPE_META: Record<ServiceRequestType, { label: string; shortLabel: string }> = {
  FOOD_ORDER: { label: "Yemek Siparişi", shortLabel: "Yemek" },
  SUPPORT_REQUEST: { label: "Destek Talebi", shortLabel: "Destek" },
  CARE_PROFILE_UPDATE: { label: "Care About Me", shortLabel: "Care" },
  GENERAL_SERVICE_REQUEST: { label: "Genel Talep", shortLabel: "Genel" },
};

export function buildDisplaySummary(request: ServiceRequest, t?: T): string {
  const { requestType, summary, structuredData: sd } = request;

  if (!sd) return summary;

  if (requestType === "FOOD_ORDER") {
    const item = sd.item as string | undefined;
    const qty = sd.quantity as number | undefined;
    const cat = displayFoodCategory(sd.category as string | undefined, t);
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
    else if (issueKey) parts.push(displaySupportIssue(issueKey, t));
    if (urgencyKey && urgencyKey !== "NORMAL") parts.push(`· ${displayUrgency(urgencyKey, t)}`);
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
    if (dietKey && dietKey !== "NORMAL") parts.push(displayDiet(dietKey, t));
    if (sleepKey && sleepKey !== "NORMAL") parts.push(displaySleep(sleepKey, t));
    if (comfortKey && comfortKey !== "STANDARD") parts.push(displayComfort(comfortKey, t));
    if (serviceKey) parts.push(displayService(serviceKey, t));
    return parts.length > 0 ? parts.join(", ") : summary;
  }

  return summary;
}

export interface RequestDetailLine {
  label: string;
  value: string;
}

export function buildDetailLines(request: ServiceRequest, t?: T): RequestDetailLine[] {
  const { requestType, structuredData: sd } = request;
  if (!sd) return [];

  if (requestType === "FOOD_ORDER") {
    const lines: RequestDetailLine[] = [];
    const cat = sd.category as string | undefined;
    if (cat) {
      lines.push({
        label: t?.reqDetailCategory ?? "Kategori",
        value: displayFoodCategory(cat, t),
      });
    }
    const item = sd.item as string | undefined;
    if (item) lines.push({ label: t?.flowSumFood ?? "Ürün", value: item });
    const qty = sd.quantity as number | undefined;
    if (qty) lines.push({ label: t?.flowSumPortions ?? "Adet", value: String(qty) });
    const note = sd.note as string | undefined;
    if (note?.trim()) lines.push({ label: t?.flowSumNote ?? "Not", value: note.trim() });
    return lines;
  }

  if (requestType === "SUPPORT_REQUEST") {
    const lines: RequestDetailLine[] = [];
    const issueCustom = sd.issueTypeCustom as string | undefined;
    const issueKey = sd.issueTypeKey as string | undefined;
    const issue = issueCustom?.trim() || displaySupportIssue(issueKey, t);
    if (issue) lines.push({ label: t?.flowSumTopic ?? "Konu", value: issue });
    const urgencyKey = sd.urgencyKey as string | undefined;
    if (urgencyKey) {
      lines.push({ label: t?.flowSumPriority ?? "Öncelik", value: displayUrgency(urgencyKey, t) });
    }
    const note = sd.note as string | undefined;
    if (note?.trim()) lines.push({ label: t?.flowSumNote ?? "Not", value: note.trim() });
    return lines;
  }

  if (requestType === "CARE_PROFILE_UPDATE") {
    const lines: RequestDetailLine[] = [];
    const free = sd.freetext as string | undefined;
    if (free?.trim()) lines.push({ label: t?.flowSumNote ?? "Not", value: free.trim() });
    const sleepKey = sd.sleepKey as string | undefined;
    if (sleepKey) lines.push({ label: t?.flowSumSleep ?? "Uyku", value: displaySleep(sleepKey, t) });
    const dietKey = sd.dietKey as string | undefined;
    if (dietKey) lines.push({ label: t?.flowSumDiet ?? "Diyet", value: displayDiet(dietKey, t) });
    const comfortKey = sd.comfortKey as string | undefined;
    if (comfortKey) {
      lines.push({ label: t?.flowSumComfort ?? "Konfor", value: displayComfort(comfortKey, t) });
    }
    const serviceKey = sd.serviceKey as string | undefined;
    if (serviceKey) {
      lines.push({ label: t?.flowSumService ?? "Servis", value: displayService(serviceKey, t) });
    }
    return lines;
  }

  return [];
}
