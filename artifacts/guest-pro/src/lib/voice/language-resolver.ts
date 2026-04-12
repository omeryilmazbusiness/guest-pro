/**
 * language-resolver.ts
 * Language detection from spoken text, and best-voice selection for TTS.
 * Extracted from use-voice.ts so it can be used by both STT and TTS layers.
 */

/**
 * Infer a BCP 47 language code from the Unicode character ranges present in the
 * transcribed text. Falls back to `defaultLang` (usually the guest's registered locale)
 * for Latin-script text that could be any of many languages.
 */
export function detectLanguageFromText(text: string, defaultLang = "en-US"): string {
  if (/[\u0600-\u06FF]/.test(text)) return "ar-SA";
  if (/[\u0400-\u04FF]/.test(text)) return "ru-RU";
  if (/[ğşçıöüĞŞÇİÖÜ]/.test(text)) return "tr-TR";
  if (/[\u4E00-\u9FFF]/.test(text)) return "zh-CN";
  if (/[\u3040-\u30FF\u31F0-\u31FF]/.test(text)) return "ja-JP";
  if (/[\uAC00-\uD7AF]/.test(text)) return "ko-KR";
  return defaultLang;
}

/**
 * Pick the best available TTS voice for a given BCP 47 language code.
 * Strategy: exact match → prefix match → any available voice (browser chooses).
 *
 * Prefers non-remote (local) voices where available to reduce latency.
 */
export function pickBestVoice(lang: string): SpeechSynthesisVoice | undefined {
  if (!("speechSynthesis" in window)) return undefined;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return undefined;

  const langPrefix = lang.split("-")[0];

  // 1. Exact match, prefer local
  const exactLocal = voices.find((v) => v.lang === lang && !v.localService === false);
  if (exactLocal) return exactLocal;

  // 2. Exact match (any)
  const exact = voices.find((v) => v.lang === lang);
  if (exact) return exact;

  // 3. Prefix match, prefer local
  const prefixLocal = voices.find((v) => v.lang.startsWith(langPrefix) && !v.localService === false);
  if (prefixLocal) return prefixLocal;

  // 4. Prefix match (any)
  const prefix = voices.find((v) => v.lang.startsWith(langPrefix));
  if (prefix) return prefix;

  return undefined;
}

/**
 * Strip markdown syntax so TTS doesn't read **, ##, `` etc. aloud.
 */
export function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*(.+?)\*\*/gs, "$1")
    .replace(/\*(.+?)\*/gs, "$1")
    .replace(/__(.+?)__/gs, "$1")
    .replace(/_(.+?)_/gs, "$1")
    .replace(/`{1,3}[^`]*`{1,3}/gs, "")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/^>{1,}\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
