import { Router } from "express";
import type { IRouter } from "express";
import { db, guestsTable, guestKeysTable, auditLogsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireManager } from "../middlewares/requireAuth";
import { generateGuestKey } from "../lib/auth";

const router: IRouter = Router();

router.get("/guests", requireManager, async (req, res): Promise<void> => {
  const hotelId = req.session!.hotelId;
  const guests = await db
    .select({
      id: guestsTable.id,
      firstName: guestsTable.firstName,
      lastName: guestsTable.lastName,
      roomNumber: guestsTable.roomNumber,
      hotelId: guestsTable.hotelId,
      createdAt: guestsTable.createdAt,
      guestKey: guestKeysTable.keyDisplay,
    })
    .from(guestsTable)
    .leftJoin(guestKeysTable, and(eq(guestKeysTable.guestId, guestsTable.id), eq(guestKeysTable.isActive, true)))
    .where(eq(guestsTable.hotelId, hotelId))
    .orderBy(desc(guestsTable.createdAt));

  res.json(guests);
});

router.post("/guests", requireManager, async (req, res): Promise<void> => {
  const { firstName, lastName, roomNumber } = req.body;
  const hotelId = req.session!.hotelId;
  const actorId = req.session!.userId;

  if (!firstName || !lastName || !roomNumber) {
    res.status(400).json({ error: "firstName, lastName, and roomNumber are required" });
    return;
  }

  const [guest] = await db
    .insert(guestsTable)
    .values({ firstName, lastName, roomNumber, hotelId })
    .returning();

  const { key, keyHash } = generateGuestKey();
  const [guestKey] = await db
    .insert(guestKeysTable)
    .values({ guestId: guest.id, hotelId, keyHash, keyDisplay: key })
    .returning();

  await db.insert(auditLogsTable).values({
    hotelId,
    actorId,
    actorType: "manager",
    action: "create_guest",
    targetType: "guest",
    targetId: guest.id,
    metadata: { roomNumber, firstName, lastName },
  });

  res.status(201).json({
    guest: {
      id: guest.id,
      firstName: guest.firstName,
      lastName: guest.lastName,
      roomNumber: guest.roomNumber,
      hotelId: guest.hotelId,
      createdAt: guest.createdAt,
      guestKey: guestKey.keyDisplay,
    },
    guestKey: key,
  });
});

router.get("/guests/:id", requireManager, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid guest ID" });
    return;
  }

  const [guest] = await db
    .select({
      id: guestsTable.id,
      firstName: guestsTable.firstName,
      lastName: guestsTable.lastName,
      roomNumber: guestsTable.roomNumber,
      hotelId: guestsTable.hotelId,
      createdAt: guestsTable.createdAt,
      guestKey: guestKeysTable.keyDisplay,
    })
    .from(guestsTable)
    .leftJoin(guestKeysTable, and(eq(guestKeysTable.guestId, guestsTable.id), eq(guestKeysTable.isActive, true)))
    .where(eq(guestsTable.id, id));

  if (!guest) {
    res.status(404).json({ error: "Guest not found" });
    return;
  }

  res.json(guest);
});

export default router;
