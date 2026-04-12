/**
 * speech-recognition.ts
 * STT adapter wrapping the Web Speech Recognition API.
 *
 * Handles:
 * - Chrome / Safari vendor prefix
 * - Interim results for live transcript display
 * - Final result detection
 * - Chrome quirk: onend fires immediately if no speech in focused tab
 * - Proper cleanup
 */

export interface SpeechSessionOptions {
  lang: string;
  /** Called continuously with interim transcripts for live display */
  onInterimResult: (text: string) => void;
  /** Called once with the final transcript when recognition ends successfully */
  onFinalResult: (text: string) => void;
  /** Called on recognition error — code is the SpeechRecognitionError error string */
  onError: (code: string) => void;
  /** Called when the recognition session ends (any reason) */
  onEnd: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export interface SpeechSession {
  start: () => void;
  stop: () => void;
  abort: () => void;
}

export function isSttSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
  );
}

/**
 * Create a single-turn speech recognition session.
 * The session ends after one final result (continuous=false).
 * Caller should create a new session for the next turn.
 */
export function createSpeechSession(opts: SpeechSessionOptions): SpeechSession | null {
  if (!isSttSupported()) return null;

  const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
  const recognition = new SR();

  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = opts.lang;

  const startedAt = { time: 0 };
  let finalFired = false;
  let ended = false;

  recognition.onstart = () => {
    startedAt.time = Date.now();
  };

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    const result = event.results[event.resultIndex];
    const text = result[0].transcript;

    opts.onInterimResult(text);

    if (result.isFinal) {
      finalFired = true;
      opts.onFinalResult(text);
    }
  };

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    if (!ended) {
      ended = true;
      opts.onError(event.error);
    }
  };

  recognition.onend = () => {
    if (!ended) {
      ended = true;
      // Chrome quirk: if onend fires very quickly without any result,
      // it means the recognition never started properly (e.g., tab not focused)
      // Treat this as a recoverable "no-speech" type end
      opts.onEnd();
    }
  };

  return {
    start: () => {
      ended = false;
      finalFired = false;
      recognition.start();
    },
    stop: () => {
      ended = true;
      recognition.stop();
    },
    abort: () => {
      ended = true;
      recognition.abort();
    },
  };
}
