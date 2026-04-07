import { useState, useRef, useCallback } from "react";

export interface VoiceMessages {
  notSupported?: string;
  micDenied?: string;
  noSpeech?: string;
  genericError?: (code: string) => string;
  micNotAvailable?: string;
}

export interface VoiceHookOptions {
  onResult: (transcript: string, detectedLanguage: string) => void;
  onError?: (message: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
  /** BCP 47 hint for the speech recognizer (e.g. "tr-TR"). Falls back to browser default. */
  defaultLang?: string;
  /** Localised error messages. Falls back to English strings. */
  messages?: VoiceMessages;
}

export interface VoiceHookReturn {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  amplitude: number;
  startListening: () => Promise<void>;
  stopListening: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

/**
 * Detect language from transcribed text using Unicode character ranges.
 * Falls back to the provided defaultLang or "en-US" for Latin scripts.
 */
function detectLanguageFromText(text: string, defaultLang = "en-US"): string {
  if (/[\u0600-\u06FF]/.test(text)) return "ar-SA";
  if (/[\u0400-\u04FF]/.test(text)) return "ru-RU";
  if (/[ğşçıöüĞŞÇİÖÜ]/.test(text)) return "tr-TR";
  if (/[\u4E00-\u9FFF]/.test(text)) return "zh-CN";
  if (/[\u3040-\u30FF\u31F0-\u31FF]/.test(text)) return "ja-JP";
  if (/[\uAC00-\uD7AF]/.test(text)) return "ko-KR";
  return defaultLang;
}

/**
 * Strip markdown syntax so TTS doesn't read **, ##, ` etc. aloud.
 */
function stripMarkdown(text: string): string {
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

/**
 * Find the best available voice for a given BCP 47 language code.
 * Prefers exact match → prefix match → undefined (browser picks default).
 */
function pickVoice(lang: string): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  const langPrefix = lang.split("-")[0];
  return (
    voices.find((v) => v.lang === lang) ??
    voices.find((v) => v.lang.startsWith(langPrefix)) ??
    undefined
  );
}

/**
 * Speak text aloud using the Web Speech Synthesis API.
 * Waits for voices to load if not yet available (Chrome race condition).
 * Strips markdown formatting before speaking.
 */
export function speakText(text: string, lang: string): void {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();

  const clean = stripMarkdown(text);
  if (!clean.trim()) return;

  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.lang = lang;
  utterance.rate = 0.92;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  const doSpeak = () => {
    const voice = pickVoice(lang);
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  };

  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    doSpeak();
  } else {
    // Chrome: voices load asynchronously; wait for the event then speak
    window.speechSynthesis.addEventListener("voiceschanged", doSpeak, {
      once: true,
    });
  }
}

export function useVoice({
  onResult,
  onError,
  onStart,
  onEnd,
  defaultLang,
  messages = {},
}: VoiceHookOptions): VoiceHookReturn {
  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [amplitude, setAmplitude] = useState(0);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // Prevent double-firing stopListening from both onresult and onend
  const stoppedRef = useRef(false);

  const stopListening = useCallback(() => {
    if (stoppedRef.current) return;
    stoppedRef.current = true;

    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsListening(false);
    setAmplitude(0);
    setTranscript("");
    onEnd?.();
  }, [onEnd]);

  const startListening = useCallback(async () => {
    if (!isSupported) {
      onError?.(messages.notSupported ?? "Speech recognition is not supported in this browser. Please type your message.");
      return;
    }

    stoppedRef.current = false;

    try {
      // Request mic for amplitude visualization
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioCtx = new AudioContext();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const trackAmplitude = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setAmplitude(avg / 128);
        animFrameRef.current = requestAnimationFrame(trackAmplitude);
      };
      trackAmplitude();

      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      // Use the guest's expected language as a hint for better accuracy
      recognition.lang = defaultLang ?? "";

      recognition.onstart = () => {
        setIsListening(true);
        onStart?.();
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const result = event.results[event.resultIndex];
        const text = result[0].transcript;
        setTranscript(text);

        if (result.isFinal) {
          // Detect language from content; fall back to the guest's default
          const detectedLang = detectLanguageFromText(text, defaultLang ?? "en-US");
          stopListening();
          onResult(text, detectedLang);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error === "not-allowed") {
          onError?.(messages.micDenied ?? "Microphone access denied. Please allow access in your browser settings.");
        } else if (event.error === "no-speech") {
          onError?.(messages.noSpeech ?? "No speech detected. Please try again.");
        } else {
          onError?.(messages.genericError?.(event.error) ?? `Voice error: ${event.error}`);
        }
        stopListening();
      };

      recognition.onend = () => {
        stopListening();
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      if ((err as Error).name === "NotAllowedError") {
        onError?.(messages.micDenied ?? "Microphone access denied. Please allow access in your browser settings.");
      } else {
        onError?.(messages.micNotAvailable ?? "Cannot access microphone. Please check your device settings.");
      }
      stopListening();
    }
  }, [isSupported, onResult, onError, onStart, stopListening, defaultLang, messages]);

  return {
    isListening,
    isSupported,
    transcript,
    amplitude,
    startListening,
    stopListening,
  };
}
