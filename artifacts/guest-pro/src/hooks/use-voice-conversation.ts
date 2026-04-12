/**
 * use-voice-conversation.ts
 * Continuous voice conversation state machine.
 *
 * State flow:
 *   idle → starting → listening → processing → speaking → listening (loop)
 *
 * The loop continues until the user explicitly calls stopConversation().
 * Interruption (user taps while AI speaks) calls interruptAndListen() which
 * cancels TTS and immediately restarts listening.
 *
 * The chat page drives the loop externally:
 *   1. onSpeechResult fires → chat sends message to AI
 *   2. AI responds → chat calls speakResponse(text, lang)
 *   3. TTS ends → hook restarts listening automatically
 *
 * Safety net: if the AI never responds (network error, timeout), a processing
 * watchdog timer fires after PROCESSING_TIMEOUT_MS and resumes listening so
 * the guest is never stuck in "Thinking" state.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { detectVoiceCapability, type VoiceCapabilityModel } from "@/lib/voice/capability";
import { detectLanguageFromText } from "@/lib/voice/language-resolver";
import { synthesize, cancelSpeech } from "@/lib/voice/speech-synthesis";
import { createSpeechSession, isSttSupported } from "@/lib/voice/speech-recognition";
import { VoiceDiagnosticsLogger } from "@/lib/voice/diagnostics";

// ─── Constants ─────────────────────────────────────────────────────────────────

/** Gap between TTS end and new mic open — prevents mic catching audio tail */
const TTS_TO_STT_GAP_MS = 300;

/**
 * Max time to stay in "processing" state before auto-resuming listening.
 * Guards against network hangs where the AI never responds.
 */
const PROCESSING_TIMEOUT_MS = 30_000;

// ─── Types ────────────────────────────────────────────────────────────────────

export type ConversationState =
  | "idle"       // not started
  | "starting"   // mic permission requested, amplitude being set up
  | "listening"  // mic open, waiting for speech
  | "processing" // transcript committed, waiting for AI response
  | "speaking"   // TTS playing AI response
  | "error"      // unrecoverable error (e.g. mic denied)
  | "stopped"    // user explicitly stopped
  | "unsupported"; // STT not available in this browser

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
  /** True when conversation is running (not idle/stopped/unsupported/error) */
  isActive: boolean;
  /** Start the conversation loop */
  startConversation: () => void;
  /** Stop the conversation loop cleanly */
  stopConversation: () => void;
  /** Interrupt AI speaking and immediately restart listening */
  interruptAndListen: () => void;
  /** Call this when the AI response is ready to be spoken */
  speakResponse: (text: string, lang: string) => void;
  /**
   * Call this when the AI request is in-flight.
   * No-op if not in processing state — safe to call multiple times.
   */
  setProcessing: () => void;
  /** Retry after a transient error */
  retryListening: () => void;
  /** Last error message, if any */
  errorMessage: string | null;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useVoiceConversation(opts: VoiceConversationOptions): VoiceConversationReturn {
  const capability = detectVoiceCapability();

  // ── React state (drives UI) ─────────────────────────────────────────────────
  const [state, setState] = useState<ConversationState>(
    capability.sttSupported ? "idle" : "unsupported"
  );
  const [transcript, setTranscript] = useState("");
  const [amplitude, setAmplitude] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ── Refs (mutable control plane — no re-render needed) ─────────────────────
  const stateRef = useRef<ConversationState>("idle");
  const activeRef = useRef(false);     // true while loop should continue
  const sessionRef = useRef<ReturnType<typeof createSpeechSession>>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const loopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const processingWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Always-fresh opts ref — avoids stale closures in doListen/speakResponse
  const optsRef = useRef(opts);
  optsRef.current = opts;

  // ── Sync state to both ref and React state ──────────────────────────────────
  const setStateSync = useCallback((s: ConversationState) => {
    stateRef.current = s;
    setState(s);
  }, []);

  // ── Processing watchdog ─────────────────────────────────────────────────────
  const clearProcessingWatchdog = useCallback(() => {
    if (processingWatchdogRef.current !== null) {
      clearTimeout(processingWatchdogRef.current);
      processingWatchdogRef.current = null;
    }
  }, []);

  // Forward declaration — will be assigned below after doListen is defined
  const doListenRef = useRef<() => void>(() => {});

  const armProcessingWatchdog = useCallback(() => {
    clearProcessingWatchdog();
    processingWatchdogRef.current = setTimeout(() => {
      // If we're still in processing after timeout, resume listening
      if (activeRef.current && stateRef.current === "processing") {
        VoiceDiagnosticsLogger.log("conv:processing-timeout", "resuming listening");
        doListenRef.current();
      }
    }, PROCESSING_TIMEOUT_MS);
  }, [clearProcessingWatchdog]);

  // ── Amplitude tracking ──────────────────────────────────────────────────────
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
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setAmplitude(avg / 128);
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      // Amplitude visualization is optional — voice still works without it
      VoiceDiagnosticsLogger.log("conv:amplitude-failed", "continuing without viz");
    }
  }, []);

  const stopAmplitude = useCallback(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    analyserRef.current = null;
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setAmplitude(0);
  }, []);

  // ── Core: start one listening turn ──────────────────────────────────────────
  const doListen = useCallback(() => {
    if (!activeRef.current) return;
    if (!isSttSupported()) {
      VoiceDiagnosticsLogger.log("conv:stt-unsupported");
      setStateSync("unsupported");
      return;
    }

    clearProcessingWatchdog();
    setTranscript("");
    setStateSync("listening");
    VoiceDiagnosticsLogger.log("conv:listening");

    const session = createSpeechSession({
      lang: optsRef.current.defaultLang,
      onInterimResult: (text) => {
        VoiceDiagnosticsLogger.log("conv:interim", text.slice(0, 40));
        setTranscript(text);
      },
      onFinalResult: (text) => {
        VoiceDiagnosticsLogger.log("conv:final", text.slice(0, 80));
        const lang = detectLanguageFromText(text, optsRef.current.defaultLang);
        setTranscript(text);
        setStateSync("processing");
        // Arm watchdog — if AI never responds, we resume listening
        armProcessingWatchdog();
        VoiceDiagnosticsLogger.log("conv:processing");
        optsRef.current.onSpeechResult(text, lang);
      },
      onError: (code) => {
        if (!activeRef.current) return;
        VoiceDiagnosticsLogger.log("conv:stt-error", code);

        if (code === "not-allowed") {
          activeRef.current = false;
          setStateSync("error");
          setErrorMessage(
            optsRef.current.messages?.micDenied ??
              "Microphone access denied. Please check your browser settings."
          );
        } else if (code === "no-speech") {
          // Silence — restart listening after brief pause
          if (activeRef.current) {
            loopTimerRef.current = setTimeout(() => doListen(), 500);
          }
        } else {
          // Transient error — auto-retry
          if (activeRef.current) {
            loopTimerRef.current = setTimeout(() => doListen(), 900);
          }
        }
      },
      // onEnd fires only when session ends with NO speech at all.
      // (With speech — even interim — speech-recognition.ts promotes it to
      //  onFinalResult before calling onEnd, so by the time we're here the
      //  transcript has already been committed.)
      onEnd: () => {
        VoiceDiagnosticsLogger.log("conv:stt-end-silence");
        if (activeRef.current && stateRef.current === "listening") {
          // Restart listening after a brief pause
          loopTimerRef.current = setTimeout(() => doListen(), 500);
        }
      },
    });

    if (!session) {
      setStateSync("unsupported");
      return;
    }

    sessionRef.current = session;
    session.start();
  }, [setStateSync, clearProcessingWatchdog, armProcessingWatchdog]);

  // Wire doListen into the forward ref so armProcessingWatchdog can call it
  useEffect(() => {
    doListenRef.current = doListen;
  }, [doListen]);

  // ── Public: speakResponse ───────────────────────────────────────────────────
  const speakResponse = useCallback(
    (text: string, lang: string) => {
      if (!activeRef.current) return;
      clearProcessingWatchdog();
      setStateSync("speaking");
      VoiceDiagnosticsLogger.log("conv:tts-start", lang);

      synthesize(text, lang, {
        onEnd: () => {
          VoiceDiagnosticsLogger.log("conv:tts-end");
          if (activeRef.current) {
            loopTimerRef.current = setTimeout(() => doListen(), TTS_TO_STT_GAP_MS);
          }
        },
        onError: () => {
          VoiceDiagnosticsLogger.log("conv:tts-error", "resuming listening");
          if (activeRef.current) {
            loopTimerRef.current = setTimeout(() => doListen(), TTS_TO_STT_GAP_MS);
          }
        },
      });
    },
    [doListen, setStateSync, clearProcessingWatchdog]
  );

  // ── Public: setProcessing ───────────────────────────────────────────────────
  const setProcessing = useCallback(() => {
    if (activeRef.current && stateRef.current !== "processing") {
      setStateSync("processing");
      armProcessingWatchdog();
    }
  }, [setStateSync, armProcessingWatchdog]);

  // ── Public: startConversation ───────────────────────────────────────────────
  const startConversation = useCallback(() => {
    if (!capability.sttSupported) {
      setStateSync("unsupported");
      return;
    }
    if (activeRef.current) return; // already running

    VoiceDiagnosticsLogger.log("conv:start");
    activeRef.current = true;
    setErrorMessage(null);
    setStateSync("starting");

    startAmplitude().then(() => {
      if (activeRef.current) doListen();
    });
  }, [capability.sttSupported, doListen, setStateSync, startAmplitude]);

  // ── Public: stopConversation ────────────────────────────────────────────────
  const stopConversation = useCallback(() => {
    VoiceDiagnosticsLogger.log("conv:stop");
    activeRef.current = false;

    if (loopTimerRef.current) {
      clearTimeout(loopTimerRef.current);
      loopTimerRef.current = null;
    }
    clearProcessingWatchdog();

    sessionRef.current?.abort();
    sessionRef.current = null;

    cancelSpeech();
    stopAmplitude();
    setTranscript("");
    setStateSync("stopped");
  }, [setStateSync, stopAmplitude, clearProcessingWatchdog]);

  // ── Public: interruptAndListen ──────────────────────────────────────────────
  const interruptAndListen = useCallback(() => {
    if (!activeRef.current) return;
    VoiceDiagnosticsLogger.log("conv:interrupt");
    cancelSpeech();

    if (loopTimerRef.current) {
      clearTimeout(loopTimerRef.current);
      loopTimerRef.current = null;
    }
    clearProcessingWatchdog();
    doListen();
  }, [doListen, clearProcessingWatchdog]);

  // ── Public: retryListening ──────────────────────────────────────────────────
  const retryListening = useCallback(() => {
    if (!capability.sttSupported) return;
    VoiceDiagnosticsLogger.log("conv:retry");
    activeRef.current = true;
    setErrorMessage(null);
    doListen();
  }, [capability.sttSupported, doListen]);

  // ── Cleanup on unmount ──────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      activeRef.current = false;
      if (loopTimerRef.current) clearTimeout(loopTimerRef.current);
      clearProcessingWatchdog();
      sessionRef.current?.abort();
      cancelSpeech();
      stopAmplitude();
    };
  }, [stopAmplitude, clearProcessingWatchdog]);

  const isActive =
    state !== "idle" &&
    state !== "stopped" &&
    state !== "unsupported" &&
    state !== "error";

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
