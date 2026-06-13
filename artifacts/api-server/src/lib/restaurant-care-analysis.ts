/**
 * Restaurant care analysis — extract guest Care About Me text and produce
 * exactly 3 concise kitchen preparation rules for the restaurant team.
 */

export const RESTAURANT_CARE_INSIGHT_COUNT = 3;

export interface CareRequestSummary {
  roomNumber: string;
  guestName: string;
  summary: string;
  structuredData?: Record<string, unknown> | null;
  createdAt?: string | Date;
}

const DIET_LABELS: Record<string, string> = {
  NORMAL: "Normal / kısıtlama yok",
  VEGETARIAN: "Vejetaryen",
  VEGAN: "Vegan",
  GLUTEN_FREE: "Glutensiz",
  HALAL: "Helal",
};

const SLEEP_LABELS: Record<string, string> = {
  EARLY: "Erken yatıyor",
  NORMAL: "Normal uyku düzeni",
  LATE: "Geç yatıyor",
};

const COMFORT_LABELS: Record<string, string> = {
  STANDARD: "Standart konfor",
  EXTRA_PILLOW: "Ekstra yastık",
  EXTRA_BLANKET: "Ekstra battaniye",
  COOL_ROOM: "Serin oda tercihi",
  WARM_ROOM: "Sıcak oda tercihi",
};

const SERVICE_LABELS: Record<string, string> = {
  FULL_SERVICE: "Tam oda servisi",
  MINIMAL_DISTURBANCE: "Minimum rahatsızlık",
};

const STRUCTURED_SKIP_KEYS = new Set([
  "originalLanguage",
  "dietKey",
  "sleepKey",
  "comfortKey",
  "serviceKey",
  "freetext",
  "note",
  "preferences",
  "allergies",
  "dietaryRestrictions",
]);

function asTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function labelFromMap(map: Record<string, string>, key: string | null): string | null {
  if (!key) return null;
  return map[key] ?? key;
}

/** Collect every guest-entered care text line from structured data + summary. */
export function extractCareProfileText(profile: CareRequestSummary): string[] {
  const sd = profile.structuredData ?? {};
  const lines: string[] = [];

  const freetext =
    asTrimmedString(sd.freetext) ??
    asTrimmedString(sd.note) ??
    asTrimmedString(sd.preferences) ??
    asTrimmedString(sd.allergies) ??
    asTrimmedString(sd.dietaryRestrictions);
  if (freetext) lines.push(`Misafir notu: ${freetext}`);

  const diet = labelFromMap(DIET_LABELS, asTrimmedString(sd.dietKey));
  if (diet && sd.dietKey !== "NORMAL") lines.push(`Beslenme tercihi: ${diet}`);

  const sleep = labelFromMap(SLEEP_LABELS, asTrimmedString(sd.sleepKey));
  if (sleep && sd.sleepKey !== "NORMAL") lines.push(`Uyku düzeni: ${sleep}`);

  const comfort = labelFromMap(COMFORT_LABELS, asTrimmedString(sd.comfortKey));
  if (comfort && sd.comfortKey !== "STANDARD") lines.push(`Konfor tercihi: ${comfort}`);

  const service = labelFromMap(SERVICE_LABELS, asTrimmedString(sd.serviceKey));
  if (service) lines.push(`Servis tercihi: ${service}`);

  for (const [key, value] of Object.entries(sd)) {
    if (STRUCTURED_SKIP_KEYS.has(key)) continue;
    const text = asTrimmedString(value);
    if (text) lines.push(`${key}: ${text}`);
    if (Array.isArray(value)) {
      const joined = value
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean)
        .join(", ");
      if (joined) lines.push(`${key}: ${joined}`);
    }
  }

  const summary = profile.summary?.trim();
  if (summary && !lines.some((line) => line.includes(summary))) {
    lines.push(`Kayıt özeti: ${summary}`);
  }

  return lines;
}

export function formatCareProfileBlock(profile: CareRequestSummary): string {
  const lines = extractCareProfileText(profile);
  const header = `Oda ${profile.roomNumber} (${profile.guestName})`;
  if (lines.length === 0) return `${header}: (boş profil)`;
  return `${header}:\n${lines.map((l) => `  - ${l}`).join("\n")}`;
}

/** Keep only the latest care profile per room (guests may resubmit). */
export function dedupeCareProfilesByRoom(profiles: CareRequestSummary[]): CareRequestSummary[] {
  const byRoom = new Map<string, CareRequestSummary>();
  for (const profile of profiles) {
    const key = profile.roomNumber.trim() || `unknown-${byRoom.size}`;
    const existing = byRoom.get(key);
    if (!existing) {
      byRoom.set(key, profile);
      continue;
    }
    const existingTs = existing.createdAt ? new Date(existing.createdAt).getTime() : 0;
    const currentTs = profile.createdAt ? new Date(profile.createdAt).getTime() : 0;
    if (currentTs >= existingTs) byRoom.set(key, profile);
  }
  return [...byRoom.values()];
}

export function buildRestaurantCarePrompt(profiles: CareRequestSummary[]): string {
  const blocks = profiles.map(formatCareProfileBlock).join("\n\n");

  return `Sen 5 yıldızlı bir otel mutfağının baş şefisin. Aşağıdaki Care About Me profillerindeki TÜM misafir yazılarını ve tercihlerini dikkatlice oku.

Görevin: Restoran ve oda servisi ekibine, bu misafir verilerine göre yemek hazırlarken uyması gereken sağlık ve beslenme kurallarını anlat.

MİSAFİR CARE ABOUT ME VERİLERİ (${profiles.length} profil):
${blocks}

KURALLAR:
- Tam ${RESTAURANT_CARE_INSIGHT_COUNT} madde döndür (ne fazla ne eksik)
- Her madde en fazla 120 karakter, kısa, net ve uygulanabilir olsun
- Sadece mutfak/oda servisi ile ilgili: alerji, diyet, çapraz bulaşma, pişirme yöntemi, içerik seçimi, servis zamanı
- Oda numarası veya misafir adı yazma — genel mutfak kuralları olarak yaz
- Türkçe yaz

Yanıt formatı — SADECE JSON dizisi, başka metin ekleme:
["madde 1", "madde 2", "madde 3"]`;
}

export function parseRestaurantCareInsights(raw: string): string[] | null {
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) return null;
    const items = parsed
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim().replace(/^[-•*\d.)\s]+/, "").trim())
      .filter((item) => item.length > 0)
      .map((item) => (item.length > 160 ? `${item.slice(0, 157)}…` : item));
    if (items.length !== RESTAURANT_CARE_INSIGHT_COUNT) return null;
    return items;
  } catch {
    return null;
  }
}

const FALLBACK_POOL = [
  "Alerji ve diyet notlarını sipariş öncesi mutfak ekibiyle paylaşın.",
  "Çapraz bulaşmayı önlemek için kesme tahtası ve ekipmanları ayırın.",
  "Misafir notlarındaki içerik kısıtlarına göre menü alternatifleri hazırlayın.",
  "Glutensiz taleplerde ayrı hazırlık alanı ve temiz ekipman kullanın.",
  "Vegan/vejetaryen yemeklerde hayvansal ürün temasına karşı sıkı kontrol uygulayın.",
  "Helal gereksinimlerde uygun sertifikalı malzeme ve pişirme süreci kullanın.",
  "Şeker, tuz ve yağ kısıtlamalarını porsiyon ve sos seçiminde dikkate alın.",
];

/** Rule-based fallback when AI is unavailable or returns invalid output. */
export function buildFallbackCareInsights(profiles: CareRequestSummary[]): string[] {
  const tips: string[] = [];
  const diets = new Set<string>();
  let hasFreeText = false;

  for (const profile of profiles) {
    const sd = profile.structuredData ?? {};
    const dietKey = asTrimmedString(sd.dietKey);
    if (dietKey && dietKey !== "NORMAL") diets.add(dietKey);

    const free =
      asTrimmedString(sd.freetext) ??
      asTrimmedString(sd.note) ??
      asTrimmedString(sd.allergies);
    if (free) hasFreeText = true;
  }

  if (diets.has("GLUTEN_FREE")) {
    tips.push("Glutensiz taleplerde ayrı hazırlık alanı ve temiz ekipman kullanın.");
  }
  if (diets.has("VEGAN")) {
    tips.push("Vegan menülerde hayvansal ürün ve çapraz bulaşmaya karşı sıkı kontrol uygulayın.");
  }
  if (diets.has("VEGETARIAN")) {
    tips.push("Vejetaryen yemeklerde et ve balık türevi içermeyen malzeme seçin.");
  }
  if (diets.has("HALAL")) {
    tips.push("Helal gereksinimlerde uygun sertifikalı malzeme ve pişirme süreci kullanın.");
  }
  if (hasFreeText) {
    tips.push("Care About Me notlarındaki alerji ve kısıtlamaları sipariş öncesi mutfağa iletin.");
  }

  for (const fallback of FALLBACK_POOL) {
    if (tips.length >= RESTAURANT_CARE_INSIGHT_COUNT) break;
    if (!tips.includes(fallback)) tips.push(fallback);
  }

  return tips.slice(0, RESTAURANT_CARE_INSIGHT_COUNT);
}

export function normalizeCareInsights(items: string[]): string[] {
  return items
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, RESTAURANT_CARE_INSIGHT_COUNT);
}
