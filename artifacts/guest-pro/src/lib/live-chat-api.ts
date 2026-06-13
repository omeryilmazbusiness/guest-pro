/**
 * Live chat API client — guest ↔ reception.
 */

export class LiveChatNetworkError extends Error {
  constructor(message = "Network unavailable") {
    super(message);
    this.name = "LiveChatNetworkError";
  }
}

export function isLiveChatNetworkError(err: unknown): err is LiveChatNetworkError {
  return err instanceof LiveChatNetworkError;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem("guestpro_token");
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers as Record<string, string>),
      },
    });
  } catch (err) {
    if (init?.signal?.aborted) throw err;
    throw new LiveChatNetworkError();
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export type LiveChatSenderRole = "guest" | "staff" | "system";
export type LiveChatMessageType = "text" | "location";

export interface LiveChatMessageMetadata {
  lat?: number;
  lng?: number;
  accuracy?: number;
  mapsUrl?: string;
}

export interface LiveChatMessage {
  id: number;
  sessionId: number;
  senderRole: LiveChatSenderRole;
  messageType?: LiveChatMessageType;
  content: string;
  metadata?: LiveChatMessageMetadata | null;
  originalContent?: string;
  language?: string | null;
  aiInsight?: string | null;
  readByStaffAt: string | null;
  readByGuestAt: string | null;
  createdAt: string;
}

export interface LiveChatSessionState {
  id: number;
  status: string;
  staffTyping: boolean;
  guestTyping?: boolean;
  emergencyAt: string | null;
  createdAt: string;
}

export interface LiveChatInboxItem {
  sessionId: number;
  guestId: number;
  roomNumber: string;
  guestFirstName: string | null;
  guestLastName: string | null;
  guestLanguage: string;
  /** Guest UI locale for staff→guest translation (from live session sync). */
  guestUiLocale: string;
  lastMessageAt: string;
  lastMessagePreview: string;
  hasUnread: boolean;
  staffTyping: boolean;
  emergencyAt: string | null;
  emergencyAcknowledged: boolean;
  severity?: "critical" | "warning";
}

export interface LiveChatEmergencyEvent {
  eventId: number;
  sessionId: number;
  guestId: number;
  roomNumber: string;
  guestFirstName: string | null;
  guestLastName: string | null;
  guestLanguage: string;
  guestUiLocale?: string;
  severity?: "critical" | "warning";
  createdAt: string;
}

export interface LiveChatInboxResponse {
  items: LiveChatInboxItem[];
  pendingEmergencies: LiveChatEmergencyEvent[];
  unreadCount?: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export async function startLiveChatSession(language: string): Promise<{
  session: LiveChatSessionState;
  messages: LiveChatMessage[];
  created: boolean;
}> {
  return apiFetch("/api/live-chat/sessions", {
    method: "POST",
    body: JSON.stringify({ language }),
  });
}

export async function syncLiveChatSession(
  sessionId: number,
  language: string,
  signal?: AbortSignal,
): Promise<{
  staffTyping: boolean;
  messages: LiveChatMessage[];
}> {
  const url = new URL(`/api/live-chat/sessions/${sessionId}/sync`, window.location.origin);
  url.searchParams.set("language", language);
  return apiFetch(url.pathname + url.search, { signal });
}

export async function sendLiveChatGuestMessage(
  sessionId: number,
  content: string,
  language: string,
): Promise<LiveChatMessage> {
  return apiFetch(`/api/live-chat/sessions/${sessionId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content, language }),
  });
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function triggerLiveChatEmergency(
  sessionId: number,
  clientEventId: string,
  attempts = 8,
): Promise<{ eventId: number }> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await apiFetch<{ ok: true; eventId: number; deduplicated?: boolean }>(
        `/api/live-chat/sessions/${sessionId}/emergency`,
        {
          method: "POST",
          body: JSON.stringify({ clientEventId }),
        },
      );
      if (res.eventId > 0) return { eventId: res.eventId };
    } catch (err) {
      lastError = err;
      if (i < attempts - 1) await sleep(Math.min(3000, 200 * 2 ** i));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Emergency request failed");
}

export async function fetchLiveChatPendingEmergencies(): Promise<LiveChatEmergencyEvent[]> {
  const res = await apiFetch<{ pendingEmergencies: LiveChatEmergencyEvent[] }>(
    "/api/live-chat/emergencies/pending",
  );
  return res.pendingEmergencies;
}

export async function clearLiveChatSession(
  sessionId: number,
  language: string,
): Promise<{ messages: LiveChatMessage[] }> {
  return apiFetch(`/api/live-chat/sessions/${sessionId}/clear`, {
    method: "POST",
    body: JSON.stringify({ language }),
  });
}

export async function sendLiveChatGuestLocation(
  sessionId: number,
  coords: { lat: number; lng: number; accuracy: number },
  language: string,
): Promise<LiveChatMessage> {
  return apiFetch(`/api/live-chat/sessions/${sessionId}/location`, {
    method: "POST",
    body: JSON.stringify({ ...coords, language }),
  });
}

export async function deleteLiveChatSession(sessionId: number): Promise<void> {
  await apiFetch(`/api/live-chat/sessions/${sessionId}`, { method: "DELETE" });
}

export async function fetchLiveChatInbox(
  locale: string,
  pagination?: { page?: number; limit?: number },
  signal?: AbortSignal,
): Promise<LiveChatInboxResponse> {
  const url = new URL("/api/live-chat/inbox", window.location.origin);
  url.searchParams.set("locale", locale);
  if (pagination?.page != null) url.searchParams.set("page", String(pagination.page));
  if (pagination?.limit != null) url.searchParams.set("limit", String(pagination.limit));
  return apiFetch(url.pathname + url.search, { cache: "no-store", signal });
}

export async function fetchLiveChatMessages(
  sessionId: number,
  locale: string,
  signal?: AbortSignal,
): Promise<{
  session: LiveChatSessionState & { emergencyAcknowledged?: boolean };
  guest: {
    id: number;
    roomNumber: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  messages: LiveChatMessage[];
}> {
  const url = new URL(`/api/live-chat/sessions/${sessionId}/messages`, window.location.origin);
  url.searchParams.set("locale", locale);
  return apiFetch(url.pathname + url.search, { signal });
}

export async function sendLiveChatStaffMessage(
  sessionId: number,
  content: string,
  locale: string,
  guestUiLocale: string,
): Promise<LiveChatMessage> {
  return apiFetch(`/api/live-chat/sessions/${sessionId}/staff-messages`, {
    method: "POST",
    body: JSON.stringify({ content, locale, guestUiLocale, guestLanguage: guestUiLocale }),
  });
}

export async function sendLiveChatStaffTyping(sessionId: number): Promise<void> {
  await apiFetch(`/api/live-chat/sessions/${sessionId}/typing`, { method: "POST" });
}

export async function ackLiveChatEmergencyEvent(eventId: number): Promise<void> {
  await apiFetch(`/api/live-chat/emergencies/${eventId}/ack`, { method: "POST" });
}

export async function ackLiveChatEmergency(sessionId: number): Promise<void> {
  await apiFetch(`/api/live-chat/sessions/${sessionId}/emergency/ack`, { method: "POST" });
}

export async function clearLiveChatSessionStaff(
  sessionId: number,
): Promise<{ messages: LiveChatMessage[] }> {
  return apiFetch(`/api/live-chat/sessions/${sessionId}/staff-clear`, { method: "DELETE" });
}

export interface GuestLiveChatUnreadSnapshot {
  unreadCount: number;
  sessionId: number | null;
  preview: string | null;
  latestMessageId: number | null;
}

export async function fetchGuestLiveChatUnread(): Promise<GuestLiveChatUnreadSnapshot> {
  return apiFetch("/api/live-chat/guest-unread");
}

export async function markGuestLiveChatRead(): Promise<void> {
  await apiFetch("/api/live-chat/guest-read", { method: "POST" });
}
