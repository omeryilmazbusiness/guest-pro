/**
 * speech-recognition.ts
 * STT adapter wrapping the Web Speech Recognition API.
 *
 * Key hardening over a naive wrapper:
 *
 * 1. INTERIM → FINAL FALLBACK (primary bug fix)
 *    Many browsers (Chrome mobile, Safari) end the session without ever
 *    delivering `isFinal = true` — they emit interim results and then fire
 *    `onend`. We track the last accumulated interim text and, when the session
 *    ends without a confirmed final, we promote that interim text to a final
 *    result ourselves. This is the correct, user-observable behavior: the user
 *    spoke, the browser transcribed it, we commit it.
 *
 * 2. Chrome vendor-prefix handling
 * 3. Prevents double-fire of onEnd / onFinalResult via the `ended` flag
 * 4. Session lifecycle: start / stop / abort all guard `ended` correctly
 */

export interface SpeechSessionOptions {
  lang: string;
  /** Called continuously with interim transcripts for live display */
  onInterimResult: (text: string) => void;
  /**
   * Called once with the final transcript.
   * This fires EITHER when isFinal=true is delivered by the browser, OR when
   * the session ends and we have accumulated interim text (fallback promotion).
   */
  onFinalResult: (text: string) => void;
  /** Called on recognition error — code is the SpeechRecognitionError string */
  onError: (code: string) => void;
  /** Called when the session ends with NO speech at all (not even interim) */
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
 *
 * `continuous = false` + `interimResults = true`:
 * - The browser fires onresult with interim text while the user speaks
 * - Normally delivers a final result (isFinal=true) when paused/done
 * - Falls back to promoting the last interim transcript if isFinal never arrives
 *
 * Caller must create a new session for the next turn (this is intentional
 * one-shot architecture — caller owns the loop).
 */
export function createSpeechSession(opts: SpeechSessionOptions): SpeechSession | null {
  if (!isSttSupported()) return null;

  const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
  const recognition = new SR();

  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = opts.lang;
  recognition.maxAlternatives = 1;

  let ended = false;
  let finalFired = false;
  // Accumulated interim text — promoted to final if session ends without isFinal
  let lastInterimText = "";

  recognition.onstart = () => {
    // Recognition engine started — mic is open
    void 0;
  };

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    // Accumulate all results from this event batch
    // With continuous=false, resultIndex is typically 0 and there's one result,
    // but we iterate properly to handle edge cases.
    let interimAccum = "";
    let finalAccum = "";

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const r = event.results[i];
      const text = r[0].transcript;
      if (r.isFinal) {
        finalAccum += text;
      } else {
        interimAccum += text;
      }
    }

    if (finalAccum) {
      // Browser delivered a confirmed final result — commit immediately
      finalFired = true;
      lastInterimText = "";
      opts.onInterimResult(finalAccum);
      opts.onFinalResult(finalAccum);
    } else if (interimAccum) {
      // Interim only — update display, remember for fallback
      lastInterimText = interimAccum;
      opts.onInterimResult(interimAccum);
    }
  };

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    if (ended) return;
    ended = true;

    if (event.error === "no-speech") {
      // No audio detected at all — not an error, just silence
      // If we have interim text from before (unlikely), commit it; otherwise signal end
      if (lastInterimText.trim()) {
        finalFired = true;
        opts.onFinalResult(lastInterimText);
      } else {
        opts.onError("no-speech");
      }
    } else {
      opts.onError(event.error);
    }
  };

  recognition.onend = () => {
    if (ended) return;
    ended = true;

    if (!finalFired) {
      if (lastInterimText.trim()) {
        // PRIMARY BUG FIX:
        // Browser ended the session (e.g. silence timeout, mobile power management,
        // Safari quirk) without delivering isFinal=true, but we saw interim text.
        // Promote the last interim transcript to a final result.
        // This ensures the user's speech is never silently discarded.
        opts.onFinalResult(lastInterimText);
      } else {
        // Truly no speech detected — signal the caller
        opts.onEnd();
      }
    }
    // If finalFired is already true, onFinalResult was already delivered — do nothing
  };

  return {
    start: () => {
      ended = false;
      finalFired = false;
      lastInterimText = "";
      recognition.start();
    },
    stop: () => {
      if (!ended) {
        ended = true;
        recognition.stop();
      }
    },
    abort: () => {
      if (!ended) {
        ended = true;
        recognition.abort();
      }
    },
  };
}
