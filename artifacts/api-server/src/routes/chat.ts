import { Router } from "express";
import type { IRouter } from "express";
import { db, chatSessionsTable, messagesTable, guestsTable, dailyUsageTable } from "@workspace/db";
import { eq, and, asc, count } from "drizzle-orm";
import { requireGuest } from "../middlewares/requireAuth";
import { generateConciergeResponse, generateConversationSummary } from "../lib/gemini";
import { detectChatMode, type ChatChannel } from "../lib/guided-prompts";
import {
  createRequestFromAction,
  confirmationMessage,
  isConfirmationUtterance,
  isRoadmapRequest,
  parsePendingFromCategory,
  serializePendingAction,
  serializeAssistantExtrasMeta,
  type SuggestedChatAction,
} from "../lib/chat-actions";
import {
  formatGuestContextBlock,
  loadAssistantPromptBlock,
  loadGuestChatContext,
  loadMenuPromptBlock,
} from "../lib/chat-context";
import { logger } from "../lib/logger";
import { buildAiCapacityFallback } from "../lib/ai-capacity-fallback";
import { GeminiAllModelsExhaustedError, GeminiChatError } from "../lib/gemini-models";
import { checkChatBurstRateLimit } from "../lib/rate-limiter";

const router: IRouter = Router();

// ---------------------------------------------------------------------------
// Daily quota (75 AI requests / day per guest — enforced server-side)
// ---------------------------------------------------------------------------
const DAILY_LIMIT = 75;
const QUOTA_TIMEZONE = "Europe/Istanbul";

function getTodayInTimezone(tz: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

async function checkAndIncrementDailyQuota(
  guestId: number
): Promise<{ allowed: boolean; remaining: number; resetAt: string }> {
  const today = getTodayInTimezone(QUOTA_TIMEZONE);

  const [usage] = await db
    .select()
    .from(dailyUsageTable)
    .where(and(eq(dailyUsageTable.guestId, guestId), eq(dailyUsageTable.date, today)));

  const currentCount = usage?.requestCount ?? 0;

  if (currentCount >= DAILY_LIMIT) {
    return { allowed: false, remaining: 0, resetAt: today };
  }

  if (usage) {
    await db
      .update(dailyUsageTable)
      .set({ requestCount: currentCount + 1, updatedAt: new Date() })
      .where(eq(dailyUsageTable.id, usage.id));
  } else {
    await db
      .insert(dailyUsageTable)
      .values({ guestId, date: today, requestCount: 1 });
  }

  return {
    allowed: true,
    remaining: DAILY_LIMIT - (currentCount + 1),
    resetAt: today,
  };
}

// ---------------------------------------------------------------------------
// Conversation memory strategy
// RECENT_WINDOW: number of latest messages sent in full to the AI
// SUMMARY_THRESHOLD: total messages before summarization kicks in
// RESUMMARY_EVERY: regenerate summary every N new messages after threshold
// ---------------------------------------------------------------------------
const RECENT_WINDOW = 4;
const SUMMARY_THRESHOLD = 20;
const RESUMMARY_EVERY = 10;

/** Return cached summary immediately; refresh in background (never block the guest). */
function getContextSummaryForTurn(
  session: typeof chatSessionsTable.$inferSelect,
  allMessages: Array<{ role: string; content: string }>,
): string | null | undefined {
  const totalCount = allMessages.length;
  if (totalCount <= SUMMARY_THRESHOLD) {
    return session.contextSummary;
  }

  const lastSummarized = session.summarizedMessageCount ?? 0;
  const needsRefresh =
    !session.contextSummary || totalCount - lastSummarized >= RESUMMARY_EVERY;

  if (needsRefresh) {
    void refreshContextSummaryInBackground(session, allMessages, totalCount);
  }

  return session.contextSummary;
}

async function refreshContextSummaryInBackground(
  session: typeof chatSessionsTable.$inferSelect,
  allMessages: Array<{ role: string; content: string }>,
  totalCount: number,
): Promise<void> {
  const messagesToSummarize = allMessages.slice(0, -RECENT_WINDOW).map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));
  if (messagesToSummarize.length === 0) return;

  logger.info({ sessionId: session.id, summarizing: messagesToSummarize.length }, "Background summary");

  try {
    const newSummary = await generateConversationSummary(messagesToSummarize);
    if (newSummary) {
      await db
        .update(chatSessionsTable)
        .set({ contextSummary: newSummary, summarizedMessageCount: totalCount })
        .where(eq(chatSessionsTable.id, session.id));
    }
  } catch (err) {
    logger.warn({ err, sessionId: session.id }, "Background summary failed");
  }
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// POST /chat/sessions — get or create active session
router.post("/chat/sessions", requireGuest, async (req, res): Promise<void> => {
  const guestId = req.session!.guestId!;
  const hotelId = req.session!.hotelId;

  const [existing] = await db
    .select()
    .from(chatSessionsTable)
    .where(and(eq(chatSessionsTable.guestId, guestId), eq(chatSessionsTable.status, "active")));

  if (existing) {
    res.json({
      id: existing.id,
      guestId: existing.guestId,
      hotelId: existing.hotelId,
      status: existing.status,
      createdAt: existing.createdAt,
    });
    return;
  }

  const [session] = await db
    .insert(chatSessionsTable)
    .values({ guestId, hotelId, status: "active" })
    .returning();

  res.json({
    id: session.id,
    guestId: session.guestId,
    hotelId: session.hotelId,
    status: session.status,
    createdAt: session.createdAt,
  });
});

// GET /chat/sessions/:sessionId/messages — fetch messages for a session
router.get("/chat/sessions/:sessionId/messages", requireGuest, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId;
  const sessionId = parseInt(rawId, 10);
  if (isNaN(sessionId)) {
    res.status(400).json({ error: "Invalid session ID" });
    return;
  }

  const guestId = req.session!.guestId!;
  const [session] = await db
    .select()
    .from(chatSessionsTable)
    .where(and(eq(chatSessionsTable.id, sessionId), eq(chatSessionsTable.guestId, guestId)));

  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const messages = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.sessionId, sessionId))
    .orderBy(asc(messagesTable.createdAt));

  res.json(messages);
});

// DELETE /chat/sessions/:sessionId/messages — clear all messages (Remove All)
router.delete("/chat/sessions/:sessionId/messages", requireGuest, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId;
  const sessionId = parseInt(rawId, 10);
  if (isNaN(sessionId)) {
    res.status(400).json({ error: "Invalid session ID" });
    return;
  }

  const guestId = req.session!.guestId!;
  const [session] = await db
    .select()
    .from(chatSessionsTable)
    .where(and(eq(chatSessionsTable.id, sessionId), eq(chatSessionsTable.guestId, guestId)));

  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  await db.delete(messagesTable).where(eq(messagesTable.sessionId, sessionId));

  await db
    .update(chatSessionsTable)
    .set({ contextSummary: null, summarizedMessageCount: 0 })
    .where(eq(chatSessionsTable.id, sessionId));

  logger.info({ sessionId, guestId }, "Conversation cleared by guest");
  res.json({ success: true });
});

// POST /chat/sessions/:sessionId/messages — send a message and get AI response
router.post("/chat/sessions/:sessionId/messages", requireGuest, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId;
  const sessionId = parseInt(rawId, 10);
  if (isNaN(sessionId)) {
    res.status(400).json({ error: "Invalid session ID" });
    return;
  }

  const guestId = req.session!.guestId!;
  const { content, language, chatMode: rawChatMode, channel: rawChannel } = req.body;
  const chatMode = detectChatMode(rawChatMode);
  const channel: ChatChannel = rawChannel === "voice" ? "voice" : "text";

  if (content == null || typeof content !== "string" || !content.trim()) {
    res.status(400).json({ error: "Message content is required" });
    return;
  }

  const turnStartedAt = Date.now();

  // Per-minute burst protection (Redis-backed when REDIS_URL is set)
  const burst = await checkChatBurstRateLimit(guestId);
  if (!burst.allowed) {
    logger.warn({ guestId, sessionId, retryAfterMs: burst.retryAfterMs }, "chat:burst-limit");
    res.status(429).json({
      error: "Too many messages. Please wait a moment.",
      retryAfterMs: burst.retryAfterMs,
    });
    return;
  }

  // Daily quota enforcement
  const quota = await checkAndIncrementDailyQuota(guestId);
  if (!quota.allowed) {
    res.status(429).json({
      error: "Bugünkü mesaj limitiniz doldu. Lütfen yarın tekrar deneyin.",
      quotaExceeded: true,
      remaining: 0,
      limit: DAILY_LIMIT,
    });
    return;
  }

  const [session] = await db
    .select()
    .from(chatSessionsTable)
    .where(and(eq(chatSessionsTable.id, sessionId), eq(chatSessionsTable.guestId, guestId)));

  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const guestContext = await loadGuestChatContext(guestId);
  if (!guestContext) {
    res.status(404).json({ error: "Guest not found" });
    return;
  }

  const [userMessage] = await db
    .insert(messagesTable)
    .values({
      sessionId,
      role: "user",
      content: content.trim(),
      language: language ?? null,
    })
    .returning();

  const needsMenu = chatMode === "food" || chatMode === "general";

  const [allMessages, menuBlock, assistantBlock] = await Promise.all([
    db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.sessionId, sessionId))
      .orderBy(asc(messagesTable.createdAt)),
    needsMenu ? loadMenuPromptBlock(guestContext.hotelId) : Promise.resolve(undefined),
    loadAssistantPromptBlock(guestContext.hotelId, guestContext.hotelName),
  ]);

  const contextSummary = getContextSummaryForTurn(session, allMessages);

  // Build the recent context window for the AI
  const recentMessages = allMessages
    .slice(0, -1) // exclude the just-inserted user message (we pass it separately)
    .slice(-RECENT_WINDOW)
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  const lastAssistant = [...allMessages].reverse().find((m) => m.role === "assistant");
  const pendingAction = parsePendingFromCategory(lastAssistant?.category ?? null);
  let suggestedAction: SuggestedChatAction | null = null;
  let requestCreated: { requestId: number } | null = null;
  let replyOptions: string[] = [];
  let roadmap: import("../lib/chat-action-parse").ChatRoadmap | null = null;
  let aiCapacityExceeded = false;
  let quickActionRoutes: ReturnType<typeof buildAiCapacityFallback>["quickActionRoutes"] = [];

  let aiResponseText: string | null = null;
  let category = "general";
  let assistantOriginalContent: string | null = null;
  let aiModel: string | undefined;

  if (
    pendingAction?.phase === "propose" &&
    pendingAction.requestType &&
    isConfirmationUtterance(content.trim())
  ) {
    try {
      const confirmed: SuggestedChatAction = { ...pendingAction, phase: "confirmed" };
      requestCreated = await createRequestFromAction(guestContext, confirmed, sessionId);
      aiResponseText = confirmationMessage(guestContext.firstName, language ?? guestContext.language);
      category = "general";
      suggestedAction = null;
    } catch (err) {
      logger.error({ err }, "Failed to create request from voice/text confirmation");
    }
  }

  if (!requestCreated) {
    try {
      const roadmapRequested =
        chatMode === "general" && isRoadmapRequest(content.trim());
      const aiResult = await generateConciergeResponse(content.trim(), recentMessages, {
        mode: chatMode,
        channel,
        guestContextBlock: formatGuestContextBlock(guestContext),
        menuBlock,
        assistantBlock,
        guestFirstName: guestContext.firstName,
        contextSummary: contextSummary ?? undefined,
        detectedLanguage: language ?? guestContext.language,
        roadmapRequested,
      });
      aiResponseText = aiResult.response;
      category = aiResult.category;
      replyOptions = aiResult.replyOptions;
      roadmap = aiResult.roadmap;
      aiModel = aiResult.model;

      if (aiResult.action?.phase === "confirmed" && aiResult.action.requestType) {
        try {
          requestCreated = await createRequestFromAction(
            guestContext,
            aiResult.action,
            sessionId,
          );
          suggestedAction = null;
        } catch (err) {
          logger.error({ err }, "Failed to create request from AI confirmed action");
          suggestedAction = aiResult.action;
        }
      } else if (aiResult.action?.phase === "propose" && aiResult.action.requestType) {
        suggestedAction = aiResult.action;
        category = serializePendingAction(aiResult.action);
      } else {
        suggestedAction = null;
      }
    } catch (err) {
      if (err instanceof GeminiAllModelsExhaustedError) {
        logger.warn({ retryAfterSec: err.retryAfterSec }, "All Gemini models exhausted — capacity fallback");
        const fallback = buildAiCapacityFallback(
          language ?? guestContext.language,
          guestContext.firstName,
        );
        aiResponseText = fallback.guestText;
        replyOptions = fallback.replyOptions;
        category = fallback.category;
        assistantOriginalContent = fallback.originalContent;
        quickActionRoutes = fallback.quickActionRoutes;
        aiCapacityExceeded = true;
      } else if (err instanceof GeminiChatError && err.code === "invalid_key") {
        logger.error({ err }, "Gemini API key invalid");
        res.status(503).json({
          error: err.guestMessage,
          aiUnavailable: true,
          userMessage,
          quota: { remaining: quota.remaining, limit: DAILY_LIMIT },
        });
        return;
      } else if (err instanceof GeminiChatError) {
        logger.warn({ code: err.code }, "Gemini transient error — capacity fallback");
        const fallback = buildAiCapacityFallback(
          language ?? guestContext.language,
          guestContext.firstName,
        );
        aiResponseText = fallback.guestText;
        replyOptions = fallback.replyOptions;
        category = fallback.category;
        assistantOriginalContent = fallback.originalContent;
        quickActionRoutes = fallback.quickActionRoutes;
        aiCapacityExceeded = true;
      } else {
        logger.error({ err }, "Gemini AI error");
        const fallback = buildAiCapacityFallback(
          language ?? guestContext.language,
          guestContext.firstName,
        );
        aiResponseText = fallback.guestText;
        replyOptions = fallback.replyOptions;
        category = fallback.category;
        assistantOriginalContent = fallback.originalContent;
        quickActionRoutes = fallback.quickActionRoutes;
        aiCapacityExceeded = true;
      }
    }
  }

  if (!aiResponseText) {
    const fallback = buildAiCapacityFallback(
      language ?? guestContext.language,
      guestContext.firstName,
    );
    aiResponseText = fallback.guestText;
    replyOptions = fallback.replyOptions;
    category = fallback.category;
    assistantOriginalContent = fallback.originalContent;
    quickActionRoutes = fallback.quickActionRoutes;
    aiCapacityExceeded = true;
  }

  const [assistantMessage] = await db
    .insert(messagesTable)
    .values({
      sessionId,
      role: "assistant",
      content: aiResponseText,
      category,
      originalContent:
        assistantOriginalContent ??
        (replyOptions.length > 0 || roadmap
          ? serializeAssistantExtrasMeta({ replyOptions, roadmap })
          : null),
    })
    .returning();

  logger.info(
    {
      sessionId,
      guestId,
      channel,
      chatMode,
      model: aiModel,
      durationMs: Date.now() - turnStartedAt,
      aiCapacityExceeded,
      requestCreated: requestCreated != null,
    },
    "chat:turn-complete",
  );

  res.json({
    userMessage,
    assistantMessage,
    suggestedAction,
    replyOptions,
    roadmap,
    aiCapacityExceeded,
    quickActionRoutes: aiCapacityExceeded ? quickActionRoutes : undefined,
    requestCreated,
    quota: {
      remaining: quota.remaining,
      limit: DAILY_LIMIT,
    },
  });
});

// POST /chat/sessions/:sessionId/confirm-action — guest confirms proposed AI action
router.post("/chat/sessions/:sessionId/confirm-action", requireGuest, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId;
  const sessionId = parseInt(rawId, 10);
  if (isNaN(sessionId)) {
    res.status(400).json({ error: "Invalid session ID" });
    return;
  }

  const guestId = req.session!.guestId!;
  const action = req.body?.action as SuggestedChatAction | undefined;

  if (!action?.requestType || !action.summary) {
    res.status(400).json({ error: "Valid action payload required" });
    return;
  }

  const [session] = await db
    .select()
    .from(chatSessionsTable)
    .where(and(eq(chatSessionsTable.id, sessionId), eq(chatSessionsTable.guestId, guestId)));

  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const guestContext = await loadGuestChatContext(guestId);
  if (!guestContext) {
    res.status(404).json({ error: "Guest not found" });
    return;
  }

  try {
    const confirmed: SuggestedChatAction = { ...action, phase: "confirmed" };
    const requestCreated = await createRequestFromAction(guestContext, confirmed, sessionId);
    const content = confirmationMessage(
      guestContext.firstName,
      req.body?.language ?? guestContext.language,
    );

    const [assistantMessage] = await db
      .insert(messagesTable)
      .values({
        sessionId,
        role: "assistant",
        content,
        category: "general",
      })
      .returning();

    res.json({ success: true, requestCreated, assistantMessage });
  } catch (err) {
    logger.error({ err }, "confirm-action failed");
    res.status(500).json({ error: "Could not create request" });
  }
});

export default router;
