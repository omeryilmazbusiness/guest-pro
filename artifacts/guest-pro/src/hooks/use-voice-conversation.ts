/**
 * use-voice-conversation.ts
 * Continuous voice conversation state machine.
 *
 * State flow:
 *   idle → listening → processing → speaking → listening (loop)
 *
 * The loop continues until the user explicitly calls stopConversation().
 * Interruption (user taps while AI speaks) calls interruptAndListen() which cancels TTS
 * and immediately restarts listening.
 *
 * The chat page drives the loop externally:
 *   1. onSpeechResult fires → chat sends message to AI
 *   2. AI responds → chat calls speakResponse(text, lang)
 *   3. TTS ends → hook restarts listening automatically
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { detectVoiceCapability, type VoiceCapabilityModel } from "@/lib/voice/capability";
import { detectLanguageFromText } from "@/lib/voice/language-resolver";
import { synthesize, cancelSpeech } from "@/lib/voice/speech-synthesis";
import { createSpeechSession, isSttSupported } from "@/lib/voice/speech-recognition";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ConversationState =
  | "idle"
  | "listening"
  | "processing"
  | "speaking"
  | "error"
  | "stopped"
  | "unsupported";

export interface VoiceConversationOptions {
  /** Called when guest speech is recognized — trigger your AI call here */
  onSpeechResult: (transcript: string, detectedLang: string) => void;
  /** BCP 47 language hint for the speech recognizer */
  defaultLang: string;
  /** Error message overrides */
  messages?: {
    notSupported?: string;
    micDenied?: string;
    noSpeech?: string;
  };
}

export interface VoiceConversationReturn {
  state: ConversationState;
  /** Live interim transcript during listening */
  transcript: string;
  /** 0–1 amplitude for animation (0 when not listening) */
  amplitude: number;
  /** Capability model — expose for fallback notices */
  capability: VoiceCapabilityModel;
  /** True when conversation is running (not idle/stopped/unsupported) */
  isActive: boolean;
  /** Start the conversation loop */
  startConversation: () => void;
  /** Stop the conversation loop cleanly */
  stopConversation: () => void;
  /** Interrupt AI speaking and immediately restart listening */
  interruptAndListen: () => void;
  /** Call this when the AI response is ready to be spoken */
  speakResponse: (text: string, lang: string) => void;
  /** Call this when the AI request is in flight (transcript recognized, waiting for AI) */
  setProcessing: () => void;
  /** Retry after a transient error */
  retryListening: () => void;
  /** Last error message, if any */
  errorMessage: string | null;
}

// ─── TTML_GAP: ms to wait between TTS end and new listening start ─────────────
// Prevents the mic from picking up the tail of the TTS audio
const TTS_TO_STT_GAP_MS = 250;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useVoiceConversation(opts: VoiceConversationOptions): VoiceConversationReturn {
  const capability = detectVoiceCapability();

  // ── State ──────────────────────────────────────────────────────────────────
  const [state, setState] = useState<ConversationState>(
    capability.sttSupported ? "idle" : "unsupported"
  );
  const [transcript, setTranscript] = useState("");
  const [amplitude, setAmplitude] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ── Refs (mutable, no re-render needed) ────────────────────────────────────
  const stateRef = useRef<ConversationState>("idle");
  const activeRef = useRef(false); // true while conversation should loop
  const sessionRef = useRef<ReturnType<typeof createSpeechSession>>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const loopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep opts stable ref to avoid stale closures
  const optsRef = useRef(opts);
  optsRef.current = opts;

  // ── Helper: sync state to both ref and React state ─────────────────────────
  const setStateSync = useCallback((s: ConversationState) => {
    stateRef.current = s;
    setState(s);
  }, []);

  // ── Amplitude tracking ─────────────────────────────────────────────────────
  const startAmplitude = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioCtx = new AudioContext();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setAmplitude(avg / 128);
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      // Amplitude viz is optional — doesn't block voice
    }
  }, []);

  const stopAmplitude = useCallback(() => {
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
    analyserRef.current = null;
    setAmplitude(0);
  }, []);

  // ── Core: start one listening turn ─────────────────────────────────────────
  const doListen = useCallback(() => {
    if (!activeRef.current) return;
    if (!isSttSupported()) {
      setStateSync("unsupported");
      return;
    }

    setTranscript("");
    setStateSync("listening");

    const session = createSpeechSession({
      lang: optsRef.current.defaultLang,
      onInterimResult: (text) => setTranscript(text),
      onFinalResult: (text) => {
        setTranscript(text);
        const lang = detectLanguageFromText(text, optsRef.current.defaultLang);
        // Transition to processing — the chat page will call speakResponse when AI replies
        setStateSync("processing");
        setTranscript("");
        optsRef.current.onSpeechResult(text, lang);
      },
      onError: (code) => {
        if (!activeRef.current) return;
        if (code === "not-allowed") {
          activeRef.current = false;
          setStateSync("error");
          setErrorMessage(optsRef.current.messages?.micDenied ?? "Microphone access denied. Please check your browser settings.");
        } else if (code === "no-speech") {
          // Harmless — just restart listening after a brief pause
          if (activeRef.current) {
            loopTimerRef.current = setTimeout(() => doListen(), 400);
          }
        } else {
          // Transient error — auto-retry once
          if (activeRef.current) {
            loopTimerRef.current = setTimeout(() => doListen(), 800);
          }
        }
      },
      onEnd: () => {
        // Recognition ended without a final result and without an error
        // (e.g., Chrome no-speech timeout, Safari session closed)
        // If still active, restart
        if (activeRef.current && stateRef.current === "listening") {
          loopTimerRef.current = setTimeout(() => doListen(), 400);
        }
      },
    });

    if (!session) {
      setStateSync("unsupported");
      return;
    }

    sessionRef.current = session;
    session.start();
  }, [setStateSync, stopAmplitude]);

  // ── Public: speakResponse ─────────────────────────────────────────────────
  const speakResponse = useCallback(
    (text: string, lang: string) => {
      if (!activeRef.current) return;
      setStateSync("speaking");

      synthesize(text, lang, {
        onEnd: () => {
          if (activeRef.current) {
            loopTimerRef.current = setTimeout(() => doListen(), TTS_TO_STT_GAP_MS);
          }
        },
        onError: () => {
          // TTS failed — resume listening anyway
          if (activeRef.current) {
            loopTimerRef.current = setTimeout(() => doListen(), TTS_TO_STT_GAP_MS);
          }
        },
      });
    },
    [doListen, setStateSync]
  );

  // ── Public: setProcessing ─────────────────────────────────────────────────
  const setProcessing = useCallback(() => {
    if (activeRef.current) {
      setStateSync("processing");
    }
  }, [setStateSync]);

  // ── Public: startConversation ─────────────────────────────────────────────
  const startConversation = useCallback(() => {
    if (!capability.sttSupported) {
      setStateSync("unsupported");
      return;
    }
    activeRef.current = true;
    setErrorMessage(null);
    startAmplitude().then(() => doListen());
  }, [capability.sttSupported, doListen, setStateSync, startAmplitude]);

  // ── Public: stopConversation ──────────────────────────────────────────────
  const stopConversation = useCallback(() => {
    activeRef.current = false;
    if (loopTimerRef.current) {
      clearTimeout(loopTimerRef.current);
      loopTimerRef.current = null;
    }
    sessionRef.current?.abort();
    sessionRef.current = null;
    cancelSpeech();
    stopAmplitude();
    setTranscript("");
    setStateSync("stopped");
  }, [setStateSync, stopAmplitude]);

  // ── Public: interruptAndListen ────────────────────────────────────────────
  const interruptAndListen = useCallback(() => {
    if (!activeRef.current) return;
    cancelSpeech();
    if (loopTimerRef.current) {
      clearTimeout(loopTimerRef.current);
      loopTimerRef.current = null;
    }
    doListen();
  }, [doListen]);

  // ── Public: retryListening ─────────────────────────────────────────────────
  const retryListening = useCallback(() => {
    if (!capability.sttSupported) return;
    activeRef.current = true;
    setErrorMessage(null);
    doListen();
  }, [capability.sttSupported, doListen]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      activeRef.current = false;
      if (loopTimerRef.current) clearTimeout(loopTimerRef.current);
      sessionRef.current?.abort();
      cancelSpeech();
      stopAmplitude();
    };
  }, [stopAmplitude]);

  const isActive =
    state !== "idle" && state !== "stopped" && state !== "unsupported" && state !== "error";

  return {
    state,
    transcript,
    amplitude,
    capability,
    isActive,
    startConversation,
    stopConversation,
    interruptAndListen,
    speakResponse,
    setProcessing,
    retryListening,
    errorMessage,
  };
}
