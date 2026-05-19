import type { Message } from "@workspace/api-client-react";
import type { QuickActionRoute } from "@/lib/chat-api";

interface MessageMeta {
  replyOptions?: string[];
  quickActionRoutes?: QuickActionRoute[];
}

function parseMeta(originalContent: string | null | undefined): MessageMeta | null {
  if (!originalContent) return null;
  try {
    return JSON.parse(originalContent) as MessageMeta;
  } catch {
    return null;
  }
}

export function getReplyOptionsFromMessage(message: Message): string[] {
  const meta = parseMeta(message.originalContent);
  if (!Array.isArray(meta?.replyOptions)) return [];
  return meta.replyOptions
    .filter((x): x is string => typeof x === "string")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 4);
}

export function getQuickActionRoutesFromMessage(message: Message): QuickActionRoute[] {
  const meta = parseMeta(message.originalContent);
  if (!Array.isArray(meta?.quickActionRoutes)) return [];
  return meta.quickActionRoutes.filter(
    (r): r is QuickActionRoute =>
      !!r &&
      typeof r === "object" &&
      typeof r.id === "string" &&
      typeof r.label === "string" &&
      typeof r.href === "string",
  );
}

export function isAiCapacityLimitedMessage(message: Message): boolean {
  return message.category === "ai_capacity_limited";
}
