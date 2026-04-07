import { Router } from "express";
import type { IRouter } from "express";
import { db, chatSessionsTable, messagesTable, guestsTable, dailyUsageTable } from "@workspace/db";
import { eq, and, asc } from "drizzle-orm";
import { requireGuest } from "../middlewares/requireAuth";
import { generateConciergeResponse } from "../lib/gemini";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// ---------------------------------------------------------------------------
// Per-minute rate limit (20 messages / 60s per guest — burst protection)
// ---------------------------------------------------------------------------
const rateLimitMap = new Map<number, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60 * 1000;

function checkRateLimit(guestId: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(guestId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(guestId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

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
// Routes
// ---------------------------------------------------------------------------
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

router.post("/chat/sessions/:sessionId/messages", requireGuest, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId;
  const sessionId = parseInt(rawId, 10);
  if (isNaN(sessionId)) {
    res.status(400).json({ error: "Invalid session ID" });
    return;
  }

  const guestId = req.session!.guestId!;
  const { content } = req.body;

  if (content == null || typeof content !== "string" || !content.trim()) {
    res.status(400).json({ error: "Message content is required" });
    return;
  }

  // Per-minute burst protection
  if (!checkRateLimit(guestId)) {
    res.status(429).json({ error: "Too many messages. Please wait a moment." });
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

  const [guest] = await db.select().from(guestsTable).where(eq(guestsTable.id, guestId));

  const [userMessage] = await db
    .insert(messagesTable)
    .values({
      sessionId,
      role: "user",
      content: content.trim(),
      language: req.body.language ?? "en",
    })
    .returning();

  const history = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.sessionId, sessionId))
    .orderBy(asc(messagesTable.createdAt));

  const conversationHistory = history.slice(0, -1).map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  let aiResponseText = "Thank you for your message. Our team will assist you shortly.";
  let category = "general";

  try {
    const aiResult = await generateConciergeResponse(
      content.trim(),
      conversationHistory,
      guest?.firstName
    );
    aiResponseText = aiResult.response;
    category = aiResult.category;
  } catch (err) {
    logger.error({ err }, "Gemini AI error");
  }

  const [assistantMessage] = await db
    .insert(messagesTable)
    .values({
      sessionId,
      role: "assistant",
      content: aiResponseText,
      category,
    })
    .returning();

  res.json({
    userMessage,
    assistantMessage,
    quota: {
      remaining: quota.remaining,
      limit: DAILY_LIMIT,
    },
  });
});

export default router;
