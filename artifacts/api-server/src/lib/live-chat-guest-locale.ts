/**
 * Guest UI locales for live-chat translation.
 * Keep aligned with artifacts/guest-pro/src/lib/i18n/locales/index.ts (SupportedLocale).
 */
import { resolveGuestLanguage } from "./live-chat-welcome";

/** All guest-screen UI locale codes that staff messages may be translated into. */
export const GUEST_UI_TRANSLATION_LANGS = [
  "en",
  "tr",
  "ar",
  "ru",
  "de",
  "fr",
  "es",
  "it",
  "ur",
  "fa",
  "he",
  "ku",
] as const;

export type GuestUiTranslationLang = (typeof GUEST_UI_TRANSLATION_LANGS)[number];

function langBase(code?: string | null): string {
  return code?.trim().toLowerCase().split("-")[0] ?? "";
}

export function isGuestUiTranslationLang(code: string): code is GuestUiTranslationLang {
  return (GUEST_UI_TRANSLATION_LANGS as readonly string[]).includes(code);
}

/** Normalize any guest locale hint (UI code, voice BCP-47, profile) to a translation target. */
export function normalizeGuestUiLocaleHint(locale?: string | null): string | null {
  if (!locale?.trim()) return null;
  const base = langBase(locale);
  if (isGuestUiTranslationLang(base)) return base;
  return null;
}

/**
 * Resolve the guest's active UI language for staff→guest translation.
 * Priority: live session locale (from guest sync) → hint → guest profile.
 */
export function resolveGuestUiLocaleForSession(
  session: { lastGuestUiLocale?: string | null },
  hintLocale?: string | null,
  guestProfileLang?: string | null,
): string {
  const fromSession = normalizeGuestUiLocaleHint(session.lastGuestUiLocale);
  if (fromSession) return fromSession;

  const fromHint = normalizeGuestUiLocaleHint(hintLocale);
  if (fromHint) return fromHint;

  const fromProfile = normalizeGuestUiLocaleHint(guestProfileLang);
  if (fromProfile) return fromProfile;

  return resolveGuestLanguage(guestProfileLang);
}
