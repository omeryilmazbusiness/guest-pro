/**
 * use-voice.ts
 * Single-turn voice input hook — home page hero mic.
 *
 * For the continuous conversation loop in chat, use use-voice-conversation.ts.
 *
 * Uses optsRef pattern: all callbacks (onResult, onError, etc.) are kept in a
 * ref so startListening never captures a stale closure, even though home.tsx
 * passes inline functions that change every render.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { isSttSupported, createSpeechSession } from "@/lib/voice/speech-recognition";
import { synthesize } from "@/lib/voice/speech-synthesis";
import { detectLanguageFromText } from "@/lib/voice/language-resolver";
import { VoiceDiagnosticsLogger } from "@/lib/voice/diagnostics";

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

/** @deprecated Use synthesize() from lib/voice/speech-synthesis directly */
export function speakText(text: string, lang: string): void {
  synthesize(text, lang);
}

export function useVoice(opts: VoiceHookOptions): VoiceHookReturn {
  const isSupported = isSttSupported();

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [amplitude, setAmplitude] = useState(0);

  // Keep all callback options in a ref to avoid stale closures.
  // Callers (home.tsx) pass inline functions that recreate every render —
  // without this pattern, startListening would silently call the wrong version.
  const optsRef = useRef(opts);
  optsRef.current = opts;

  const sessionRef = useRef<ReturnType<typeof createSpeechSession>>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const activeRef = useRef(false); // guards re-entrant calls

  // ── Cleanup helper (no deps — uses only refs) ──────────────────────────────
  const cleanupMedia = useCallback(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  // ── stopListening — also has no volatile deps (uses refs) ──────────────────
  const stopListening = useCallback(() => {
    if (!activeRef.current) return;
    activeRef.current = false;

    sessionRef.current?.abort();
    sessionRef.current = null;

    cleanupMedia();

    setIsListening(false);
    setAmplitude(0);
    setTranscript("");

    optsRef.current.onEnd?.();
    VoiceDiagnosticsLogger.log("stt:stopped");
  }, [cleanupMedia]);

  // ── startListening ─────────────────────────────────────────────────────────
  const startListening = useCallback(async () => {
    if (!isSupported) {
      optsRef.current.onError?.(
        optsRef.current.messages?.notSupported ??
          "Speech recognition is not supported in this browser."
      );
      return;
    }
    if (activeRef.current) return; // already running
    activeRef.current = true;

    VoiceDiagnosticsLogger.log("stt:start-requested");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioCtx = new AudioContext();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setAmplitude(avg / 128);
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();

      setIsListening(true);
      optsRef.current.onStart?.();
      VoiceDiagnosticsLogger.log("stt:listening");

      const session = createSpeechSession({
        lang: optsRef.current.defaultLang ?? "",
        onInterimResult: (text) => {
          VoiceDiagnosticsLogger.log("stt:interim", text.slice(0, 40));
          setTranscript(text);
        },
        onFinalResult: (text) => {
          VoiceDiagnosticsLogger.log("stt:final", text.slice(0, 80));
          const lang = detectLanguageFromText(
            text,
            optsRef.current.defaultLang ?? "en-US"
          );
          // Stop listening before calling onResult so UI updates cleanly
          stopListening();
          // Always call onResult via ref — never a stale closure
          optsRef.current.onResult(text, lang);
        },
        onError: (code) => {
          VoiceDiagnosticsLogger.log("stt:error", code);
          const msgs = optsRef.current.messages ?? {};
          if (code === "not-allowed") {
            optsRef.current.onError?.(msgs.micDenied ?? "Microphone access denied.");
          } else if (code === "no-speech") {
            optsRef.current.onError?.(msgs.noSpeech ?? "No speech detected. Please try again.");
          } else {
            optsRef.current.onError?.(
              msgs.genericError?.(code) ?? `Voice error: ${code}`
            );
          }
          stopListening();
        },
        // onEnd fires when the session ends with no speech at all
        // (if there was speech — even interim — speech-recognition.ts promotes
        //  it to onFinalResult, so onEnd here means genuine silence)
        onEnd: () => {
          VoiceDiagnosticsLogger.log("stt:end-no-speech");
          stopListening();
        },
      });

      if (!session) {
        optsRef.current.onError?.(
          optsRef.current.messages?.notSupported ?? "Speech recognition unavailable."
        );
        stopListening();
        return;
      }

      sessionRef.current = session;
      session.start();
    } catch (err) {
      VoiceDiagnosticsLogger.log("stt:mic-error", (err as Error).name);
      const msgs = optsRef.current.messages ?? {};
      if ((err as Error).name === "NotAllowedError") {
        optsRef.current.onError?.(msgs.micDenied ?? "Microphone access denied.");
      } else {
        optsRef.current.onError?.(msgs.micNotAvailable ?? "Microphone unavailable.");
      }
      stopListening();
    }
  }, [isSupported, stopListening]);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      activeRef.current = false;
      sessionRef.current?.abort();
      cleanupMedia();
    };
  }, [cleanupMedia]);

  return {
    isListening,
    isSupported,
    transcript,
    amplitude,
    startListening,
    stopListening,
  };
}
