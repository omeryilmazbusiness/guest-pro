/**
 * Welcome-area public support alert routes.
 *
 * POST /api/public/welcome-support — no auth required.
 *   Creates a "Guest calling from welcome area" alert visible to staff.
 *
 * GET  /api/welcome-alerts — staff only.
 *   Returns all open/recent alerts for the hotel.
 *
 * PATCH /api/welcome-alerts/:id/status — staff only.
 *   Marks an alert as acknowledged.
 */

import { Router } from "express";
import type { IRouter } from "express";
import { db, hotelsTable, welcomeAlertsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireStaff } from "../middlewares/requireAuth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// ---------------------------------------------------------------------------
// POST /public/welcome-support — anonymous, no auth required
// ---------------------------------------------------------------------------
router.post("/public/welcome-support", async (req, res): Promise<void> => {
  const { selectedLanguage, sessionId } = req.body;

  if (!sessionId || typeof sessionId !== "string") {
    res.status(400).json({ error: "sessionId is required" });
    return;
  }

  // Resolve hotel — single-hotel system uses the first hotel record.
  // Extend this to multi-hotel by accepting a slug or domain header when needed.
  const [hotel] = await db.select().from(hotelsTable).limit(1);
  if (!hotel) {
    res.status(503).json({ error: "Hotel configuration not found" });
    return;
  }

  const [alert] = await db
    .insert(welcomeAlertsTable)
    .values({
      hotelId: hotel.id,
      selectedLanguage: selectedLanguage ?? "en",
      sessionId: sessionId.trim().slice(0, 64),
      status: "open",
    })
    .returning();

  logger.info(
    { alertId: alert.id, language: alert.selectedLanguage, sessionId: alert.sessionId },
    "Welcome-area support alert created",
  );

  res.status(201).json({ id: alert.id, status: alert.status });
});

// ---------------------------------------------------------------------------
// GET /welcome-alerts — staff only
// ---------------------------------------------------------------------------
router.get("/welcome-alerts", requireStaff, async (req, res): Promise<void> => {
  const hotelId = req.session!.hotelId;

  const alerts = await db
    .select()
    .from(welcomeAlertsTable)
    .where(eq(welcomeAlertsTable.hotelId, hotelId))
    .orderBy(desc(welcomeAlertsTable.createdAt))
    .limit(100);

  res.json(alerts);
});

// ---------------------------------------------------------------------------
// PATCH /welcome-alerts/:id/status — staff only
// ---------------------------------------------------------------------------
router.patch("/welcome-alerts/:id/status", requireStaff, async (req, res): Promise<void> => {
  const hotelId = req.session!.hotelId;
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid alert ID" });
    return;
  }

  const { status } = req.body;
  if (status !== "open" && status !== "acknowledged") {
    res.status(400).json({ error: "status must be 'open' or 'acknowledged'" });
    return;
  }

  const [updated] = await db
    .update(welcomeAlertsTable)
    .set({
      status,
      acknowledgedAt: status === "acknowledged" ? new Date() : null,
    })
    .where(and(eq(welcomeAlertsTable.id, id), eq(welcomeAlertsTable.hotelId, hotelId)))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Alert not found" });
    return;
  }

  res.json(updated);
});

export default router;
