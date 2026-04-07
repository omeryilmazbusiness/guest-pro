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
 * Speak text aloud using the Web Speech Synthesis API,
 * selecting a voice that matches the language code.
 */
export function speakText(text: string, lang: string): void {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.95;
  utterance.pitch = 1;
  const voices = window.speechSynthesis.getVoices();
  const match = voices.find((v) => v.lang.startsWith(lang.split("-")[0]));
  if (match) utterance.voice = match;
  window.speechSynthesis.speak(utterance);
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

  const stopListening = useCallback(() => {
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
      onError?.("Voice recognition is not supported in this browser. Please type your message instead.");
      return;
    }

    try {
      // Request microphone access for amplitude visualization
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
        setAmplitude(avg / 128); // normalised 0→1+
        animFrameRef.current = requestAnimationFrame(trackAmplitude);
      };
      trackAmplitude();

      // Set up speech recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      // Empty lang = browser's configured language (avoids hard-coding one locale)
      recognition.lang = "";

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
          onResult(text, detectedLang);
          stopListening();
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error === "not-allowed") {
          onError?.("Microphone permission was denied. Please allow microphone access and try again.");
        } else if (event.error === "no-speech") {
          onError?.("No speech detected. Please try again.");
        } else {
          onError?.(`Voice error: ${event.error}`);
        }
        stopListening();
      };

      recognition.onend = () => {
        if (isListening) stopListening();
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      if ((err as Error).name === "NotAllowedError") {
        onError?.("Microphone permission was denied. Please allow access in your browser settings.");
      } else {
        onError?.("Could not access microphone. Please check your device settings.");
      }
      stopListening();
    }
  }, [isSupported, isListening, onResult, onError, onStart, stopListening]);

  return {
    isListening,
    isSupported,
    transcript,
    amplitude,
    startListening,
    stopListening,
  };
}
