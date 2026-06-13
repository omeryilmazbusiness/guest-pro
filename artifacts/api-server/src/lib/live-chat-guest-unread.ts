import { db, liveChatMessagesTable, liveChatSessionsTable } from "@workspace/db";
import { and, count, desc, eq, inArray, isNull } from "drizzle-orm";

export interface GuestLiveChatUnreadSnapshot {
  unreadCount: number;
  sessionId: number | null;
  preview: string | null;
  latestMessageId: number | null;
}

export async function getGuestLiveChatUnread(
  guestId: number,
  hotelId: number,
): Promise<GuestLiveChatUnreadSnapshot> {
  const [session] = await db
    .select({ id: liveChatSessionsTable.id })
    .from(liveChatSessionsTable)
    .where(
      and(
        eq(liveChatSessionsTable.guestId, guestId),
        eq(liveChatSessionsTable.hotelId, hotelId),
        eq(liveChatSessionsTable.status, "active"),
      ),
    )
    .limit(1);

  if (!session) {
    return { unreadCount: 0, sessionId: null, preview: null, latestMessageId: null };
  }

  const [countRow] = await db
    .select({ total: count() })
    .from(liveChatMessagesTable)
    .where(
      and(
        eq(liveChatMessagesTable.sessionId, session.id),
        isNull(liveChatMessagesTable.readByGuestAt),
        inArray(liveChatMessagesTable.senderRole, ["staff", "system"]),
      ),
    );

  const unreadCount = Number(countRow?.total ?? 0);
  if (unreadCount === 0) {
    return { unreadCount: 0, sessionId: session.id, preview: null, latestMessageId: null };
  }

  const [latest] = await db
    .select({
      id: liveChatMessagesTable.id,
      content: liveChatMessagesTable.content,
    })
    .from(liveChatMessagesTable)
    .where(
      and(
        eq(liveChatMessagesTable.sessionId, session.id),
        isNull(liveChatMessagesTable.readByGuestAt),
        inArray(liveChatMessagesTable.senderRole, ["staff", "system"]),
      ),
    )
    .orderBy(desc(liveChatMessagesTable.createdAt))
    .limit(1);

  return {
    unreadCount,
    sessionId: session.id,
    preview: latest?.content ?? null,
    latestMessageId: latest?.id ?? null,
  };
}

/** Mark all staff/system messages in the guest's active session as read. */
export async function markGuestStaffMessagesRead(
  guestId: number,
  hotelId: number,
): Promise<{ marked: number; sessionId: number | null }> {
  const [session] = await db
    .select({ id: liveChatSessionsTable.id })
    .from(liveChatSessionsTable)
    .where(
      and(
        eq(liveChatSessionsTable.guestId, guestId),
        eq(liveChatSessionsTable.hotelId, hotelId),
        eq(liveChatSessionsTable.status, "active"),
      ),
    )
    .limit(1);

  if (!session) {
    return { marked: 0, sessionId: null };
  }

  const now = new Date();
  const updated = await db
    .update(liveChatMessagesTable)
    .set({ readByGuestAt: now })
    .where(
      and(
        eq(liveChatMessagesTable.sessionId, session.id),
        isNull(liveChatMessagesTable.readByGuestAt),
        inArray(liveChatMessagesTable.senderRole, ["staff", "system"]),
      ),
    )
    .returning({ id: liveChatMessagesTable.id });

  return { marked: updated.length, sessionId: session.id };
}
