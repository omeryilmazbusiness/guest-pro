/**
 * use-voice-conversation.ts
 * Continuous voice conversation state machine.
 *
 * State flow:
 *   idle → starting → listening → processing → speaking → listening (loop)
 *
 * ─── End-of-utterance strategy ───────────────────────────────────────────────
 * We use a DUAL-PATH approach so the system never stays stuck in listening:
 *
 *   PATH A — Browser final result (fast, preferred):
 *     When the browser delivers isFinal=true, commitOnce() is called immediately.
 *     The silence timer is cancelled — no need to wait.
 *
 *   PATH B — Silence timeout (fallback, always-present):
 *     When interim speech is detected, we start a SILENCE_THRESHOLD_MS timer.
 *     The timer RESETS on every new interim result (user still talking).
 *     When the timer fires (user paused for 1.5 s), we call commitOnce() with
 *     the buffered interim text — without waiting for the browser to decide.
 *     The recognition session is aborted; the conversation advances.
 *
 *   PATH C — Browser onend with interim text (backup):
 *     speech-recognition.ts promotes the last interim to a final result when
 *     the session ends without isFinal=true (handled at the adapter layer).
 *     commitOnce() de-duplicates regardless of which path fires first.
 *
 * ─── commitOnce guarantee ────────────────────────────────────────────────────
 *   Only ONE commit fires per listening turn. The committedRef flag prevents
 *   any second commit from paths B or C after path A has already fired.
 *
 * ─── Processing watchdog ────────────────────────────────────────────────────
 *   If the AI never responds (network hang, quota exceeded), a 30 s watchdog
 *   resumes listening so the guest is never stuck in "Thinking" state.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { detectVoiceCapability, type VoiceCapabilityModel } from "@/lib/voice/capability";
import { detectLanguageFromText } from "@/lib/voice/language-resolver";
import { synthesize, cancelSpeech, primeTts } from "@/lib/voice/speech-synthesis";
import {
  abortAllSpeechSessions,
  createSpeechSession,
  isSttSupported,
} from "@/lib/voice/speech-recognition";
import { VoiceDiagnosticsLogger } from "@/lib/voice/diagnostics";

// ─── Constants ─────────────────────────────────────────────────────────────────

/**
 * Gap between TTS end and new mic open.
 * 700 ms is enough for the browser's audio session to fully release from
 * "playback" mode before STT starts recording — 300 ms was too short on
 * Android Chrome and iOS Safari, causing silent second-turn failure.
 */
const TTS_TO_STT_GAP_MS = 900;

/**
 * Silence threshold — how long (ms) of speech-free audio after interim results
 * before we proactively commit the transcript and stop waiting for the browser.
 * 1500 ms is enough to not cut off mid-sentence, but short enough to feel snappy.
 */
const SILENCE_THRESHOLD_MS = 1500;

/**
 * Max time in "processing" before resuming listening.
 * Guards against AI network hangs where the server never responds.
 */
const PROCESSING_TIMEOUT_MS = 30_000;

/**
 * If no speech at all is detected in a turn, wait this long before restarting.
 * Prevents a tight loop if the mic opens but detects nothing.
 */
const EMPTY_TURN_RESTART_MS = 600;

// ─── Types ────────────────────────────────────────────────────────────────────

export type ConversationState =
  | "idle"         // not started
  | "starting"     // mic permission requested, amplitude being set up
  | "listening"    // mic open, waiting for speech
  | "processing"   // transcript committed, waiting for AI response
  | "speaking"     // TTS playing AI response
  | "error"        // unrecoverable (e.g. mic denied)
  | "stopped"      // user explicitly stopped
  | "unsupported"; // STT unavailable in this browser

export interface VoiceConversationOptions {
  /** Called when guest speech is recognized — trigger your AI call here */
  onSpeechResult: (transcript: string, detectedLang: string) => void;
  /** BCP 47 language hint for the speech recognizer */
  defaultLang: string;
  messages?: {
    notSupported?: string;
    micDenied?: string;
    noSpeech?: string;
  };
}

export interface VoiceConversationReturn {
  state: ConversationState;
  transcript: string;
  amplitude: number;
  capability: VoiceCapabilityModel;
  isActive: boolean;
  startConversation: () => void;
  stopConversation: () => void;
  interruptAndListen: () => void;
  speakResponse: (text: string, lang: string) => void;
  setProcessing: () => void;
  /** Stop current mic turn but keep conversation active (e.g. chip tap). */
  pauseListeningForOutgoingMessage: () => void;
  retryListening: () => void;
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

  // ── Mutable control plane ───────────────────────────────────────────────────
  const stateRef = useRef<ConversationState>("idle");
  const activeRef = useRef(false);
  const sessionRef = useRef<ReturnType<typeof createSpeechSession>>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Timer refs — all cleared on stopConversation / unmount
  const loopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const processingWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Per-turn transcript buffer and commit guard
  const interimBufferRef = useRef("");
  const committedRef = useRef(false);
  /** Bumps each doListen() — stale session callbacks are ignored */
  const listenGenRef = useRef(0);

  // Always-fresh opts ref — no stale closures in async callbacks
  const optsRef = useRef(opts);
  optsRef.current = opts;

  // Forward ref so armProcessingWatchdog can call doListen without a circular dep
  const doListenRef = useRef<() => void>(() => {});

  // ── State sync ──────────────────────────────────────────────────────────────
  const setStateSync = useCallback((s: ConversationState) => {
    stateRef.current = s;
    setState(s);
  }, []);

  // ── Silence timer management ────────────────────────────────────────────────
  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current !== null) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
      VoiceDiagnosticsLogger.log("conv:silence-timer-clear");
    }
  }, []);

  // ── Processing watchdog ─────────────────────────────────────────────────────
  const clearProcessingWatchdog = useCallback(() => {
    if (processingWatchdogRef.current !== null) {
      clearTimeout(processingWatchdogRef.current);
      processingWatchdogRef.current = null;
    }
  }, []);

  const armProcessingWatchdog = useCallback(() => {
    clearProcessingWatchdog();
    processingWatchdogRef.current = setTimeout(() => {
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
      VoiceDiagnosticsLogger.log("conv:amplitude-failed", "voice continues without viz");
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

  /**
   * Release the separate getUserMedia stream before STT starts.
   * Holding two mic consumers (viz + SpeechRecognition) breaks the 2nd+ turn on
   * iOS Safari and many Android Chrome builds.
   */
  const releaseMicForStt = useCallback(() => {
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
  }, []);

  const clearLoopTimer = useCallback(() => {
    if (loopTimerRef.current !== null) {
      clearTimeout(loopTimerRef.current);
      loopTimerRef.current = null;
    }
  }, []);

  const scheduleListen = useCallback(
    (delayMs: number) => {
      clearLoopTimer();
      loopTimerRef.current = setTimeout(() => {
        loopTimerRef.current = null;
        doListenRef.current();
      }, delayMs);
    },
    [clearLoopTimer]
  );

  // ── Core: start one listening turn ──────────────────────────────────────────
  const doListen = useCallback(() => {
    if (!activeRef.current) return;
    if (!isSttSupported()) {
      VoiceDiagnosticsLogger.log("conv:stt-unsupported");
      setStateSync("unsupported");
      return;
    }

    const turnGen = ++listenGenRef.current;

    // Reset per-turn state
    clearProcessingWatchdog();
    clearSilenceTimer();
    committedRef.current = false;
    interimBufferRef.current = "";

    // Tear down any lingering session before opening a new one
    sessionRef.current?.abort();
    sessionRef.current = null;

    // Free mic for SpeechRecognition (exclusive on mobile)
    releaseMicForStt();

    setTranscript("");
    setStateSync("listening");
    VoiceDiagnosticsLogger.log("conv:listening", `gen=${turnGen}`);

    const isStale = () => !activeRef.current || listenGenRef.current !== turnGen;

    // ── commitOnce — only one commit fires per turn ─────────────────────────
    // Called from: (A) browser onFinalResult, (B) silence timer, (C) onEnd fallback
    const commitOnce = (text: string) => {
      if (isStale() || committedRef.current) return;
      committedRef.current = true;

      clearSilenceTimer();

      // Graceful stop so onend can flush interim → final in the adapter
      const session = sessionRef.current;
      sessionRef.current = null;
      session?.stop();

      const trimmed = text.trim();
      if (!trimmed) {
        // Empty transcript after all paths — restart listening
        VoiceDiagnosticsLogger.log("conv:commit-empty", "restarting");
        if (!isStale()) scheduleListen(EMPTY_TURN_RESTART_MS);
        return;
      }

      const lang = detectLanguageFromText(trimmed, optsRef.current.defaultLang);
      VoiceDiagnosticsLogger.log("conv:commit", `"${trimmed.slice(0, 60)}"`);

      setTranscript(trimmed);
      setStateSync("processing");
      armProcessingWatchdog();
      VoiceDiagnosticsLogger.log("conv:processing");

      optsRef.current.onSpeechResult(trimmed, lang);
    };

    const session = createSpeechSession({
      lang: optsRef.current.defaultLang,

      onInterimResult: (text) => {
        if (isStale()) return;
        VoiceDiagnosticsLogger.log("conv:interim", text.slice(0, 40));
        setTranscript(text);
        interimBufferRef.current = text;
        // Visual feedback without a parallel mic stream
        setAmplitude(Math.min(1, 0.25 + text.length / 80));

        if (committedRef.current) return;

        // Reset / start silence timer on every interim result
        clearSilenceTimer();
        if (text.trim()) {
          VoiceDiagnosticsLogger.log("conv:silence-timer-start");
          silenceTimerRef.current = setTimeout(() => {
            silenceTimerRef.current = null;
            const buffered = interimBufferRef.current;
            VoiceDiagnosticsLogger.log("conv:silence-timer-fired", `"${buffered.slice(0, 40)}"`);
            // PATH B: silence timeout — commit whatever we've buffered
            commitOnce(buffered);
          }, SILENCE_THRESHOLD_MS);
        }
      },

      onFinalResult: (text) => {
        if (isStale()) return;
        VoiceDiagnosticsLogger.log("conv:final", text.slice(0, 80));
        // PATH A: browser delivered a final result — commit immediately
        commitOnce(text);
      },

      onError: (code) => {
        if (isStale()) return;
        clearSilenceTimer();
        sessionRef.current = null;
        VoiceDiagnosticsLogger.log("conv:stt-error", code);

        if (code === "not-allowed") {
          activeRef.current = false;
          setStateSync("error");
          setErrorMessage(
            optsRef.current.messages?.micDenied ??
              "Microphone access denied. Please check your browser settings."
          );
        } else if (code === "no-speech") {
          if (!isStale()) scheduleListen(EMPTY_TURN_RESTART_MS);
        } else if (code === "start-failed") {
          if (!isStale()) scheduleListen(600);
        } else {
          if (!isStale()) scheduleListen(900);
        }
      },

      // onEnd fires only when the session ends with no speech detected at all
      // (if speech was heard, speech-recognition.ts promotes interim to final
      //  via PATH C, so commitOnce has already been called by the time onEnd fires)
      onEnd: () => {
        if (isStale()) return;
        clearSilenceTimer();
        sessionRef.current = null;
        setAmplitude(0);
        VoiceDiagnosticsLogger.log("conv:stt-end");
        // If we still have buffered text and haven't committed, PATH C:
        const buffered = interimBufferRef.current;
        if (buffered.trim() && !committedRef.current) {
          VoiceDiagnosticsLogger.log("conv:stt-end-commit-fallback", buffered.slice(0, 40));
          commitOnce(buffered);
        } else if (!committedRef.current && stateRef.current === "listening") {
          scheduleListen(EMPTY_TURN_RESTART_MS);
        }
      },
    });

    if (!session) {
      setStateSync("unsupported");
      return;
    }

    sessionRef.current = session;
    session.start();
  }, [
    setStateSync,
    clearProcessingWatchdog,
    armProcessingWatchdog,
    clearSilenceTimer,
    releaseMicForStt,
    scheduleListen,
  ]);

  // Keep forward ref current
  useEffect(() => {
    doListenRef.current = doListen;
  }, [doListen]);

  // ── Public: speakResponse ───────────────────────────────────────────────────
  const speakResponse = useCallback(
    (text: string, lang: string) => {
      if (!activeRef.current) return;
      clearProcessingWatchdog();
      clearSilenceTimer();
      sessionRef.current?.abort();
      sessionRef.current = null;
      releaseMicForStt();
      setAmplitude(0);
      setStateSync("speaking");
      VoiceDiagnosticsLogger.log("conv:tts-start", lang);

      synthesize(text, lang, {
        onEnd: () => {
          VoiceDiagnosticsLogger.log("conv:tts-end");
          if (activeRef.current) scheduleListen(TTS_TO_STT_GAP_MS);
        },
        onError: () => {
          VoiceDiagnosticsLogger.log("conv:tts-error", "resuming listening");
          if (activeRef.current) scheduleListen(TTS_TO_STT_GAP_MS);
        },
      });
    },
    [setStateSync, clearProcessingWatchdog, clearSilenceTimer, releaseMicForStt, scheduleListen]
  );

  // ── Public: setProcessing ───────────────────────────────────────────────────
  const setProcessing = useCallback(() => {
    if (activeRef.current && stateRef.current !== "processing") {
      setStateSync("processing");
      armProcessingWatchdog();
    }
  }, [setStateSync, armProcessingWatchdog]);

  // ── Public: pauseListeningForOutgoingMessage (chip / typed send in voice mode) ─
  const pauseListeningForOutgoingMessage = useCallback(() => {
    if (!activeRef.current) return;
    VoiceDiagnosticsLogger.log("conv:pause-for-outgoing");
    clearLoopTimer();
    clearSilenceTimer();
    sessionRef.current?.abort();
    sessionRef.current = null;
    releaseMicForStt();
    setAmplitude(0);
    committedRef.current = true;
    setStateSync("processing");
    armProcessingWatchdog();
  }, [
    clearLoopTimer,
    clearSilenceTimer,
    releaseMicForStt,
    setStateSync,
    armProcessingWatchdog,
  ]);

  // ── Public: startConversation ───────────────────────────────────────────────
  const startConversation = useCallback(() => {
    if (!capability.sttSupported) {
      setStateSync("unsupported");
      return;
    }
    if (activeRef.current) return;

    VoiceDiagnosticsLogger.log("conv:start");

    // ── iOS/Safari TTS unlock ─────────────────────────────────────────────────
    // MUST run synchronously here, inside the user-gesture call stack.
    // Speaks a silent near-instant utterance so all future synthesize() calls
    // are allowed even though they happen after async AI responses.
    primeTts();

    activeRef.current = true;
    setErrorMessage(null);
    setStateSync("starting");

    // Request mic permission once, then release — STT owns the mic each turn
    startAmplitude().then(() => {
      releaseMicForStt();
      if (activeRef.current) doListen();
    });
  }, [capability.sttSupported, doListen, setStateSync, startAmplitude, releaseMicForStt]);

  // ── Public: stopConversation ────────────────────────────────────────────────
  const stopConversation = useCallback(() => {
    VoiceDiagnosticsLogger.log("conv:stop");
    activeRef.current = false;
    abortAllSpeechSessions();

    clearLoopTimer();
    clearSilenceTimer();
    clearProcessingWatchdog();

    sessionRef.current?.abort();
    sessionRef.current = null;

    cancelSpeech();
    stopAmplitude();
    setTranscript("");
    interimBufferRef.current = "";
    committedRef.current = false;
    setStateSync("stopped");
  }, [setStateSync, stopAmplitude, clearSilenceTimer, clearProcessingWatchdog, clearLoopTimer]);

  // ── Public: interruptAndListen ──────────────────────────────────────────────
  const interruptAndListen = useCallback(() => {
    if (!activeRef.current) return;
    VoiceDiagnosticsLogger.log("conv:interrupt");
    cancelSpeech();

    clearLoopTimer();
    clearSilenceTimer();
    clearProcessingWatchdog();

    doListen();
  }, [doListen, clearSilenceTimer, clearProcessingWatchdog, clearLoopTimer]);

  // ── Public: retryListening ──────────────────────────────────────────────────
  const retryListening = useCallback(() => {
    if (!capability.sttSupported || !activeRef.current) return;
    VoiceDiagnosticsLogger.log("conv:retry");
    setErrorMessage(null);
    clearSilenceTimer();
    doListen();
  }, [capability.sttSupported, doListen, clearSilenceTimer]);

  // ── Cleanup on unmount ──────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      activeRef.current = false;
      clearLoopTimer();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      clearProcessingWatchdog();
      abortAllSpeechSessions();
      sessionRef.current = null;
      cancelSpeech();
      stopAmplitude();
    };
  }, [stopAmplitude, clearProcessingWatchdog, clearLoopTimer]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden && activeRef.current) {
        VoiceDiagnosticsLogger.log("conv:visibility-hidden-stop");
        stopConversation();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [stopConversation]);

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
    pauseListeningForOutgoingMessage,
    retryListening,
    errorMessage,
  };
}
