/**
 * speech-synthesis.ts
 * TTS adapter wrapping the Web Speech Synthesis API.
 *
 * Key improvements over ad-hoc usage:
 * - onEnd / onError callbacks for conversation loop wiring
 * - Voice loading race condition handled (Chrome loads voices async)
 * - Markdown stripped before speaking
 * - Stable rate/pitch settings
 * - Clean cancel with callback suppression
 */

import { pickBestVoice, stripMarkdown } from "./language-resolver";

export interface SynthesisOptions {
  /** Called when the utterance finishes naturally */
  onEnd?: () => void;
  /** Called on synthesis error (voice missing, interrupted externally, etc.) */
  onError?: () => void;
  /** Speech rate — 0.92 gives a calm, clear delivery */
  rate?: number;
  /** Pitch — 1.0 is neutral */
  pitch?: number;
}

let suppressCallbacks = false;

/**
 * Speak text aloud using browser TTS.
 * Cancels any currently playing utterance first.
 * Fires onEnd when speech completes naturally.
 */
export function synthesize(text: string, lang: string, options: SynthesisOptions = {}): void {
  if (!("speechSynthesis" in window)) {
    options.onEnd?.();
    return;
  }

  const clean = stripMarkdown(text);
  if (!clean.trim()) {
    options.onEnd?.();
    return;
  }

  suppressCallbacks = false;
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.lang = lang;
  utterance.rate = options.rate ?? 0.92;
  utterance.pitch = options.pitch ?? 1.0;
  utterance.volume = 1.0;

  utterance.onend = () => {
    if (!suppressCallbacks) {
      options.onEnd?.();
    }
  };

  utterance.onerror = (e) => {
    // "interrupted" is normal when we cancel — don't treat as error
    if (!suppressCallbacks && e.error !== "interrupted" && e.error !== "canceled") {
      options.onError?.();
    } else if (!suppressCallbacks && (e.error === "interrupted" || e.error === "canceled")) {
      // Treated as a clean end for loop purposes
    }
  };

  const doSpeak = () => {
    const voice = pickBestVoice(lang);
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  };

  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    doSpeak();
  } else {
    // Chrome: voices load asynchronously
    window.speechSynthesis.addEventListener("voiceschanged", doSpeak, { once: true });
  }
}

/**
 * Cancel any in-progress speech without triggering onEnd/onError callbacks.
 * Use this when the conversation is being stopped or interrupted by the user.
 */
export function cancelSpeech(): void {
  if (!("speechSynthesis" in window)) return;
  suppressCallbacks = true;
  window.speechSynthesis.cancel();
}

export function isTtsSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}
