import type { LiveChatEmergencyEvent } from "@/lib/live-chat-api";

export const LIVE_CHAT_OPEN_SESSION_EVENT = "guestpro:live-chat-open-session";

export function dispatchLiveChatOpenSession(event: LiveChatEmergencyEvent): void {
  window.dispatchEvent(
    new CustomEvent<LiveChatEmergencyEvent>(LIVE_CHAT_OPEN_SESSION_EVENT, { detail: event }),
  );
}

export function onLiveChatOpenSession(
  handler: (event: LiveChatEmergencyEvent) => void,
): () => void {
  const listener = (e: Event) => {
    handler((e as CustomEvent<LiveChatEmergencyEvent>).detail);
  };
  window.addEventListener(LIVE_CHAT_OPEN_SESSION_EVENT, listener);
  return () => window.removeEventListener(LIVE_CHAT_OPEN_SESSION_EVENT, listener);
}
