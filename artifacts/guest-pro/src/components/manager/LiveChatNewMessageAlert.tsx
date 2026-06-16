/**
 * Sliding banner when a guest sends a new live-chat message while reception
 * is on any dashboard tab. Click opens the floating chat window.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { useStaffLocale } from "@/hooks/use-staff-locale";
import { useLiveChatInboxBadgeQuery } from "@/hooks/use-live-chat-inbox";
import { useOptionalLiveChatReception } from "@/components/manager/LiveChatReceptionContext";
import type { LiveChatInboxItem } from "@/lib/live-chat-api";

const ALERT_DURATION_MS = 8_000;

interface AlertEntry {
  alertId: string;
  item: LiveChatInboxItem;
  expiresAt: number;
}

function sessionKey(item: LiveChatInboxItem): string {
  return `${item.sessionId}:${item.lastMessageAt}`;
}

function AlertBanner({
  entry,
  onDismiss,
  onClick,
  roomLabel,
}: {
  entry: AlertEntry;
  onDismiss: (alertId: string) => void;
  onClick: () => void;
  roomLabel: string;
}) {
  const { item } = entry;
  const guestName =
    [item.guestFirstName, item.guestLastName].filter(Boolean).join(" ") || "—";

  return (
    <div
      className="pointer-events-auto flex cursor-pointer items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-lg shadow-zinc-900/8 transition-colors hover:border-sky-200 animate-in fade-in slide-in-from-top-2 duration-300"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
    >
      <div className="relative shrink-0">
        <div className="h-2 w-2 animate-pulse rounded-full bg-sky-500" />
      </div>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
        <MessageCircle className="h-4 w-4" strokeWidth={2.25} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
          {roomLabel}
        </p>
        <p className="truncate text-[13px] font-medium text-zinc-800">{guestName}</p>
        <p className="truncate text-[12px] text-zinc-500">
          {item.lastMessagePreview || "—"}
        </p>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDismiss(entry.alertId);
        }}
        className="-mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-zinc-300 transition-all hover:bg-zinc-50 hover:text-zinc-500"
        aria-label="Dismiss"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

export function LiveChatNewMessageAlert({ enabled }: { enabled: boolean }) {
  const { t } = useStaffLocale();
  const reception = useOptionalLiveChatReception();
  const { data } = useLiveChatInboxBadgeQuery({ enabled });
  const [alerts, setAlerts] = useState<AlertEntry[]>([]);
  const knownKeysRef = useRef<Set<string>>(new Set());
  const isInitializedRef = useRef(false);

  const openChat = reception?.openChat;

  useEffect(() => {
    if (!enabled || !data?.items?.length) return;

    const unread = data.items.filter((item) => item.hasUnread);

    if (!isInitializedRef.current) {
      for (const item of unread) knownKeysRef.current.add(sessionKey(item));
      isInitializedRef.current = true;
      return;
    }

    const fresh = unread.filter((item) => !knownKeysRef.current.has(sessionKey(item)));
    if (fresh.length === 0) return;

    for (const item of fresh) knownKeysRef.current.add(sessionKey(item));

    const now = Date.now();
    const next: AlertEntry[] = fresh.map((item) => ({
      alertId: `${item.sessionId}-${item.lastMessageAt}`,
      item,
      expiresAt: now + ALERT_DURATION_MS,
    }));

    setAlerts((prev) => [...prev, ...next].slice(-3));
  }, [data?.items, enabled]);

  useEffect(() => {
    if (alerts.length === 0) return;
    const oldest = alerts[0];
    const remaining = oldest.expiresAt - Date.now();
    if (remaining <= 0) {
      setAlerts((prev) => prev.slice(1));
      return;
    }
    const timer = setTimeout(() => setAlerts((prev) => prev.slice(1)), remaining);
    return () => clearTimeout(timer);
  }, [alerts]);

  const dismiss = useCallback((alertId: string) => {
    setAlerts((prev) => prev.filter((a) => a.alertId !== alertId));
  }, []);

  const handleOpen = useCallback(
    (entry: AlertEntry) => {
      openChat?.(entry.item);
      dismiss(entry.alertId);
    },
    [openChat, dismiss],
  );

  if (!enabled || alerts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-14 z-[205]">
      <div className="mx-auto max-w-2xl space-y-1.5 px-4 pt-2">
        {alerts.map((entry) => (
          <AlertBanner
            key={entry.alertId}
            entry={entry}
            onDismiss={dismiss}
            onClick={() => handleOpen(entry)}
            roomLabel={t.liveChatRoomLabel.replace("{room}", entry.item.roomNumber)}
          />
        ))}
      </div>
    </div>
  );
}
