import type { LiveChatMessage } from "@/lib/live-chat-api";

/** Merge server/local lists by id — incoming wins, stable chronological order. */
export function mergeLiveChatMessages(
  current: LiveChatMessage[],
  incoming: LiveChatMessage[],
): LiveChatMessage[] {
  const byId = new Map<number, LiveChatMessage>();
  for (const m of current) byId.set(m.id, m);
  for (const m of incoming) byId.set(m.id, m);
  return [...byId.values()].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

export function appendLiveChatMessage(
  current: LiveChatMessage[],
  message: LiveChatMessage,
): LiveChatMessage[] {
  if (current.some((m) => m.id === message.id)) return current;
  return mergeLiveChatMessages(current, [message]);
}
