import { db, liveChatMessagesTable, liveChatSessionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  analyzeGuestMessageForStaff,
  translateStaffMessageForGuest,
  translateText,
} from "./live-chat-ai";
import { canUseLiveChatAi } from "./live-chat-ai-gate";
import {
  getLiveChatWelcomeMessage,
  guestTranslatingExpiry,
  isGuestTyping,
  isStaffTyping,
  resolveGuestLanguage,
  resolveStaffTargetLang,
  staffTypingExpiry,
  staffTranslatingExpiry,
} from "./live-chat-welcome";
import {
  hasPendingGuestTranslation,
  hasPendingStaffTranslation,
  isGuestMessageReadyForStaff,
  isTranslationCached,
  isStaffMessageReadyForGuest,
  langBase,
  resolveTranslationTargetLang,
} from "./live-chat-translate-lang";
import { logger } from "./logger";

type LiveChatMessageRow = typeof liveChatMessagesTable.$inferSelect;

function isLocationMessage(msg: LiveChatMessageRow): boolean {
  return msg.messageType === "location";
}

async function persistTranslation(
  msg: LiveChatMessageRow,
  translatedContent: string,
  translatedForLang: string,
  aiInsight?: string | null,
): Promise<LiveChatMessageRow> {
  const patch: Partial<LiveChatMessageRow> = {
    translatedContent,
    translatedForLang,
  };
  if (aiInsight !== undefined) patch.aiInsight = aiInsight;

  await db
    .update(liveChatMessagesTable)
    .set(patch)
    .where(eq(liveChatMessagesTable.id, msg.id));

  return { ...msg, ...patch };
}

async function persistPassThrough(
  msg: LiveChatMessageRow,
  targetLang: string,
): Promise<LiveChatMessageRow> {
  return persistTranslation(msg, msg.content, targetLang, null);
}

/** Staff/system → guest UI language (auto-detect source text language). */
export async function localizeMessageForGuest(
  msg: LiveChatMessageRow,
  guestUiLocale: string,
  hotelId?: number,
): Promise<LiveChatMessageRow> {
  if (msg.senderRole === "guest" || isLocationMessage(msg)) return msg;

  const target = resolveTranslationTargetLang(guestUiLocale, resolveGuestLanguage(guestUiLocale));
  if (isTranslationCached(msg, target)) return msg;

  if (msg.senderRole === "system") {
    const welcome = getLiveChatWelcomeMessage(target);
    return persistTranslation(msg, welcome, target);
  }

  if (hotelId != null && !(await canUseLiveChatAi(hotelId))) {
    return persistPassThrough(msg, target);
  }

  const translatedContent = await translateStaffMessageForGuest(msg.content, target, hotelId);
  return persistTranslation(msg, translatedContent, target);
}

export async function localizeMessagesForGuest(
  messages: LiveChatMessageRow[],
  guestUiLocale: string,
  hotelId?: number,
): Promise<LiveChatMessageRow[]> {
  return Promise.all(messages.map((msg) => localizeMessageForGuest(msg, guestUiLocale, hotelId)));
}

/** Guest → reception UI language (auto-detect source text language). */
export async function localizeMessageForStaff(
  msg: LiveChatMessageRow,
  staffUiLocale: string,
  hotelId?: number,
): Promise<LiveChatMessageRow> {
  if (msg.senderRole !== "guest" || isLocationMessage(msg)) return msg;

  const staffLang = resolveStaffTargetLang(staffUiLocale);
  if (isTranslationCached(msg, staffLang)) return msg;

  if (hotelId != null && !(await canUseLiveChatAi(hotelId))) {
    return persistPassThrough(msg, staffLang);
  }

  const analysis = await analyzeGuestMessageForStaff(msg.content, staffLang, hotelId);
  return persistTranslation(
    msg,
    analysis.translatedContent,
    staffLang,
    analysis.aiInsight,
  );
}

export async function localizeMessagesForStaff(
  messages: LiveChatMessageRow[],
  staffUiLocale: string,
  hotelId?: number,
): Promise<LiveChatMessageRow[]> {
  return Promise.all(messages.map((msg) => localizeMessageForStaff(msg, staffUiLocale, hotelId)));
}

export async function prepareGuestVisibleMessages(
  messages: LiveChatMessageRow[],
  guestUiLocale: string,
  hotelId?: number,
): Promise<LiveChatMessageRow[]> {
  const aiOn = hotelId == null || (await canUseLiveChatAi(hotelId));

  if (!aiOn) {
    return dedupeMessagesById(messages);
  }

  const localized = await localizeMessagesForGuest(messages, guestUiLocale, hotelId);
  return dedupeMessagesById(
    localized.filter((m) => isStaffMessageReadyForGuest(m, guestUiLocale)),
  );
}

function dedupeMessagesById(messages: LiveChatMessageRow[]): LiveChatMessageRow[] {
  const byId = new Map<number, LiveChatMessageRow>();
  for (const m of messages) byId.set(m.id, m);
  return [...byId.values()].sort((a, b) => a.id - b.id);
}

export function guestSeesStaffTyping(
  staffTypingUntil: Date | string | null | undefined,
  messages: LiveChatMessageRow[],
  guestUiLocale: string,
  aiEnabled = true,
): boolean {
  if (!aiEnabled) return isStaffTyping(staffTypingUntil);
  return (
    isStaffTyping(staffTypingUntil) || hasPendingStaffTranslation(messages, guestUiLocale)
  );
}

export async function prepareStaffVisibleMessages(
  messages: LiveChatMessageRow[],
  staffUiLocale: string,
  hotelId?: number,
): Promise<LiveChatMessageRow[]> {
  const aiOn = hotelId == null || (await canUseLiveChatAi(hotelId));

  if (!aiOn) {
    return dedupeMessagesById(messages);
  }

  return dedupeMessagesById(
    messages.filter((m) => isGuestMessageReadyForStaff(m, staffUiLocale)),
  );
}

export function staffSeesGuestTyping(
  guestTranslatingUntil: Date | string | null | undefined,
  messages: LiveChatMessageRow[],
  staffUiLocale: string,
  aiEnabled = true,
): boolean {
  if (!aiEnabled) return isGuestTyping(guestTranslatingUntil);
  return (
    isGuestTyping(guestTranslatingUntil) ||
    hasPendingGuestTranslation(messages, staffUiLocale)
  );
}

async function clearGuestTranslatingIfIdle(sessionId: number, staffUiLocale: string) {
  const messages = await db
    .select()
    .from(liveChatMessagesTable)
    .where(eq(liveChatMessagesTable.sessionId, sessionId));

  if (!hasPendingGuestTranslation(messages, staffUiLocale)) {
    await db
      .update(liveChatSessionsTable)
      .set({ guestTranslatingUntil: null, updatedAt: new Date() })
      .where(eq(liveChatSessionsTable.id, sessionId));
  }
}

/** Background translation after guest sends — clears guestTranslatingUntil when done. */
export function queueGuestMessageTranslation(
  sessionId: number,
  messageId: number,
  staffUiLocale: string,
  hotelId: number,
): void {
  void (async () => {
    try {
      const [msg] = await db
        .select()
        .from(liveChatMessagesTable)
        .where(eq(liveChatMessagesTable.id, messageId))
        .limit(1);
      if (!msg) return;
      await localizeMessageForStaff(msg, staffUiLocale, hotelId);
    } catch (err) {
      logger.warn({ err, sessionId, messageId }, "live-chat guest translation failed");
    } finally {
      await clearGuestTranslatingIfIdle(sessionId, staffUiLocale);
    }
  })();
}

export function kickoffPendingGuestTranslations(
  sessionId: number,
  messages: LiveChatMessageRow[],
  staffUiLocale: string,
  hotelId: number,
): void {
  void canUseLiveChatAi(hotelId).then((aiOn) => {
    if (!aiOn) return;
    for (const msg of messages) {
      if (msg.senderRole !== "guest" || isLocationMessage(msg)) continue;
      if (isGuestMessageReadyForStaff(msg, staffUiLocale)) continue;
      queueGuestMessageTranslation(sessionId, msg.id, staffUiLocale, hotelId);
    }
  });
}

export async function translateGuestPreview(
  content: string,
  _guestProfileLang: string | null | undefined,
  staffUiLocale: string,
  hotelId?: number,
): Promise<string> {
  if (!content.trim()) return content;
  const staffLang = resolveStaffTargetLang(staffUiLocale);
  return translateText(content, staffLang, null, hotelId);
}

export {
  guestTranslatingExpiry,
  langBase,
  isTranslationCached,
  resolveTranslationTargetLang,
  staffTranslatingExpiry,
  staffTypingExpiry,
};
