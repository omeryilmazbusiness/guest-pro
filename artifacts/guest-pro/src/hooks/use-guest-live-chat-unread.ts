import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  fetchGuestLiveChatUnread,
  markGuestLiveChatRead,
  type GuestLiveChatUnreadSnapshot,
} from "@/lib/live-chat-api";
import { ROUTES } from "@/lib/app-routes";
import { nextPollDelayMs, LIVE_CHAT_POLL_BASE_MS } from "@/lib/live-chat-sync-poll";
import { shouldShowGuestLiveChatAlert } from "@/lib/guest-live-chat-alert";

const EMPTY: GuestLiveChatUnreadSnapshot = {
  unreadCount: 0,
  sessionId: null,
  preview: null,
  latestMessageId: null,
};

const ACK_STORAGE_KEY = "guest_live_chat_last_ack_msg_id";

function readLastAckMessageId(): number {
  try {
    const raw = sessionStorage.getItem(ACK_STORAGE_KEY);
    if (!raw) return 0;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

function writeLastAckMessageId(messageId: number): void {
  try {
    sessionStorage.setItem(ACK_STORAGE_KEY, String(messageId));
  } catch {
    /* ignore */
  }
}

export function useGuestLiveChatUnread() {
  const { isAuthenticated, user } = useAuth();
  const [location] = useLocation();
  const onLiveChatPage = location.includes(ROUTES.guestLiveChat);
  const enabled = isAuthenticated && user?.role === "guest" && !onLiveChatPage;

  const [snapshot, setSnapshot] = useState<GuestLiveChatUnreadSnapshot>(EMPTY);
  const [showAlert, setShowAlert] = useState(false);
  const snapshotRef = useRef(snapshot);
  snapshotRef.current = snapshot;
  const lastAlertedIdRef = useRef(0);
  const delayRef = useRef(LIVE_CHAT_POLL_BASE_MS);
  const ackInFlightRef = useRef(false);

  const applySnapshot = useCallback((next: GuestLiveChatUnreadSnapshot) => {
    setSnapshot(next);
    if (
      shouldShowGuestLiveChatAlert(
        next.unreadCount,
        next.latestMessageId,
        readLastAckMessageId(),
      ) &&
      next.latestMessageId !== lastAlertedIdRef.current
    ) {
      lastAlertedIdRef.current = next.latestMessageId!;
      setShowAlert(true);
    }
    if (next.unreadCount === 0) {
      lastAlertedIdRef.current = 0;
      setShowAlert(false);
    }
  }, []);

  const refresh = useCallback(async (): Promise<boolean> => {
    if (!enabled) {
      setSnapshot(EMPTY);
      setShowAlert(false);
      return true;
    }
    try {
      const next = await fetchGuestLiveChatUnread();
      applySnapshot(next);
      return true;
    } catch {
      return false;
    }
  }, [enabled, applySnapshot]);

  const acknowledgeSeen = useCallback(async () => {
    if (ackInFlightRef.current) return;
    ackInFlightRef.current = true;
    setShowAlert(false);

    const ackId = snapshotRef.current.latestMessageId;
    if (ackId != null) {
      writeLastAckMessageId(ackId);
      lastAlertedIdRef.current = ackId;
    }

    try {
      await markGuestLiveChatRead();
      const next = await fetchGuestLiveChatUnread();
      applySnapshot(next);
    } catch {
      setSnapshot({
        unreadCount: 0,
        sessionId: snapshotRef.current.sessionId,
        preview: null,
        latestMessageId: null,
      });
    } finally {
      ackInFlightRef.current = false;
    }
  }, [applySnapshot]);

  useEffect(() => {
    if (!enabled) {
      setSnapshot(EMPTY);
      setShowAlert(false);
      delayRef.current = LIVE_CHAT_POLL_BASE_MS;
      return;
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    const tick = async () => {
      if (cancelled) return;
      const ok = await refresh();
      if (cancelled) return;
      delayRef.current = nextPollDelayMs(delayRef.current, ok);
      timer = setTimeout(() => void tick(), delayRef.current);
    };

    void tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [enabled, refresh]);

  const dismissAlert = useCallback(() => {
    void acknowledgeSeen();
  }, [acknowledgeSeen]);

  return {
    unreadCount: snapshot.unreadCount,
    preview: snapshot.preview,
    showAlert,
    dismissAlert,
    acknowledgeSeen,
    refresh,
  };
}
