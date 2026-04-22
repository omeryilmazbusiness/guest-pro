/**
 * Staff management routes — manager-only.
 *
 * GET    /api/staff             List all personnel for this hotel
 * POST   /api/staff             Create a new personnel user
 * PATCH  /api/staff/:id         Update name / department / isActive
 * DELETE /api/staff/:id         Deactivate (soft-delete) a personnel user
 *
 * Only the top-level "manager" role can call these endpoints.
 * All staff users created here have role = "personnel".
 * Managers themselves are not manageable through these endpoints.
 */

import { Router } from "express";
import type { IRouter } from "express";
import { z } from "zod";
import { db, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireManager } from "../middlewares/requireAuth";
import { hashPassword, generateSalt } from "../lib/auth";
import { isValidDepartment, STAFF_DEPARTMENTS } from "../lib/roles";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// ── Validation schemas ─────────────────────────────────────────────────────

const createStaffSchema = z.object({
  email: z.string().email("A valid email address is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(200, "Password too long"),
  firstName: z.string().min(1, "First name is required").max(80),
  lastName: z.string().min(1, "Last name is required").max(80),
  staffDepartment: z.enum(STAFF_DEPARTMENTS, {
    errorMap: () => ({ message: "Department must be one of: " + STAFF_DEPARTMENTS.join(", ") }),
  }),
});

const updateStaffSchema = z
  .object({
    firstName: z.string().min(1).max(80).optional(),
    lastName: z.string().min(1).max(80).optional(),
    staffDepartment: z.enum(STAFF_DEPARTMENTS).optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (d) => Object.keys(d).length > 0,
    { message: "At least one field must be provided" }
  );

// ── Columns projected in all SELECT operations ────────────────────────────

const STAFF_SELECT = {
  id: usersTable.id,
  email: usersTable.email,
  firstName: usersTable.firstName,
  lastName: usersTable.lastName,
  role: usersTable.role,
  staffDepartment: usersTable.staffDepartment,
  isActive: usersTable.isActive,
  createdAt: usersTable.createdAt,
} as const;

// ---------------------------------------------------------------------------
// GET /staff — list all personnel for this hotel
// ---------------------------------------------------------------------------
router.get("/staff", requireManager, async (req, res): Promise<void> => {
  const hotelId = req.session!.hotelId;

  const staff = await db
    .select(STAFF_SELECT)
    .from(usersTable)
    .where(
      and(
        eq(usersTable.hotelId, hotelId),
        eq(usersTable.role, "personnel"),
      )
    )
    .orderBy(usersTable.createdAt);

  res.json(staff);
});

// ---------------------------------------------------------------------------
// POST /staff — create a new personnel user
// ---------------------------------------------------------------------------
router.post("/staff", requireManager, async (req, res): Promise<void> => {
  const hotelId = req.session!.hotelId;
  const actorId = req.session!.userId;

  const parsed = createStaffSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid request" });
    return;
  }

  const { email, password, firstName, lastName, staffDepartment } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  // Prevent duplicate email across the whole system
  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, normalizedEmail));

  if (existing) {
    res.status(409).json({ error: "A user with this email address already exists" });
    return;
  }

  const salt = generateSalt();
  const passwordHash = hashPassword(password, salt);

  const [newUser] = await db
    .insert(usersTable)
    .values({
      hotelId,
      email: normalizedEmail,
      passwordHash,
      provider: "local",
      role: "personnel",
      staffDepartment,
      isActive: true,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    })
    .returning(STAFF_SELECT);

  logger.info(
    { actorId, newUserId: newUser.id, department: staffDepartment },
    "Staff member created",
  );

  res.status(201).json(newUser);
});

// ---------------------------------------------------------------------------
// PATCH /staff/:id — update name / department / isActive
// ---------------------------------------------------------------------------
router.patch("/staff/:id", requireManager, async (req, res): Promise<void> => {
  const hotelId = req.session!.hotelId;
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid staff ID" });
    return;
  }

  const parsed = updateStaffSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid request" });
    return;
  }

  // Confirm target is a personnel user belonging to this hotel — never allow
  // a manager to mutate another manager (or users from other hotels).
  const [target] = await db
    .select({ id: usersTable.id, role: usersTable.role })
    .from(usersTable)
    .where(and(eq(usersTable.id, id), eq(usersTable.hotelId, hotelId)));

  if (!target) {
    res.status(404).json({ error: "Staff member not found" });
    return;
  }

  if (target.role !== "personnel") {
    res.status(403).json({ error: "Manager accounts cannot be modified through this endpoint" });
    return;
  }

  const { firstName, lastName, staffDepartment, isActive } = parsed.data;

  const [updated] = await db
    .update(usersTable)
    .set({
      ...(firstName !== undefined && { firstName: firstName.trim() }),
      ...(lastName !== undefined && { lastName: lastName.trim() }),
      ...(staffDepartment !== undefined && { staffDepartment }),
      ...(isActive !== undefined && { isActive }),
    })
    .where(and(eq(usersTable.id, id), eq(usersTable.hotelId, hotelId)))
    .returning(STAFF_SELECT);

  res.json(updated);
});

// ---------------------------------------------------------------------------
// DELETE /staff/:id — deactivate (soft-delete) a personnel user
// ---------------------------------------------------------------------------
router.delete("/staff/:id", requireManager, async (req, res): Promise<void> => {
  const hotelId = req.session!.hotelId;
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid staff ID" });
    return;
  }

  const [target] = await db
    .select({ id: usersTable.id, role: usersTable.role })
    .from(usersTable)
    .where(and(eq(usersTable.id, id), eq(usersTable.hotelId, hotelId)));

  if (!target) {
    res.status(404).json({ error: "Staff member not found" });
    return;
  }

  if (target.role !== "personnel") {
    res.status(403).json({ error: "Manager accounts cannot be deactivated through this endpoint" });
    return;
  }

  await db
    .update(usersTable)
    .set({ isActive: false })
    .where(and(eq(usersTable.id, id), eq(usersTable.hotelId, hotelId)));

  logger.info({ actorId: req.session!.userId, deactivatedId: id }, "Staff member deactivated");

  res.status(204).send();
});

export default router;
