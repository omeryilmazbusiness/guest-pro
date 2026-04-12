/**
 * use-voice.ts
 * Single-turn voice input hook — home page hero mic.
 *
 * For the full conversation loop in chat, use use-voice-conversation.ts.
 *
 * Uses the same dual-path end-of-utterance strategy as use-voice-conversation:
 *   PATH A — browser final result fires → commit immediately
 *   PATH B — silence timer (1.5 s after last interim) → commit buffered transcript
 *   PATH C — session onEnd with buffered interim → commit
 *
 * Uses optsRef pattern: all callbacks stored in a ref so startListening never
 * captures a stale closure, even though home.tsx passes inline functions.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { isSttSupported, createSpeechSession } from "@/lib/voice/speech-recognition";
import { synthesize, primeTts } from "@/lib/voice/speech-synthesis";
import { detectLanguageFromText } from "@/lib/voice/language-resolver";
import { VoiceDiagnosticsLogger } from "@/lib/voice/diagnostics";

// ─── Constants ──────────────────────────────────────────────────────────────

/**
 * How long of speech-free silence (ms) before we commit the buffered interim
 * transcript as the final result. Must be long enough to not cut mid-sentence,
 * short enough to feel snappy. 1500 ms is the right balance.
 */
const SILENCE_THRESHOLD_MS = 1500;

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useVoice(opts: VoiceHookOptions): VoiceHookReturn {
  const isSupported = isSttSupported();

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [amplitude, setAmplitude] = useState(0);

  // Always-fresh callbacks — no stale closures
  const optsRef = useRef(opts);
  optsRef.current = opts;

  const sessionRef = useRef<ReturnType<typeof createSpeechSession>>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const activeRef = useRef(false);

  // Silence timer and per-turn transcript buffer
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const interimBufferRef = useRef("");
  const committedRef = useRef(false);

  // ── Media cleanup (no deps — only uses refs) ─────────────────────────────
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

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current !== null) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  // ── stopListening ─────────────────────────────────────────────────────────
  const stopListening = useCallback(() => {
    if (!activeRef.current) return;
    activeRef.current = false;

    clearSilenceTimer();
    sessionRef.current?.abort();
    sessionRef.current = null;
    cleanupMedia();

    setIsListening(false);
    setAmplitude(0);
    setTranscript("");
    interimBufferRef.current = "";
    committedRef.current = false;

    optsRef.current.onEnd?.();
    VoiceDiagnosticsLogger.log("stt:stopped");
  }, [cleanupMedia, clearSilenceTimer]);

  // ── startListening ────────────────────────────────────────────────────────
  const startListening = useCallback(async () => {
    if (!isSupported) {
      optsRef.current.onError?.(
        optsRef.current.messages?.notSupported ??
          "Speech recognition is not supported in this browser."
      );
      return;
    }
    if (activeRef.current) return;
    activeRef.current = true;
    committedRef.current = false;
    interimBufferRef.current = "";

    VoiceDiagnosticsLogger.log("stt:start-requested");

    // iOS/Safari TTS unlock: must be synchronous, still in the user-gesture call
    // stack (this function is async but no await has fired yet). Priming here
    // ensures that when the user's speech navigates to chat with ?voice=1, TTS
    // is already unlocked for that session.
    primeTts();

    // ── commitOnce — exactly one commit per listening session ───────────────
    const commitOnce = (text: string) => {
      if (committedRef.current) return;
      committedRef.current = true;

      clearSilenceTimer();
      stopListening();

      const trimmed = text.trim();
      if (!trimmed) {
        VoiceDiagnosticsLogger.log("stt:commit-empty");
        return;
      }

      const lang = detectLanguageFromText(trimmed, optsRef.current.defaultLang ?? "en-US");
      VoiceDiagnosticsLogger.log("stt:commit", `"${trimmed.slice(0, 60)}"`);
      optsRef.current.onResult(trimmed, lang);
    };

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
          interimBufferRef.current = text;

          if (committedRef.current) return;

          // Reset silence timer on every interim update
          clearSilenceTimer();
          if (text.trim()) {
            VoiceDiagnosticsLogger.log("stt:silence-timer-start");
            silenceTimerRef.current = setTimeout(() => {
              silenceTimerRef.current = null;
              const buffered = interimBufferRef.current;
              VoiceDiagnosticsLogger.log("stt:silence-timer-fired", `"${buffered.slice(0, 40)}"`);
              // PATH B: commit on silence
              commitOnce(buffered);
            }, SILENCE_THRESHOLD_MS);
          }
        },

        onFinalResult: (text) => {
          VoiceDiagnosticsLogger.log("stt:final", text.slice(0, 80));
          // PATH A: browser delivered final — commit immediately
          commitOnce(text);
        },

        onError: (code) => {
          VoiceDiagnosticsLogger.log("stt:error", code);
          clearSilenceTimer();
          const msgs = optsRef.current.messages ?? {};
          if (code === "not-allowed") {
            optsRef.current.onError?.(msgs.micDenied ?? "Microphone access denied.");
          } else if (code === "no-speech") {
            // No audio at all — if we have buffered interim, still commit
            if (interimBufferRef.current.trim()) {
              commitOnce(interimBufferRef.current);
            } else {
              optsRef.current.onError?.(msgs.noSpeech ?? "No speech detected. Please try again.");
              stopListening();
            }
          } else {
            optsRef.current.onError?.(
              msgs.genericError?.(code) ?? `Voice error: ${code}`
            );
            stopListening();
          }
        },

        // PATH C fallback — session ended without isFinal=true
        // (speech-recognition.ts promotes interim to final first via its own PATH C,
        //  but this catches any remaining edge cases)
        onEnd: () => {
          VoiceDiagnosticsLogger.log("stt:end-no-speech");
          clearSilenceTimer();
          if (interimBufferRef.current.trim() && !committedRef.current) {
            commitOnce(interimBufferRef.current);
          } else {
            stopListening();
          }
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
  }, [isSupported, stopListening, clearSilenceTimer]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      activeRef.current = false;
      clearSilenceTimer();
      sessionRef.current?.abort();
      cleanupMedia();
    };
  }, [cleanupMedia, clearSilenceTimer]);

  return { isListening, isSupported, transcript, amplitude, startListening, stopListening };
}
