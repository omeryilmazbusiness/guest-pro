/** ISO 639-1 base codes → full language names for translation prompts. */
import { resolveStaffTargetLang } from "./live-chat-welcome";
import {
  GUEST_UI_TRANSLATION_LANGS,
  isGuestUiTranslationLang,
} from "./live-chat-guest-locale";

export { GUEST_UI_TRANSLATION_LANGS, isGuestUiTranslationLang };
export type { GuestUiTranslationLang } from "./live-chat-guest-locale";

export const LIVE_CHAT_LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  tr: "Turkish",
  ar: "Arabic",
  de: "German",
  es: "Spanish",
  fr: "French",
  ru: "Russian",
  it: "Italian",
  fa: "Persian (Farsi)",
  he: "Hebrew",
  ku: "Kurdish (Kurmanji)",
  ur: "Urdu",
  zh: "Chinese (Mandarin)",
  ja: "Japanese",
  ko: "Korean",
  pt: "Portuguese",
  nl: "Dutch",
  pl: "Polish",
  hi: "Hindi",
};

export function resolveLanguageName(code: string): string {
  const base = code.trim().toLowerCase().split("-")[0] ?? "en";
  return LIVE_CHAT_LANGUAGE_NAMES[base] ?? base;
}

/** ISO 639-1 base code for locale strings (en-US → en). */
export function langBase(code?: string | null): string {
  return code?.trim().toLowerCase().split("-")[0] ?? "";
}

/** Resolve a UI locale to a supported translation target code. */
export function resolveTranslationTargetLang(
  locale?: string | null,
  fallback = "en",
): string {
  const base = langBase(locale);
  if (!base) return fallback;
  if (isGuestUiTranslationLang(base)) return base;
  if (LIVE_CHAT_LANGUAGE_NAMES[base]) return base;
  return fallback;
}

export function isTranslationCached(
  msg: { translatedContent?: string | null; translatedForLang?: string | null },
  targetLang: string,
): boolean {
  const target = langBase(targetLang);
  const cached = langBase(msg.translatedForLang);
  return !!msg.translatedContent?.trim() && cached === target;
}

type SenderRole = "guest" | "staff" | "system";

/** Guest may only see staff messages once translation for their UI locale exists. */
export function isStaffMessageReadyForGuest(
  msg: {
    senderRole: SenderRole;
    translatedContent?: string | null;
    translatedForLang?: string | null;
  },
  guestUiLocale: string,
): boolean {
  if (msg.senderRole !== "staff") return true;
  const target = resolveTranslationTargetLang(guestUiLocale);
  return isTranslationCached(msg, target);
}

export function hasPendingStaffTranslation(
  messages: Array<{
    senderRole: SenderRole;
    translatedContent?: string | null;
    translatedForLang?: string | null;
  }>,
  guestUiLocale: string,
): boolean {
  return messages.some(
    (m) => m.senderRole === "staff" && !isStaffMessageReadyForGuest(m, guestUiLocale),
  );
}

/** Reception may only see guest text messages once translated for staff UI locale. */
export function isGuestMessageReadyForStaff(
  msg: {
    senderRole: SenderRole;
    messageType?: string | null;
    translatedContent?: string | null;
    translatedForLang?: string | null;
  },
  staffUiLocale: string,
): boolean {
  if (msg.senderRole !== "guest") return true;
  if (msg.messageType === "location") return true;
  const target = resolveStaffTargetLang(staffUiLocale);
  return isTranslationCached(msg, target);
}

export function hasPendingGuestTranslation(
  messages: Array<{
    senderRole: SenderRole;
    messageType?: string | null;
    translatedContent?: string | null;
    translatedForLang?: string | null;
  }>,
  staffUiLocale: string,
): boolean {
  return messages.some(
    (m) => m.senderRole === "guest" && !isGuestMessageReadyForStaff(m, staffUiLocale),
  );
}

export function buildLiveChatAutoDetectTranslationPrompt(
  text: string,
  toLang: string,
): string {
  const target = resolveLanguageName(toLang);

  return `You are a native ${target} linguist and senior translator for a five-star hotel live-chat desk (CEFR C2 / native professional standard).

Detect the source language of the message below automatically, then translate it into ${target}.

Quality requirements:
- C2 / native-level fluency — polished, natural, and idiomatic in ${target}
- Luxury hospitality register: courteous, warm, precise, never robotic or literal
- Preserve intent, urgency, politeness level, and emotional tone exactly
- Keep proper nouns, room numbers, times, dates, and numbers unchanged
- Use culturally natural phrasing for ${target} speakers (not word-for-word)
- If the message is already entirely in ${target}, return it unchanged
- No added explanations, greetings, or commentary

Return ONLY the translation — no quotes, labels, or markdown.

Message:
${text}`;
}

export function buildLiveChatTranslationPrompt(
  text: string,
  fromLang: string,
  toLang: string,
): string {
  const source = resolveLanguageName(fromLang);
  const target = resolveLanguageName(toLang);

  return `You are a native ${target} linguist and senior translator for a five-star hotel live-chat desk (CEFR C2 / native professional standard).

Translate the message below from ${source} into ${target}.

Quality requirements:
- C2 / native-level fluency — polished, natural, and idiomatic in ${target}
- Luxury hospitality register: courteous, warm, precise, never robotic or literal
- Preserve intent, urgency, politeness level, and emotional tone exactly
- Keep proper nouns, room numbers, times, dates, and numbers unchanged
- Use culturally natural phrasing for ${target} speakers (not word-for-word)
- No added explanations, greetings, or commentary

Return ONLY the translation — no quotes, labels, or markdown.

Message:
${text}`;
}

export function buildLiveChatStaffInsightPrompt(
  guestText: string,
  guestLang: string,
  staffLang: string,
  translatedContent: string,
): string {
  const guest =
    guestLang === "auto"
      ? "the guest's language (auto-detected from the message)"
      : resolveLanguageName(guestLang);
  const staff = resolveLanguageName(staffLang);

  return `You assist hotel reception staff during live guest chat (C2 professional standard).

Guest message (${guest}):
${guestText}

Professional translation (${staff}):
${translatedContent}

Write ONE concise sentence in ${staff} summarizing what the guest needs or wants.
Use native ${staff} phrasing suitable for internal staff notes (max 120 characters).
Return ONLY that sentence — no quotes or labels.`;
}
