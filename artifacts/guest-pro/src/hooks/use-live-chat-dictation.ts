/**
 * Live chat dictation — listen until the guest stops speaking, then auto-send.
 *
 * Unlike AI voice conversation, there is no TTS loop. Mic stays active across
 * turns: each silence boundary commits one utterance via onUtteranceComplete.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { detectVoiceCapability } from "@/lib/voice/capability";
import {
  abortAllSpeechSessions,
  createSpeechSession,
  isSttSupported,
  type SpeechSession,
} from "@/lib/voice/speech-recognition";

const SILENCE_THRESHOLD_MS = 1500;
const EMPTY_TURN_RESTART_MS = 600;
const TURN_RESTART_GAP_MS = 400;

export function useLiveChatDictation(opts: {
  lang: string;
  onUtteranceComplete: (text: string) => void | Promise<void>;
  disabled?: boolean;
}) {
  const capability = detectVoiceCapability();
  const [active, setActive] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [amplitude, setAmplitude] = useState(0);

  const activeRef = useRef(false);
  const sessionRef = useRef<SpeechSession | null>(null);
  const committedRef = useRef(false);
  const interimBufferRef = useRef("");
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listenGenRef = useRef(0);
  const optsRef = useRef(opts);
  optsRef.current = opts;

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current !== null) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const clearRestartTimer = useCallback(() => {
    if (restartTimerRef.current !== null) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    activeRef.current = false;
    setActive(false);
    setListening(false);
    clearSilenceTimer();
    clearRestartTimer();
    committedRef.current = false;
    interimBufferRef.current = "";
    sessionRef.current?.abort();
    sessionRef.current = null;
    abortAllSpeechSessions();
    setTranscript("");
    setAmplitude(0);
  }, [clearSilenceTimer, clearRestartTimer]);

  const scheduleListen = useCallback((delayMs: number) => {
    clearRestartTimer();
    restartTimerRef.current = setTimeout(() => {
      restartTimerRef.current = null;
      if (activeRef.current) doListenRef.current();
    }, delayMs);
  }, [clearRestartTimer]);

  const doListenRef = useRef<() => void>(() => {});

  const doListen = useCallback(() => {
    if (!activeRef.current || optsRef.current.disabled) return;
    if (!isSttSupported()) return;

    const turnGen = ++listenGenRef.current;
    clearSilenceTimer();
    committedRef.current = false;
    interimBufferRef.current = "";
    sessionRef.current?.abort();
    sessionRef.current = null;

    setTranscript("");
    setListening(true);
    setAmplitude(0);

    const isStale = () => !activeRef.current || listenGenRef.current !== turnGen;

    const commitOnce = (text: string) => {
      if (isStale() || committedRef.current) return;
      committedRef.current = true;
      clearSilenceTimer();

      const session = sessionRef.current;
      sessionRef.current = null;
      session?.stop();

      const trimmed = text.trim();
      if (!trimmed) {
        setListening(false);
        if (!isStale()) scheduleListen(EMPTY_TURN_RESTART_MS);
        return;
      }

      setTranscript(trimmed);
      setListening(false);
      setAmplitude(0);

      void (async () => {
        try {
          await optsRef.current.onUtteranceComplete(trimmed);
        } finally {
          if (activeRef.current && !isStale()) {
            scheduleListen(TURN_RESTART_GAP_MS);
          }
        }
      })();
    };

    const session = createSpeechSession({
      lang: optsRef.current.lang,

      onInterimResult: (text) => {
        if (isStale()) return;
        setTranscript(text);
        interimBufferRef.current = text;
        setAmplitude(Math.min(1, 0.25 + text.length / 80));

        if (committedRef.current) return;
        clearSilenceTimer();
        if (text.trim()) {
          silenceTimerRef.current = setTimeout(() => {
            silenceTimerRef.current = null;
            commitOnce(interimBufferRef.current);
          }, SILENCE_THRESHOLD_MS);
        }
      },

      onFinalResult: (text) => {
        if (isStale()) return;
        commitOnce(text);
      },

      onError: (code) => {
        if (isStale()) return;
        clearSilenceTimer();
        sessionRef.current = null;
        setListening(false);
        setAmplitude(0);

        if (code === "no-speech" || code === "start-failed") {
          if (!isStale()) scheduleListen(EMPTY_TURN_RESTART_MS);
        } else if (code !== "aborted" && !isStale()) {
          scheduleListen(900);
        }
      },

      onEnd: () => {
        if (isStale()) return;
        clearSilenceTimer();
        sessionRef.current = null;
        setAmplitude(0);

        const buffered = interimBufferRef.current;
        if (buffered.trim() && !committedRef.current) {
          commitOnce(buffered);
        } else if (!committedRef.current && activeRef.current) {
          setListening(false);
          scheduleListen(EMPTY_TURN_RESTART_MS);
        }
      },
    });

    if (!session) return;
    sessionRef.current = session;
    session.start();
  }, [clearSilenceTimer, scheduleListen]);

  useEffect(() => {
    doListenRef.current = doListen;
  }, [doListen]);

  const start = useCallback(() => {
    if (optsRef.current.disabled || !capability.sttSupported) return;
    if (activeRef.current) return;

    abortAllSpeechSessions();
    activeRef.current = true;
    setActive(true);
    doListen();
  }, [capability.sttSupported, doListen]);

  const toggle = useCallback(() => {
    if (activeRef.current) {
      stop();
      return;
    }
    start();
  }, [start, stop]);

  /** Pause mic while a typed message is being sent; resume if mic was active. */
  const pauseForOutgoingMessage = useCallback(() => {
    if (!activeRef.current) return;
    clearSilenceTimer();
    clearRestartTimer();
    committedRef.current = true;
    sessionRef.current?.abort();
    sessionRef.current = null;
    setListening(false);
    setAmplitude(0);
  }, [clearSilenceTimer, clearRestartTimer]);

  const resumeAfterOutgoingMessage = useCallback(() => {
    if (!activeRef.current) return;
    committedRef.current = false;
    scheduleListen(TURN_RESTART_GAP_MS);
  }, [scheduleListen]);

  useEffect(() => () => stop(), [stop]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden && activeRef.current) stop();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [stop]);

  return {
    active,
    listening,
    transcript,
    amplitude,
    isSupported: capability.sttSupported,
    toggle,
    start,
    stop,
    pauseForOutgoingMessage,
    resumeAfterOutgoingMessage,
  };
}
