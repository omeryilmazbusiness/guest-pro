/**
 * Resilient live-chat polling — backoff on failure, pause when hidden/offline.
 */

export const LIVE_CHAT_POLL_BASE_MS = 2_500;
export const LIVE_CHAT_POLL_FAST_MS = 1_200;
export const LIVE_CHAT_POLL_MAX_MS = 30_000;

export function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError";
}

export function nextPollDelayMs(currentMs: number, failed: boolean): number {
  if (!failed) {
    return LIVE_CHAT_POLL_BASE_MS;
  }
  return Math.min(Math.round(currentMs * 1.6), LIVE_CHAT_POLL_MAX_MS);
}

export type LiveChatPollHandle = {
  /** Force an immediate tick (e.g. after sending a message). */
  kick: () => void;
  stop: () => void;
};

export function createLiveChatPoll(
  tick: (signal: AbortSignal) => Promise<void>,
  options?: {
    /** Use shorter interval while active (e.g. guest typing on staff view). */
    fast?: boolean;
    onFailure?: () => void;
    onRecovery?: () => void;
  },
): LiveChatPollHandle {
  let delayMs = options?.fast ? LIVE_CHAT_POLL_FAST_MS : LIVE_CHAT_POLL_BASE_MS;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;
  let inFlight: AbortController | null = null;
  let consecutiveFailures = 0;
  let wasDegraded = false;

  const clearTimer = () => {
    if (timer != null) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const schedule = (ms: number) => {
    clearTimer();
    if (stopped) return;
    timer = setTimeout(() => void run(), ms);
  };

  const run = async () => {
    if (stopped) return;

    if (typeof document !== "undefined" && document.hidden) {
      schedule(delayMs);
      return;
    }

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      consecutiveFailures += 1;
      delayMs = nextPollDelayMs(delayMs, true);
      if (!wasDegraded) {
        wasDegraded = true;
        options?.onFailure?.();
      }
      schedule(delayMs);
      return;
    }

    inFlight?.abort();
    inFlight = new AbortController();
    const signal = inFlight.signal;

    try {
      await tick(signal);
      consecutiveFailures = 0;
      delayMs = options?.fast ? LIVE_CHAT_POLL_FAST_MS : LIVE_CHAT_POLL_BASE_MS;
      if (wasDegraded) {
        wasDegraded = false;
        options?.onRecovery?.();
      }
    } catch (err) {
      if (isAbortError(err)) return;
      consecutiveFailures += 1;
      delayMs = nextPollDelayMs(delayMs, true);
      if (!wasDegraded) {
        wasDegraded = true;
        options?.onFailure?.();
      }
    } finally {
      if (!stopped && !signal.aborted) {
        schedule(delayMs);
      }
    }
  };

  const kick = () => {
    if (stopped) return;
    clearTimer();
    inFlight?.abort();
    delayMs = options?.fast ? LIVE_CHAT_POLL_FAST_MS : LIVE_CHAT_POLL_BASE_MS;
    void run();
  };

  const stop = () => {
    stopped = true;
    clearTimer();
    inFlight?.abort();
    inFlight = null;
  };

  void run();

  if (typeof document !== "undefined") {
    const onVisibility = () => {
      if (!stopped && !document.hidden) kick();
    };
    document.addEventListener("visibilitychange", onVisibility);
    const prevStop = stop;
    return {
      kick,
      stop: () => {
        document.removeEventListener("visibilitychange", onVisibility);
        prevStop();
      },
    };
  }

  return { kick, stop };
}
