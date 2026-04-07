import { useState, useRef, useCallback } from "react";

export interface VoiceHookOptions {
  onResult: (transcript: string, detectedLanguage: string) => void;
  onError?: (message: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
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
 * Falls back to "en-US" for Latin scripts.
 */
function detectLanguageFromText(text: string): string {
  if (/[\u0600-\u06FF]/.test(text)) return "ar-SA";
  if (/[\u0400-\u04FF]/.test(text)) return "ru-RU";
  if (/[ğşçıöüĞŞÇİÖÜ]/.test(text)) return "tr-TR";
  return "en-US";
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
 * Find the best available voice for a given language code.
 * Called after voices are guaranteed to be loaded.
 */
function pickVoice(lang: string): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  const langPrefix = lang.split("-")[0];
  // Prefer exact match, then prefix match, then any match
  return (
    voices.find((v) => v.lang === lang) ??
    voices.find((v) => v.lang.startsWith(langPrefix)) ??
    undefined
  );
}

/**
 * Speak text aloud using the Web Speech Synthesis API.
 * Waits for voices to load if not yet available (Chrome race condition).
 * Strips markdown before speaking.
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
      onError?.("Ses tanıma bu tarayıcıda desteklenmiyor. Lütfen mesajınızı yazın.");
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
      recognition.lang = ""; // Browser's configured language

      recognition.onstart = () => {
        setIsListening(true);
        onStart?.();
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const result = event.results[event.resultIndex];
        const text = result[0].transcript;
        setTranscript(text);

        if (result.isFinal) {
          const detectedLang = detectLanguageFromText(text);
          stopListening();
          onResult(text, detectedLang);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error === "not-allowed") {
          onError?.(
            "Mikrofon erişimi reddedildi. Tarayıcı ayarlarından izin verin."
          );
        } else if (event.error === "no-speech") {
          onError?.("Ses algılanamadı. Lütfen tekrar deneyin.");
        } else {
          onError?.(`Ses hatası: ${event.error}`);
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
        onError?.(
          "Mikrofon izni verilmedi. Tarayıcı ayarlarınızı kontrol edin."
        );
      } else {
        onError?.(
          "Mikrofona erişilemiyor. Cihaz ayarlarınızı kontrol edin."
        );
      }
      stopListening();
    }
  }, [isSupported, onResult, onError, onStart, stopListening]);

  return {
    isListening,
    isSupported,
    transcript,
    amplitude,
    startListening,
    stopListening,
  };
}
