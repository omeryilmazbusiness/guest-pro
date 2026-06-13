/**
 * Live chat — guest ↔ reception real-time messaging.
 */
import { Router, type Request, type Response, type NextFunction } from "express";
import {
  db,
  liveChatSessionsTable,
  liveChatMessagesTable,
  liveChatEmergencyEventsTable,
  guestsTable,
} from "@workspace/db";
import { eq, and, desc, asc, isNull, inArray, count, sql } from "drizzle-orm";
import { requireGuest, requireStaff } from "../middlewares/requireAuth";
import { canAccessGuestOperations } from "../lib/staff-scope";
import {
  getLiveChatWelcomeMessage,
  guestTranslatingExpiry,
  isStaffTyping,
  resolveGuestLanguage,
  resolveStaffTargetLang,
  staffTypingExpiry,
  staffTranslatingExpiry,
} from "../lib/live-chat-welcome";
import {
  guestSeesStaffTyping,
  kickoffPendingGuestTranslations,
  localizeMessageForGuest,
  prepareGuestVisibleMessages,
  prepareStaffVisibleMessages,
  queueGuestMessageTranslation,
  staffSeesGuestTyping,
  translateGuestPreview,
} from "../lib/live-chat-translate";
import {
  normalizeGuestUiLocaleHint,
  resolveGuestUiLocaleForSession,
} from "../lib/live-chat-guest-locale";
import { canUseLiveChatAi } from "../lib/live-chat-ai-gate";
import { resolveTranslationTargetLang } from "../lib/live-chat-translate-lang";
import { logger } from "../lib/logger";
import { getGuestLiveChatUnread, markGuestStaffMessagesRead } from "../lib/live-chat-guest-unread";

const router = Router();

function toIso(value: Date | string | null | undefined): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

type LiveChatRouteHandler = (req: Request, res: Response) => Promise<void>;

function withLiveChatHandler(handler: LiveChatRouteHandler) {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      await handler(req, res);
    } catch (err) {
      logger.error({ err, path: req.path, method: req.method }, "live-chat route failed");
      if (!res.headersSent) {
        res.status(500).json({ error: "Live chat request failed" });
      }
    }
  };
}

function requireLiveChatStaff(req: Request, res: Response, next: NextFunction): void {
  requireStaff(req, res, () => {
    if (!req.session || !canAccessGuestOperations(req.session)) {
      res.status(403).json({ error: "Reception access required" });
      return;
    }
    next();
  });
}

function serializeMessageForGuest(msg: typeof liveChatMessagesTable.$inferSelect) {
  const display =
    msg.senderRole === "guest"
      ? msg.content
      : msg.translatedContent?.trim() || msg.content;
  return {
    id: msg.id,
    sessionId: msg.sessionId,
    senderRole: msg.senderRole,
    messageType: msg.messageType ?? "text",
    content: display,
    metadata: msg.metadata ?? null,
    originalContent: msg.senderRole === "staff" ? msg.content : undefined,
    language: msg.language,
    readByStaffAt: toIso(msg.readByStaffAt),
    readByGuestAt: toIso(msg.readByGuestAt),
    createdAt: toIso(msg.createdAt) ?? new Date().toISOString(),
  };
}

function serializeMessageForStaff(msg: typeof liveChatMessagesTable.$inferSelect) {
  const display =
    msg.senderRole === "staff" || msg.senderRole === "system"
      ? msg.content
      : msg.translatedContent?.trim() || msg.content;
  return {
    id: msg.id,
    sessionId: msg.sessionId,
    senderRole: msg.senderRole,
    messageType: msg.messageType ?? "text",
    content: display,
    metadata: msg.metadata ?? null,
    originalContent: msg.senderRole === "guest" ? msg.content : undefined,
    aiInsight: msg.senderRole === "guest" ? msg.aiInsight : null,
    language: msg.language,
    readByStaffAt: toIso(msg.readByStaffAt),
    readByGuestAt: toIso(msg.readByGuestAt),
    createdAt: toIso(msg.createdAt) ?? new Date().toISOString(),
  };
}

const INBOX_PAGE_SIZE_DEFAULT = 50;
const INBOX_PAGE_SIZE_MAX = 50;

function parseInboxPagination(query: Request["query"]) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(
    INBOX_PAGE_SIZE_MAX,
    Math.max(1, Number(query.limit) || INBOX_PAGE_SIZE_DEFAULT),
  );
  return { page, limit, offset: (page - 1) * limit };
}

async function buildInboxItem(
  session: typeof liveChatSessionsTable.$inferSelect,
  guest: typeof guestsTable.$inferSelect,
  staffLocale: string,
) {
  const [lastMsg] = await db
    .select()
    .from(liveChatMessagesTable)
    .where(eq(liveChatMessagesTable.sessionId, session.id))
    .orderBy(desc(liveChatMessagesTable.createdAt))
    .limit(1);

  const unreadGuest = await db
    .select({ id: liveChatMessagesTable.id })
    .from(liveChatMessagesTable)
    .where(
      and(
        eq(liveChatMessagesTable.sessionId, session.id),
        eq(liveChatMessagesTable.senderRole, "guest"),
        isNull(liveChatMessagesTable.readByStaffAt),
      ),
    )
    .limit(1);

  let lastPreview = lastMsg?.content ?? "";
  if (lastMsg?.messageType === "location") {
    lastPreview = "📍 Location";
  } else if (lastMsg && lastMsg.senderRole === "guest") {
    lastPreview = await translateGuestPreview(
      lastMsg.content,
      guest.language,
      staffLocale,
      session.hotelId,
    );
  }

  return {
    sessionId: session.id,
    guestId: guest.id,
    roomNumber: guest.roomNumber,
    guestFirstName: guest.firstName,
    guestLastName: guest.lastName,
    guestLanguage: guest.language ?? "en",
    guestUiLocale: resolveGuestUiLocaleForSession(session, undefined, guest.language),
    lastMessageAt: session.lastMessageAt?.toISOString() ?? session.createdAt.toISOString(),
    lastMessagePreview: lastPreview,
    hasUnread: unreadGuest.length > 0,
    staffTyping: isStaffTyping(session.staffTypingUntil),
    emergencyAt: session.emergencyAt?.toISOString() ?? null,
    emergencyAcknowledged: !!session.emergencyAcknowledgedAt,
  };
}

async function countInboxUnreadSessions(hotelId: number): Promise<number> {
  const [row] = await db
    .select({ total: count(sql`DISTINCT ${liveChatMessagesTable.sessionId}`) })
    .from(liveChatMessagesTable)
    .innerJoin(
      liveChatSessionsTable,
      eq(liveChatMessagesTable.sessionId, liveChatSessionsTable.id),
    )
    .where(
      and(
        eq(liveChatSessionsTable.hotelId, hotelId),
        eq(liveChatSessionsTable.status, "active"),
        eq(liveChatMessagesTable.senderRole, "guest"),
        isNull(liveChatMessagesTable.readByStaffAt),
      ),
    );
  return Number(row?.total ?? 0);
}

async function loadGuestSession(guestId: number, hotelId: number, sessionId: number) {
  const [session] = await db
    .select()
    .from(liveChatSessionsTable)
    .where(
      and(
        eq(liveChatSessionsTable.id, sessionId),
        eq(liveChatSessionsTable.guestId, guestId),
        eq(liveChatSessionsTable.hotelId, hotelId),
      ),
    );
  return session ?? null;
}

async function loadStaffSession(hotelId: number, sessionId: number) {
  const [session] = await db
    .select()
    .from(liveChatSessionsTable)
    .where(
      and(
        eq(liveChatSessionsTable.id, sessionId),
        eq(liveChatSessionsTable.hotelId, hotelId),
      ),
    );
  return session ?? null;
}

function resolveGuestUiLocale(
  hintLang: string | undefined,
  session: typeof liveChatSessionsTable.$inferSelect,
  guestProfileLang?: string | null,
): string {
  return resolveGuestUiLocaleForSession(session, hintLang, guestProfileLang);
}

async function touchGuestUiLocale(sessionId: number, guestUiLocale: string) {
  const code = normalizeGuestUiLocaleHint(guestUiLocale) ?? resolveTranslationTargetLang(guestUiLocale);
  await db
    .update(liveChatSessionsTable)
    .set({ lastGuestUiLocale: code, updatedAt: new Date() })
    .where(eq(liveChatSessionsTable.id, sessionId));
}

async function touchStaffUiLocale(sessionId: number, staffUiLocale: string) {
  const code = resolveStaffTargetLang(staffUiLocale);
  await db
    .update(liveChatSessionsTable)
    .set({ lastStaffUiLocale: code, updatedAt: new Date() })
    .where(eq(liveChatSessionsTable.id, sessionId));
}

async function getOrCreateActiveSession(guestId: number, hotelId: number, guestLang: string) {
  const [existing] = await db
    .select()
    .from(liveChatSessionsTable)
    .where(
      and(
        eq(liveChatSessionsTable.guestId, guestId),
        eq(liveChatSessionsTable.hotelId, hotelId),
        eq(liveChatSessionsTable.status, "active"),
      ),
    )
    .orderBy(desc(liveChatSessionsTable.createdAt))
    .limit(1);

  if (existing) {
    await touchGuestUiLocale(existing.id, guestLang);
    const [updated] = await db
      .select()
      .from(liveChatSessionsTable)
      .where(eq(liveChatSessionsTable.id, existing.id));
    return { session: updated ?? existing, created: false };
  }

  const uiCode =
    normalizeGuestUiLocaleHint(guestLang) ?? resolveTranslationTargetLang(guestLang);
  const [session] = await db
    .insert(liveChatSessionsTable)
    .values({
      guestId,
      hotelId,
      status: "active",
      lastMessageAt: new Date(),
      lastGuestUiLocale: uiCode,
    })
    .returning();

  const welcome = getLiveChatWelcomeMessage(guestLang);
  await db.insert(liveChatMessagesTable).values({
    sessionId: session!.id,
    senderRole: "system",
    content: welcome,
    language: resolveGuestLanguage(guestLang),
    readByGuestAt: null,
  });

  return { session: session!, created: true };
}

async function clearGuestSessionMessages(
  guestId: number,
  hotelId: number,
  sessionId: number,
  language: string,
) {
  const session = await loadGuestSession(guestId, hotelId, sessionId);
  if (!session) return null;

  await db.delete(liveChatMessagesTable).where(eq(liveChatMessagesTable.sessionId, sessionId));

  const welcome = getLiveChatWelcomeMessage(language);
  const [welcomeMsg] = await db
    .insert(liveChatMessagesTable)
    .values({
      sessionId,
      senderRole: "system",
      content: welcome,
      language: resolveGuestLanguage(language),
      readByGuestAt: null,
    })
    .returning();

  await db
    .update(liveChatSessionsTable)
    .set({ lastMessageAt: new Date(), staffTypingUntil: null, guestTranslatingUntil: null, updatedAt: new Date() })
    .where(eq(liveChatSessionsTable.id, sessionId));

  return welcomeMsg ?? null;
}

async function fetchPendingEmergenciesForHotel(hotelId: number) {
  const rows = await db
    .select({
      event: liveChatEmergencyEventsTable,
      session: liveChatSessionsTable,
      guest: guestsTable,
    })
    .from(liveChatEmergencyEventsTable)
    .innerJoin(
      liveChatSessionsTable,
      eq(liveChatEmergencyEventsTable.sessionId, liveChatSessionsTable.id),
    )
    .innerJoin(guestsTable, eq(liveChatEmergencyEventsTable.guestId, guestsTable.id))
    .where(
      and(
        eq(liveChatEmergencyEventsTable.hotelId, hotelId),
        isNull(liveChatEmergencyEventsTable.acknowledgedAt),
      ),
    )
    .orderBy(asc(liveChatEmergencyEventsTable.createdAt));

  return rows.map(({ event, session, guest }) => ({
    eventId: event.id,
    sessionId: session.id,
    guestId: guest.id,
    roomNumber: guest.roomNumber,
    guestFirstName: guest.firstName,
    guestLastName: guest.lastName,
    guestLanguage: guest.language ?? "en",
    guestUiLocale: resolveGuestUiLocaleForSession(session, undefined, guest.language),
    severity: event.severity ?? "critical",
    createdAt: event.createdAt.toISOString(),
  }));
}

// ── Guest ─────────────────────────────────────────────────────────────────────

/** GET /live-chat/guest-unread — staff messages not yet read (does not mark read) */
router.get("/live-chat/guest-unread", requireGuest, withLiveChatHandler(async (req, res) => {
  const guestId = req.session!.guestId!;
  const hotelId = req.session!.hotelId;
  const snapshot = await getGuestLiveChatUnread(guestId, hotelId);
  res.json(snapshot);
}));

/** POST /live-chat/guest-read — mark reception messages seen (clears badge/alert) */
router.post("/live-chat/guest-read", requireGuest, withLiveChatHandler(async (req, res) => {
  const guestId = req.session!.guestId!;
  const hotelId = req.session!.hotelId;
  const result = await markGuestStaffMessagesRead(guestId, hotelId);
  res.json({ ok: true, ...result });
}));

/** POST /live-chat/sessions — start or resume active session */
router.post("/live-chat/sessions", requireGuest, withLiveChatHandler(async (req, res) => {
  const guestId = req.session!.guestId!;
  const hotelId = req.session!.hotelId;
  const languageRaw = typeof req.body?.language === "string" ? req.body.language : "en";

  const { session, created } = await getOrCreateActiveSession(guestId, hotelId, languageRaw);

  const messages = await db
    .select()
    .from(liveChatMessagesTable)
    .where(eq(liveChatMessagesTable.sessionId, session.id))
    .orderBy(asc(liveChatMessagesTable.createdAt));

  const guestLang = resolveGuestUiLocale(languageRaw, session, undefined);
  const visible = await prepareGuestVisibleMessages(messages, guestLang, hotelId);
  const aiOn = await canUseLiveChatAi(hotelId);

  res.json({
    session: {
      id: session.id,
      status: session.status,
      staffTyping: guestSeesStaffTyping(session.staffTypingUntil, messages, guestLang, aiOn),
      emergencyAt: session.emergencyAt?.toISOString() ?? null,
      createdAt: session.createdAt.toISOString(),
    },
    messages: visible.map(serializeMessageForGuest),
    created,
  });
}));

/** GET /live-chat/sessions/:id/sync — poll messages + typing state */
router.get("/live-chat/sessions/:id/sync", requireGuest, withLiveChatHandler(async (req, res) => {
  const guestId = req.session!.guestId!;
  const hotelId = req.session!.hotelId;
  const sessionId = Number(req.params.id);
  if (!Number.isFinite(sessionId)) {
    res.status(400).json({ error: "Invalid session ID" });
    return;
  }

  const guestLangRaw =
    typeof req.query.language === "string"
      ? req.query.language
      : typeof req.query.locale === "string"
        ? req.query.locale
        : "en";

  const session = await loadGuestSession(guestId, hotelId, sessionId);
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  await touchGuestUiLocale(sessionId, guestLangRaw);
  const guestLang =
    normalizeGuestUiLocaleHint(guestLangRaw) ??
    normalizeGuestUiLocaleHint(session.lastGuestUiLocale) ??
    "en";

  // Mark staff/system messages as read by guest when guest polls
  await db
    .update(liveChatMessagesTable)
    .set({ readByGuestAt: new Date() })
    .where(
      and(
        eq(liveChatMessagesTable.sessionId, sessionId),
        isNull(liveChatMessagesTable.readByGuestAt),
        inArray(liveChatMessagesTable.senderRole, ["staff", "system"]),
      ),
    );

  const messages = await db
    .select()
    .from(liveChatMessagesTable)
    .where(eq(liveChatMessagesTable.sessionId, sessionId))
    .orderBy(asc(liveChatMessagesTable.createdAt));

  const visible = await prepareGuestVisibleMessages(messages, guestLang, hotelId);
  const aiOn = await canUseLiveChatAi(hotelId);

  res.json({
    staffTyping: guestSeesStaffTyping(session.staffTypingUntil, messages, guestLang, aiOn),
    messages: visible.map(serializeMessageForGuest),
  });
}));

/** POST /live-chat/sessions/:id/messages — guest sends message */
router.post("/live-chat/sessions/:id/messages", requireGuest, withLiveChatHandler(async (req, res) => {
  const guestId = req.session!.guestId!;
  const hotelId = req.session!.hotelId;
  const sessionId = Number(req.params.id);
  const content = typeof req.body?.content === "string" ? req.body.content.trim() : "";
  const language = typeof req.body?.language === "string" ? req.body.language : "en";

  if (!Number.isFinite(sessionId) || !content) {
    res.status(400).json({ error: "content required" });
    return;
  }

  const session = await loadGuestSession(guestId, hotelId, sessionId);
  if (!session || session.status !== "active") {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const [message] = await db
    .insert(liveChatMessagesTable)
    .values({
      sessionId,
      senderRole: "guest",
      content,
      language: resolveGuestLanguage(language),
    })
    .returning();

  const staffLang = resolveStaffTargetLang(session.lastStaffUiLocale ?? "tr");
  const aiOn = await canUseLiveChatAi(hotelId);
  const guestTranslatingPatch = aiOn ? { guestTranslatingUntil: guestTranslatingExpiry() } : {};

  await db
    .update(liveChatSessionsTable)
    .set({
      lastMessageAt: new Date(),
      ...guestTranslatingPatch,
      updatedAt: new Date(),
    })
    .where(eq(liveChatSessionsTable.id, sessionId));

  if (aiOn) {
    queueGuestMessageTranslation(sessionId, message!.id, staffLang, hotelId);
  }

  res.status(201).json(serializeMessageForGuest(message!));
}));

/** POST /live-chat/sessions/:id/location — guest shares live location */
router.post(
  "/live-chat/sessions/:id/location",
  requireGuest,
  withLiveChatHandler(async (req, res) => {
    const guestId = req.session!.guestId!;
    const hotelId = req.session!.hotelId;
    const sessionId = Number(req.params.id);
    const lat = Number(req.body?.lat);
    const lng = Number(req.body?.lng);
    const accuracy = Number(req.body?.accuracy ?? 0);
    const language = typeof req.body?.language === "string" ? req.body.language : "en";

    if (!Number.isFinite(sessionId) || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      res.status(400).json({ error: "lat and lng required" });
      return;
    }

    const session = await loadGuestSession(guestId, hotelId, sessionId);
    if (!session || session.status !== "active") {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    const mapsUrl = `https://maps.google.com/?q=${lat},${lng}`;
    const content = `📍 ${lat.toFixed(5)}, ${lng.toFixed(5)}`;

    const [message] = await db
      .insert(liveChatMessagesTable)
      .values({
        sessionId,
        senderRole: "guest",
        messageType: "location",
        content,
        language: resolveGuestLanguage(language),
        metadata: { lat, lng, accuracy, mapsUrl },
      })
      .returning();

    await db
      .update(liveChatSessionsTable)
      .set({ lastMessageAt: new Date(), updatedAt: new Date() })
      .where(eq(liveChatSessionsTable.id, sessionId));

    res.status(201).json(serializeMessageForGuest(message!));
  }),
);

/** POST /live-chat/sessions/:id/clear — guest clears conversation */
router.post("/live-chat/sessions/:id/clear", requireGuest, withLiveChatHandler(async (req, res) => {
  const guestId = req.session!.guestId!;
  const hotelId = req.session!.hotelId;
  const sessionId = Number(req.params.id);
  const language =
    typeof req.body?.language === "string"
      ? req.body.language
      : typeof req.query.language === "string"
        ? req.query.language
        : "en";

  if (!Number.isFinite(sessionId)) {
    res.status(400).json({ error: "Invalid session ID" });
    return;
  }

  const welcomeMsg = await clearGuestSessionMessages(guestId, hotelId, sessionId, language);
  if (!welcomeMsg) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  logger.info({ sessionId, guestId }, "live chat cleared by guest");
  res.json({ messages: [serializeMessageForGuest(welcomeMsg)] });
}));

/** DELETE /live-chat/sessions/:id/clear — guest clears conversation */
router.delete("/live-chat/sessions/:id/clear", requireGuest, withLiveChatHandler(async (req, res) => {
  const guestId = req.session!.guestId!;
  const hotelId = req.session!.hotelId;
  const sessionId = Number(req.params.id);
  const language = typeof req.query.language === "string" ? req.query.language : "en";

  if (!Number.isFinite(sessionId)) {
    res.status(400).json({ error: "Invalid session ID" });
    return;
  }

  const welcomeMsg = await clearGuestSessionMessages(guestId, hotelId, sessionId, language);
  if (!welcomeMsg) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  logger.info({ sessionId, guestId }, "live chat cleared by guest");
  res.json({ messages: [serializeMessageForGuest(welcomeMsg)] });
}));

/** POST /live-chat/sessions/:id/emergency */
router.post("/live-chat/sessions/:id/emergency", requireGuest, withLiveChatHandler(async (req, res) => {
  const guestId = req.session!.guestId!;
  const hotelId = req.session!.hotelId;
  const sessionId = Number(req.params.id);

  if (!Number.isFinite(sessionId)) {
    res.status(400).json({ error: "Invalid session ID" });
    return;
  }

  const session = await loadGuestSession(guestId, hotelId, sessionId);
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const clientEventId =
    typeof req.body?.clientEventId === "string" ? req.body.clientEventId.trim() : null;

  if (clientEventId) {
    const [existing] = await db
      .select()
      .from(liveChatEmergencyEventsTable)
      .where(
        and(
          eq(liveChatEmergencyEventsTable.guestId, guestId),
          eq(liveChatEmergencyEventsTable.clientEventId, clientEventId),
        ),
      );
    if (existing) {
      res.status(201).json({ ok: true, eventId: existing.id, deduplicated: true });
      return;
    }
  }

  const now = new Date();
  const [event] = await db
    .insert(liveChatEmergencyEventsTable)
    .values({
      sessionId,
      hotelId,
      guestId,
      clientEventId: clientEventId || null,
    })
    .returning();

  await db
    .update(liveChatSessionsTable)
    .set({
      emergencyAt: now,
      emergencyAcknowledgedAt: null,
      updatedAt: now,
    })
    .where(eq(liveChatSessionsTable.id, sessionId));

  logger.info({ sessionId, guestId, hotelId, eventId: event!.id }, "live chat emergency triggered");
  res.status(201).json({ ok: true, eventId: event!.id });
}));

// ── Staff (reception) ─────────────────────────────────────────────────────────

/** GET /live-chat/inbox */
router.get("/live-chat/inbox", requireLiveChatStaff, withLiveChatHandler(async (req, res) => {
  const hotelId = req.session!.hotelId;
  const staffLocale = typeof req.query.locale === "string" ? req.query.locale : "tr";
  const { page, limit, offset } = parseInboxPagination(req.query);

  const [totalRow] = await db
    .select({ total: count() })
    .from(liveChatSessionsTable)
    .where(
      and(
        eq(liveChatSessionsTable.hotelId, hotelId),
        eq(liveChatSessionsTable.status, "active"),
      ),
    );

  const total = Number(totalRow?.total ?? 0);
  const unreadCount = await countInboxUnreadSessions(hotelId);

  const sessions = await db
    .select({
      session: liveChatSessionsTable,
      guest: guestsTable,
    })
    .from(liveChatSessionsTable)
    .innerJoin(guestsTable, eq(liveChatSessionsTable.guestId, guestsTable.id))
    .where(
      and(
        eq(liveChatSessionsTable.hotelId, hotelId),
        eq(liveChatSessionsTable.status, "active"),
      ),
    )
    .orderBy(desc(liveChatSessionsTable.lastMessageAt))
    .limit(limit)
    .offset(offset);

  const items = await Promise.all(
    sessions.map(({ session, guest }) => buildInboxItem(session, guest, staffLocale)),
  );

  const pendingEmergencies = await fetchPendingEmergenciesForHotel(hotelId);

  res.json({
    items,
    pendingEmergencies,
    unreadCount,
    pagination: {
      page,
      limit,
      total,
      hasMore: offset + items.length < total,
    },
  });
}));

/** GET /live-chat/emergencies/pending — lightweight poll for urgent alerts */
router.get(
  "/live-chat/emergencies/pending",
  requireLiveChatStaff,
  withLiveChatHandler(async (req, res) => {
    const hotelId = req.session!.hotelId;
    const pendingEmergencies = await fetchPendingEmergenciesForHotel(hotelId);
    res.json({ pendingEmergencies });
  }),
);

/** GET /live-chat/sessions/:id/messages — staff view */
router.get("/live-chat/sessions/:id/messages", requireLiveChatStaff, withLiveChatHandler(async (req, res) => {
  const hotelId = req.session!.hotelId;
  const sessionId = Number(req.params.id);
  const staffLocale = typeof req.query.locale === "string" ? req.query.locale : "tr";

  const session = await loadStaffSession(hotelId, sessionId);
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  await touchStaffUiLocale(sessionId, staffLocale);

  const [guest] = await db
    .select()
    .from(guestsTable)
    .where(eq(guestsTable.id, session.guestId));

  const messages = await db
    .select()
    .from(liveChatMessagesTable)
    .where(eq(liveChatMessagesTable.sessionId, sessionId))
    .orderBy(asc(liveChatMessagesTable.createdAt));

  kickoffPendingGuestTranslations(sessionId, messages, staffLocale, hotelId);
  const visible = await prepareStaffVisibleMessages(messages, staffLocale, hotelId);
  const aiOn = await canUseLiveChatAi(hotelId);

  // Mark guest messages as read by staff
  await db
    .update(liveChatMessagesTable)
    .set({ readByStaffAt: new Date() })
    .where(
      and(
        eq(liveChatMessagesTable.sessionId, sessionId),
        eq(liveChatMessagesTable.senderRole, "guest"),
        isNull(liveChatMessagesTable.readByStaffAt),
      ),
    );

  res.json({
    session: {
      id: session.id,
      status: session.status,
      staffTyping: isStaffTyping(session.staffTypingUntil),
      guestTyping: staffSeesGuestTyping(session.guestTranslatingUntil, messages, staffLocale, aiOn),
      emergencyAt: session.emergencyAt?.toISOString() ?? null,
      emergencyAcknowledged: !!session.emergencyAcknowledgedAt,
    },
    guest: guest
      ? {
          id: guest.id,
          roomNumber: guest.roomNumber,
          firstName: guest.firstName,
          lastName: guest.lastName,
        }
      : null,
    messages: visible.map(serializeMessageForStaff),
    staffLocale: resolveStaffTargetLang(staffLocale),
  });
}));

/** POST /live-chat/sessions/:id/staff-messages — staff reply */
router.post(
  "/live-chat/sessions/:id/staff-messages",
  requireLiveChatStaff,
  withLiveChatHandler(async (req, res) => {
    const hotelId = req.session!.hotelId;
    const staffUserId = req.session!.userId;
    const sessionId = Number(req.params.id);
    const content = typeof req.body?.content === "string" ? req.body.content.trim() : "";
    const staffLocale = typeof req.body?.locale === "string" ? req.body.locale : "tr";

    if (!Number.isFinite(sessionId) || !content) {
      res.status(400).json({ error: "content required" });
      return;
    }

    const session = await loadStaffSession(hotelId, sessionId);
    if (!session || session.status !== "active") {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    const [guest] = await db
      .select({ language: guestsTable.language })
      .from(guestsTable)
      .where(eq(guestsTable.id, session.guestId))
      .limit(1);

    const hintLocale =
      typeof req.body?.guestUiLocale === "string"
        ? req.body.guestUiLocale
        : typeof req.body?.guestLanguage === "string"
          ? req.body.guestLanguage
          : undefined;

    const [freshSession] = await db
      .select()
      .from(liveChatSessionsTable)
      .where(eq(liveChatSessionsTable.id, sessionId))
      .limit(1);

    const guestUiLang = resolveGuestUiLocale(
      hintLocale,
      freshSession ?? session,
      guest?.language,
    );

    await touchStaffUiLocale(sessionId, staffLocale);

    const aiOn = await canUseLiveChatAi(hotelId);
    if (aiOn) {
      await db
        .update(liveChatSessionsTable)
        .set({ staffTypingUntil: staffTranslatingExpiry(), updatedAt: new Date() })
        .where(eq(liveChatSessionsTable.id, sessionId));
    }

    const staffLang = resolveStaffTargetLang(staffLocale);

    const [message] = await db
      .insert(liveChatMessagesTable)
      .values({
        sessionId,
        senderRole: "staff",
        staffUserId,
        content,
        language: staffLang,
      })
      .returning();

    try {
      const localized = await localizeMessageForGuest(message!, guestUiLang, hotelId);
      await db
        .update(liveChatSessionsTable)
        .set({
          lastMessageAt: new Date(),
          staffTypingUntil: null,
          updatedAt: new Date(),
        })
        .where(eq(liveChatSessionsTable.id, sessionId));

      res.status(201).json(serializeMessageForStaff(localized));
    } catch (err) {
      await db
        .update(liveChatSessionsTable)
        .set({ staffTypingUntil: null, updatedAt: new Date() })
        .where(eq(liveChatSessionsTable.id, sessionId));
      throw err;
    }
  }),
);

/** DELETE /live-chat/sessions/:id — staff closes/deletes chat session */
router.delete(
  "/live-chat/sessions/:id",
  requireLiveChatStaff,
  withLiveChatHandler(async (req, res) => {
    const hotelId = req.session!.hotelId;
    const sessionId = Number(req.params.id);

    if (!Number.isFinite(sessionId)) {
      res.status(400).json({ error: "Invalid session ID" });
      return;
    }

    const session = await loadStaffSession(hotelId, sessionId);
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    await db
      .update(liveChatSessionsTable)
      .set({ status: "closed", updatedAt: new Date() })
      .where(eq(liveChatSessionsTable.id, sessionId));

    logger.info({ sessionId, hotelId }, "live chat session closed by staff");
    res.json({ ok: true });
  }),
);

/** DELETE /live-chat/sessions/:id/staff-clear — staff clears conversation */
router.delete(
  "/live-chat/sessions/:id/staff-clear",
  requireLiveChatStaff,
  withLiveChatHandler(async (req, res) => {
    const hotelId = req.session!.hotelId;
    const sessionId = Number(req.params.id);

    const session = await loadStaffSession(hotelId, sessionId);
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    const [guest] = await db
      .select()
      .from(guestsTable)
      .where(eq(guestsTable.id, session.guestId));

    const guestLang = guest?.language ?? "en";

    await db.delete(liveChatMessagesTable).where(eq(liveChatMessagesTable.sessionId, sessionId));

    const welcome = getLiveChatWelcomeMessage(guestLang);
    const [welcomeMsg] = await db
      .insert(liveChatMessagesTable)
      .values({
        sessionId,
        senderRole: "system",
        content: welcome,
        language: resolveGuestLanguage(guestLang),
        readByGuestAt: null,
      })
      .returning();

    await db
      .update(liveChatSessionsTable)
      .set({ lastMessageAt: new Date(), staffTypingUntil: null, guestTranslatingUntil: null, updatedAt: new Date() })
      .where(eq(liveChatSessionsTable.id, sessionId));

    logger.info({ sessionId, hotelId }, "live chat cleared by staff");
    res.json({ messages: [serializeMessageForStaff(welcomeMsg!)] });
  }),
);

/** POST /live-chat/sessions/:id/typing */
router.post("/live-chat/sessions/:id/typing", requireLiveChatStaff, withLiveChatHandler(async (req, res) => {
  const hotelId = req.session!.hotelId;
  const sessionId = Number(req.params.id);

  const session = await loadStaffSession(hotelId, sessionId);
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  await db
    .update(liveChatSessionsTable)
    .set({ staffTypingUntil: staffTypingExpiry(), updatedAt: new Date() })
    .where(eq(liveChatSessionsTable.id, sessionId));

  res.json({ ok: true });
}));

/** POST /live-chat/emergencies/:eventId/ack */
router.post(
  "/live-chat/emergencies/:eventId/ack",
  requireLiveChatStaff,
  withLiveChatHandler(async (req, res) => {
    const hotelId = req.session!.hotelId;
    const eventId = Number(req.params.eventId);

    if (!Number.isFinite(eventId)) {
      res.status(400).json({ error: "Invalid event ID" });
      return;
    }

    const [event] = await db
      .select()
      .from(liveChatEmergencyEventsTable)
      .where(
        and(
          eq(liveChatEmergencyEventsTable.id, eventId),
          eq(liveChatEmergencyEventsTable.hotelId, hotelId),
        ),
      );

    if (!event) {
      res.status(404).json({ error: "Emergency event not found" });
      return;
    }

    if (!event.acknowledgedAt) {
      await db
        .update(liveChatEmergencyEventsTable)
        .set({ acknowledgedAt: new Date() })
        .where(eq(liveChatEmergencyEventsTable.id, eventId));
    }

    const [remaining] = await db
      .select({ id: liveChatEmergencyEventsTable.id })
      .from(liveChatEmergencyEventsTable)
      .where(
        and(
          eq(liveChatEmergencyEventsTable.sessionId, event.sessionId),
          isNull(liveChatEmergencyEventsTable.acknowledgedAt),
        ),
      )
      .limit(1);

    if (!remaining) {
      await db
        .update(liveChatSessionsTable)
        .set({ emergencyAcknowledgedAt: new Date(), updatedAt: new Date() })
        .where(eq(liveChatSessionsTable.id, event.sessionId));
    }

    res.json({ ok: true });
  }),
);

/** POST /live-chat/sessions/:id/emergency/ack — legacy session-level ack */
router.post(
  "/live-chat/sessions/:id/emergency/ack",
  requireLiveChatStaff,
  withLiveChatHandler(async (req, res) => {
    const hotelId = req.session!.hotelId;
    const sessionId = Number(req.params.id);

    const session = await loadStaffSession(hotelId, sessionId);
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    const now = new Date();
    await db
      .update(liveChatEmergencyEventsTable)
      .set({ acknowledgedAt: now })
      .where(
        and(
          eq(liveChatEmergencyEventsTable.sessionId, sessionId),
          eq(liveChatEmergencyEventsTable.hotelId, hotelId),
          isNull(liveChatEmergencyEventsTable.acknowledgedAt),
        ),
      );

    await db
      .update(liveChatSessionsTable)
      .set({ emergencyAcknowledgedAt: now, updatedAt: now })
      .where(eq(liveChatSessionsTable.id, sessionId));

    res.json({ ok: true });
  }),
);

export default router;
