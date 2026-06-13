/**
 * LiveChatEmergencyOverlay — non-blocking urgent alerts for reception.
 *
 * Sits in the overview-cards row (guests / requests alignment) — no full-screen block.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ackLiveChatEmergencyEvent,
  fetchLiveChatPendingEmergencies,
  type LiveChatEmergencyEvent,
} from "@/lib/live-chat-api";
import { dispatchLiveChatOpenSession } from "@/lib/live-chat-open-session";
import { LiveChatEmergencyModal } from "@/components/manager/LiveChatEmergencyModal";

const POLL_MS = 1_000;
const MAX_POLL_MS = 30_000;

function playEmergencyAlertTone(): void {
  try {
    const ctx = new AudioContext();
    const beep = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.value = 0.14;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration);
    };
    beep(880, 0, 0.18);
    beep(1100, 0.22, 0.18);
    beep(880, 0.44, 0.22);
    setTimeout(() => void ctx.close(), 800);
  } catch {
    /* audio optional */
  }
}

export function LiveChatEmergencyOverlay({
  enabled,
  onNavigateToLiveChat,
}: {
  enabled: boolean;
  onNavigateToLiveChat: () => void;
}) {
  const [queue, setQueue] = useState<LiveChatEmergencyEvent[]>([]);
  const knownIdsRef = useRef<Set<number>>(new Set());
  const pollInFlightRef = useRef(false);
  const pollDelayRef = useRef(POLL_MS);

  const syncQueue = useCallback(async (): Promise<boolean> => {
    if (!enabled || pollInFlightRef.current) return true;
    pollInFlightRef.current = true;
    try {
      const pending = await fetchLiveChatPendingEmergencies();
      const serverIds = new Set(pending.map((e) => e.eventId));

      const fresh = pending.filter((e) => !knownIdsRef.current.has(e.eventId));
      if (fresh.length > 0) {
        for (const event of fresh) knownIdsRef.current.add(event.eventId);
        playEmergencyAlertTone();
      }

      setQueue((prev) => {
        const merged = prev.filter((e) => serverIds.has(e.eventId));
        const seen = new Set(merged.map((e) => e.eventId));
        for (const event of pending) {
          if (!seen.has(event.eventId)) merged.push(event);
        }
        return merged.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
      });
      return true;
    } catch {
      return false;
    } finally {
      pollInFlightRef.current = false;
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setQueue([]);
      knownIdsRef.current.clear();
      pollDelayRef.current = POLL_MS;
      return;
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    const tick = async () => {
      if (cancelled) return;
      const ok = await syncQueue();
      if (cancelled) return;
      pollDelayRef.current = ok
        ? POLL_MS
        : Math.min(pollDelayRef.current * 2, MAX_POLL_MS);
      timer = setTimeout(() => void tick(), pollDelayRef.current);
    };

    void tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [enabled, syncQueue]);

  const dismiss = async (event: LiveChatEmergencyEvent) => {
    setQueue((prev) => prev.filter((e) => e.eventId !== event.eventId));
    await ackLiveChatEmergencyEvent(event.eventId).catch(() => {});
    void syncQueue();
  };

  const goToChat = async (event: LiveChatEmergencyEvent) => {
    onNavigateToLiveChat();
    dispatchLiveChatOpenSession(event);
    await dismiss(event);
  };

  if (!enabled || queue.length === 0) return null;

  const visible = queue.slice(0, 3);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-[4.75rem] z-[200] flex justify-center px-4"
      aria-live="assertive"
    >
      <div className="pointer-events-none w-full max-w-2xl">
        <div className="grid grid-cols-2 gap-2.5">
          <div aria-hidden />
          <div className="pointer-events-auto space-y-2">
            {visible.map((event, idx) => (
              <LiveChatEmergencyModal
                key={event.eventId}
                item={event}
                stackIndex={idx}
                stackTotal={queue.length}
                embedded
                compact
                onGoToChat={() => void goToChat(event)}
                onDismiss={() => void dismiss(event)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
