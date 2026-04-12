/**
 * speech-synthesis.ts
 * Production-grade TTS adapter for the Web Speech Synthesis API.
 *
 * ─── Why this is non-trivial ────────────────────────────────────────────────
 *
 * 1. iOS/Safari user-gesture requirement
 *    speechSynthesis.speak() is silently blocked unless the FIRST call happens
 *    synchronously inside a user gesture handler (tap, click). If the first call
 *    is deferred (e.g. after an AI response arrives), iOS rejects it with zero
 *    error feedback. The fix: call primeTts() from the mic-button tap handler to
 *    "unlock" TTS for the rest of the session.
 *
 * 2. Per-utterance cancel flag (replaces module-level suppressCallbacks)
 *    A module-level suppress flag races: cancelSpeech() sets it true, then the
 *    next synthesize() immediately resets it false — if the cancelled utterance's
 *    onerror fires after that reset, it incorrectly calls the NEW call's onError.
 *    Fix: each synthesize() gets its own `cancelled` closure variable.
 *
 * 3. voiceschanged listener leak
 *    If voices aren't loaded and synthesize() is called twice before voiceschanged
 *    fires, two doSpeak callbacks are registered. Both fire — two utterances queue.
 *    Fix: track and remove the pending listener before registering a new one.
 *
 * 4. Chrome stuck-queue bug
 *    Chrome can enter a state where speechSynthesis.speaking = true but nothing
 *    plays. cancel() before speak() prevents queue accumulation.
 *
 * 5. Voice pre-warming
 *    getVoices() returns [] on first call (Chrome loads async). We kick off
 *    loading at module import time so voices are ready when speech first fires.
 */

import { pickBestVoice, stripMarkdown } from "./language-resolver";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SynthesisOptions {
  /** Called when the utterance finishes naturally */
  onEnd?: () => void;
  /** Called on a genuine synthesis error (not on intentional cancel) */
  onError?: () => void;
  /** Speech rate — 0.92 gives a calm, clear delivery */
  rate?: number;
  /** Pitch — 1.0 is neutral */
  pitch?: number;
}

// ─── Module-level state ───────────────────────────────────────────────────────

/** Cancel function for the currently active utterance */
let activeCancelFn: (() => void) | null = null;

/** Currently pending voiceschanged listener reference (for removal) */
let pendingVoicesListener: (() => void) | null = null;

// Kick off Chrome's async voice loading at module import time so voices are
// available sooner when the first AI response arrives.
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  window.speechSynthesis.getVoices(); // triggers background load
  window.speechSynthesis.addEventListener("voiceschanged", () => {
    window.speechSynthesis.getVoices(); // refresh cache
  });
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Unlock TTS for iOS/Safari.
 *
 * MUST be called synchronously inside a user gesture handler (mic button tap,
 * "Start conversation" tap, etc.). Speaks a near-instantaneous silent utterance
 * to satisfy iOS Safari's requirement that the first speak() call is inside a
 * user interaction. All subsequent speak() calls in the session work without a gesture.
 *
 * Safe to call multiple times — each call cancels the previous prime.
 */
export function primeTts(): void {
  if (!("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance("\u200B"); // zero-width space
    u.volume = 0;
    u.rate = 10;
    u.pitch = 1;
    window.speechSynthesis.speak(u);
  } catch {
    // Best-effort — do not break the tap handler
  }
}

/**
 * Speak text aloud using browser TTS.
 * Cancels any currently playing utterance first (without triggering its onEnd).
 * Fires onEnd when speech completes naturally.
 * Fires onError on genuine synthesis failures (not on intentional cancels).
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

  // Cancel the previous utterance cleanly (sets its cancelled flag, removes listeners)
  cancelSpeech();

  // Per-utterance cancel flag — never shared across calls
  let cancelled = false;

  // Register cancel function so cancelSpeech() can stop this specific utterance
  activeCancelFn = () => {
    cancelled = true;
    // Also remove any pending voiceschanged listener for this utterance
    if (pendingVoicesListener) {
      window.speechSynthesis.removeEventListener("voiceschanged", pendingVoicesListener);
      pendingVoicesListener = null;
    }
    window.speechSynthesis.cancel();
  };

  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.lang = lang;
  utterance.rate = options.rate ?? 0.92;
  utterance.pitch = options.pitch ?? 1.0;
  utterance.volume = 1.0;

  utterance.onend = () => {
    if (cancelled) return; // Intentionally cancelled — do not call onEnd
    activeCancelFn = null;
    options.onEnd?.();
  };

  utterance.onerror = (e) => {
    if (cancelled) return; // Cancelled utterance — expected error, suppress
    activeCancelFn = null;
    // "interrupted" and "canceled" can fire when the browser stops a previous
    // utterance for a new one. If our cancelled flag is false here, it means
    // the browser cancelled us externally (e.g. user navigated away).
    if (e.error !== "interrupted" && e.error !== "canceled") {
      options.onError?.();
    }
  };

  const doSpeak = () => {
    if (cancelled) return; // Cancelled while waiting for voices
    pendingVoicesListener = null;
    const voice = pickBestVoice(lang);
    if (voice) {
      utterance.voice = voice;
      if (import.meta.env.DEV) {
        console.debug(`[VoiceDiag] tts:voice="${voice.name}" lang=${lang} local=${voice.localService}`);
      }
    } else if (import.meta.env.DEV) {
      console.debug(`[VoiceDiag] tts:voice-fallback lang=${lang} (no match — browser picks)`);
    }
    window.speechSynthesis.speak(utterance);
    if (import.meta.env.DEV) {
      console.debug(`[VoiceDiag] tts:speak-called text="${clean.slice(0, 40)}"`);
    }
  };

  // Remove any pending voiceschanged listener from a previous synthesize() call.
  // Without this, if synthesize() is called twice before voices load, both
  // doSpeak callbacks fire on voiceschanged → two utterances queue.
  if (pendingVoicesListener) {
    window.speechSynthesis.removeEventListener("voiceschanged", pendingVoicesListener);
    pendingVoicesListener = null;
  }

  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    doSpeak();
  } else {
    // Chrome: voices load asynchronously on first access
    pendingVoicesListener = doSpeak;
    window.speechSynthesis.addEventListener("voiceschanged", doSpeak, { once: true });
  }
}

/**
 * Cancel any in-progress speech without triggering onEnd/onError callbacks.
 * Use when stopping the conversation or the user interrupts the AI.
 */
export function cancelSpeech(): void {
  if (!("speechSynthesis" in window)) return;
  // Remove any pending voiceschanged listener first
  if (pendingVoicesListener) {
    window.speechSynthesis.removeEventListener("voiceschanged", pendingVoicesListener);
    pendingVoicesListener = null;
  }
  // Call the active utterance's cancel fn (sets its cancelled flag, then cancels)
  if (activeCancelFn) {
    activeCancelFn();
    activeCancelFn = null;
  } else {
    // No active utterance tracked, but still cancel in case something is playing
    window.speechSynthesis.cancel();
  }
}

export function isTtsSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}
