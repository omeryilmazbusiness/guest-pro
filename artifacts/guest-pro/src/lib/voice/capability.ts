/**
 * capability.ts
 * Feature detection for browser voice APIs.
 *
 * Honest detection — we cannot guarantee Safari PWA behavior,
 * so we detect what we can and degrade gracefully on first failure.
 */

export interface VoiceCapabilityModel {
  /** Web Speech API (STT) is present in this browser */
  sttSupported: boolean;
  /** Web Speech Synthesis API (TTS) is present */
  ttsSupported: boolean;
  /** Both STT and TTS are available (can do full conversation loop) */
  canConverse: boolean;
  /** Running as installed PWA / home-screen app — STT may be unreliable on some iOS versions */
  isPwa: boolean;
}

export function detectVoiceCapability(): VoiceCapabilityModel {
  if (typeof window === "undefined") {
    return { sttSupported: false, ttsSupported: false, canConverse: false, isPwa: false };
  }

  const sttSupported =
    "SpeechRecognition" in window || "webkitSpeechRecognition" in window;

  const ttsSupported = "speechSynthesis" in window;

  // Detect standalone (PWA / home-screen) mode
  // iOS Safari in standalone mode has had historical issues with webkitSpeechRecognition
  const isPwa =
    ("standalone" in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true) ||
    window.matchMedia("(display-mode: standalone)").matches;

  return {
    sttSupported,
    ttsSupported,
    canConverse: sttSupported && ttsSupported,
    isPwa,
  };
}
