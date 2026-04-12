import { Router } from "express";
import type { IRouter } from "express";
import { db, guestsTable, guestKeysTable } from "@workspace/db";
import { serviceRequestsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireGuest, requireStaff } from "../middlewares/requireAuth";
import { logger } from "../lib/logger";
import type { ServiceRequestType } from "@workspace/db";

const router: IRouter = Router();

// ---------------------------------------------------------------------------
// POST /requests — guest creates a structured service request
// ---------------------------------------------------------------------------
router.post("/requests", requireGuest, async (req, res): Promise<void> => {
  const guestId = req.session!.guestId!;
  const hotelId = req.session!.hotelId;

  const { requestType, summary, structuredData, sourceSessionId } = req.body;

  if (!requestType || !summary) {
    res.status(400).json({ error: "requestType and summary are required" });
    return;
  }

  const validTypes: ServiceRequestType[] = [
    "FOOD_ORDER",
    "SUPPORT_REQUEST",
    "CARE_PROFILE_UPDATE",
    "GENERAL_SERVICE_REQUEST",
  ];

  if (!validTypes.includes(requestType)) {
    res.status(400).json({ error: "Invalid requestType" });
    return;
  }

  const [guest] = await db.select().from(guestsTable).where(eq(guestsTable.id, guestId));
  if (!guest) {
    res.status(404).json({ error: "Guest not found" });
    return;
  }

  const [request] = await db
    .insert(serviceRequestsTable)
    .values({
      guestId,
      hotelId,
      roomNumber: guest.roomNumber,
      requestType,
      summary: summary.trim(),
      structuredData: structuredData ?? null,
      sourceSessionId: sourceSessionId ?? null,
      guestFirstName: guest.firstName,
      guestLastName: guest.lastName,
      status: "open",
    })
    .returning();

  logger.info({ requestId: request.id, guestId, requestType }, "Service request created");
  res.status(201).json(request);
});

// ---------------------------------------------------------------------------
// GET /requests — staff fetches all requests for their hotel
// ---------------------------------------------------------------------------
router.get("/requests", requireStaff, async (req, res): Promise<void> => {
  const hotelId = req.session!.hotelId;
  const { type, status } = req.query;

  let query = db
    .select()
    .from(serviceRequestsTable)
    .where(eq(serviceRequestsTable.hotelId, hotelId))
    .orderBy(desc(serviceRequestsTable.createdAt))
    .$dynamic();

  if (type && typeof type === "string") {
    query = query.where(
      and(
        eq(serviceRequestsTable.hotelId, hotelId),
        eq(serviceRequestsTable.requestType, type as ServiceRequestType)
      )
    );
  }

  if (status && typeof status === "string") {
    query = query.where(
      and(
        eq(serviceRequestsTable.hotelId, hotelId),
        eq(serviceRequestsTable.status, status as "open" | "in_progress" | "resolved")
      )
    );
  }

  const requests = await db
    .select()
    .from(serviceRequestsTable)
    .where(eq(serviceRequestsTable.hotelId, hotelId))
    .orderBy(desc(serviceRequestsTable.createdAt));

  res.json(requests);
});

// ---------------------------------------------------------------------------
// GET /requests/mine — guest fetches their own requests
// ---------------------------------------------------------------------------
router.get("/requests/mine", requireGuest, async (req, res): Promise<void> => {
  const guestId = req.session!.guestId!;

  const requests = await db
    .select()
    .from(serviceRequestsTable)
    .where(eq(serviceRequestsTable.guestId, guestId))
    .orderBy(desc(serviceRequestsTable.createdAt));

  res.json(requests);
});

// ---------------------------------------------------------------------------
// GET /requests/:id — staff fetches a single request
// ---------------------------------------------------------------------------
router.get("/requests/:id", requireStaff, async (req, res): Promise<void> => {
  const hotelId = req.session!.hotelId;
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid request ID" });
    return;
  }

  const [request] = await db
    .select()
    .from(serviceRequestsTable)
    .where(and(eq(serviceRequestsTable.id, id), eq(serviceRequestsTable.hotelId, hotelId)));

  if (!request) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  res.json(request);
});

// ---------------------------------------------------------------------------
// PATCH /requests/:id/status — staff updates request status
// ---------------------------------------------------------------------------
router.patch("/requests/:id/status", requireStaff, async (req, res): Promise<void> => {
  const hotelId = req.session!.hotelId;
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid request ID" });
    return;
  }

  const { status } = req.body;
  const validStatuses = ["open", "in_progress", "resolved"];

  if (!status || !validStatuses.includes(status)) {
    res.status(400).json({ error: "status must be one of: open, in_progress, resolved" });
    return;
  }

  const [updated] = await db
    .update(serviceRequestsTable)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(serviceRequestsTable.id, id), eq(serviceRequestsTable.hotelId, hotelId)))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  logger.info({ requestId: id, status }, "Service request status updated");
  res.json(updated);
});

// ---------------------------------------------------------------------------
// DELETE /requests/:id — staff hard-deletes a RESOLVED request
// ---------------------------------------------------------------------------
router.delete("/requests/:id", requireStaff, async (req, res): Promise<void> => {
  const hotelId = req.session!.hotelId;
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid request ID" });
    return;
  }

  const [existing] = await db
    .select()
    .from(serviceRequestsTable)
    .where(and(eq(serviceRequestsTable.id, id), eq(serviceRequestsTable.hotelId, hotelId)));

  if (!existing) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  if (existing.status !== "resolved") {
    res.status(409).json({ error: "Only resolved requests can be deleted" });
    return;
  }

  await db
    .delete(serviceRequestsTable)
    .where(and(eq(serviceRequestsTable.id, id), eq(serviceRequestsTable.hotelId, hotelId)));

  logger.info({ requestId: id }, "Service request deleted");
  res.status(204).send();
});

// ---------------------------------------------------------------------------
// DELETE /requests/:id/guest — guest hard-deletes their own RESOLVED request
// ---------------------------------------------------------------------------
router.delete("/requests/:id/guest", requireGuest, async (req, res): Promise<void> => {
  const guestId = req.session!.guestId!;
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid request ID" });
    return;
  }

  const [existing] = await db
    .select()
    .from(serviceRequestsTable)
    .where(and(eq(serviceRequestsTable.id, id), eq(serviceRequestsTable.guestId, guestId)));

  if (!existing) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  if (existing.status !== "resolved") {
    res.status(409).json({ error: "Only resolved requests can be deleted" });
    return;
  }

  await db
    .delete(serviceRequestsTable)
    .where(and(eq(serviceRequestsTable.id, id), eq(serviceRequestsTable.guestId, guestId)));

  logger.info({ requestId: id, guestId }, "Guest deleted resolved service request");
  res.status(204).send();
});

export default router;
