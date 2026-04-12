/**
 * use-voice.ts
 * Single-turn voice input hook — used for the home page hero mic.
 * For the full conversation loop, use use-voice-conversation.ts.
 *
 * Refactored to delegate to the shared voice infrastructure in lib/voice/.
 */

import { useState, useRef, useCallback } from "react";
import { isSttSupported, createSpeechSession } from "@/lib/voice/speech-recognition";
import { synthesize, cancelSpeech } from "@/lib/voice/speech-synthesis";
import { detectLanguageFromText } from "@/lib/voice/language-resolver";

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
  defaultLang?: string;
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

/** @deprecated Use speakText from lib/voice/speech-synthesis instead */
export function speakText(text: string, lang: string): void {
  synthesize(text, lang);
}

export function useVoice({
  onResult,
  onError,
  onStart,
  onEnd,
  defaultLang,
  messages = {},
}: VoiceHookOptions): VoiceHookReturn {
  const isSupported = isSttSupported();

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [amplitude, setAmplitude] = useState(0);

  const sessionRef = useRef<ReturnType<typeof createSpeechSession>>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const stoppedRef = useRef(false);

  const stopListening = useCallback(() => {
    if (stoppedRef.current) return;
    stoppedRef.current = true;

    sessionRef.current?.abort();
    sessionRef.current = null;

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

      setIsListening(true);
      onStart?.();

      const session = createSpeechSession({
        lang: defaultLang ?? "",
        onInterimResult: (text) => setTranscript(text),
        onFinalResult: (text) => {
          const detectedLang = detectLanguageFromText(text, defaultLang ?? "en-US");
          stopListening();
          onResult(text, detectedLang);
        },
        onError: (code) => {
          if (code === "not-allowed") {
            onError?.(messages.micDenied ?? "Microphone access denied.");
          } else if (code === "no-speech") {
            onError?.(messages.noSpeech ?? "No speech detected. Please try again.");
          } else {
            onError?.(messages.genericError?.(code) ?? `Voice error: ${code}`);
          }
          stopListening();
        },
        onEnd: () => stopListening(),
      });

      if (!session) {
        onError?.(messages.notSupported ?? "Speech recognition is not supported.");
        stopListening();
        return;
      }

      sessionRef.current = session;
      session.start();
    } catch (err) {
      if ((err as Error).name === "NotAllowedError") {
        onError?.(messages.micDenied ?? "Microphone access denied.");
      } else {
        onError?.(messages.micNotAvailable ?? "Cannot access microphone.");
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
