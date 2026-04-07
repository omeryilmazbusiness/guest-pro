import { Router } from "express";
import type { IRouter } from "express";
import { db, usersTable, guestKeysTable, guestsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authenticateManager, authenticateGuest, generateToken, verifyToken } from "../lib/auth";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.post("/auth/login", async (req, res): Promise<void> => {
  const { type, email, password, guestKey } = req.body;

  if (type === "manager") {
    if (!email || !password) {
      res.status(400).json({ error: "Email and password required" });
      return;
    }
    const user = await authenticateManager(email as string, password as string);
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const token = generateToken(user.id, "manager", user.hotelId);
    res.json({
      role: "manager",
      token,
      user: {
        id: user.id,
        role: "manager",
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roomNumber: null,
        guestId: null,
        hotelId: user.hotelId,
      },
    });
    return;
  }

  if (type === "guest") {
    if (!guestKey) {
      res.status(400).json({ error: "Guest key required" });
      return;
    }
    const result = await authenticateGuest(guestKey as string);
    if (!result) {
      res.status(401).json({ error: "Invalid or inactive guest key" });
      return;
    }
    const { guest } = result;
    const syntheticUserId = guest.id * -1;
    const token = generateToken(syntheticUserId, "guest", guest.hotelId, guest.id);
    res.json({
      role: "guest",
      token,
      user: {
        id: syntheticUserId,
        role: "guest",
        email: null,
        firstName: guest.firstName,
        lastName: guest.lastName,
        roomNumber: guest.roomNumber,
        guestId: guest.id,
        hotelId: guest.hotelId,
      },
    });
    return;
  }

  res.status(400).json({ error: "Invalid login type" });
});

router.post("/auth/logout", (_req, res): void => {
  res.json({ success: true });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const session = req.session!;

  if (session.role === "manager") {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, session.userId));
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    res.json({
      id: user.id,
      role: "manager",
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roomNumber: null,
      guestId: null,
      hotelId: user.hotelId,
    });
    return;
  }

  if (session.role === "guest" && session.guestId) {
    const [guest] = await db.select().from(guestsTable).where(eq(guestsTable.id, session.guestId));
    if (!guest) {
      res.status(401).json({ error: "Guest not found" });
      return;
    }
    res.json({
      id: session.userId,
      role: "guest",
      email: null,
      firstName: guest.firstName,
      lastName: guest.lastName,
      roomNumber: guest.roomNumber,
      guestId: guest.id,
      hotelId: guest.hotelId,
    });
    return;
  }

  res.status(401).json({ error: "Invalid session" });
});

export default router;
