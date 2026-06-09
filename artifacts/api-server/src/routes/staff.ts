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
import { requireStaffManagement, requireGeneralManager } from "../middlewares/requireAuth";
import { hashPassword, generateSalt } from "../lib/auth";
import { isValidDepartment, STAFF_DEPARTMENTS, DEPARTMENT_MANAGER_DEPARTMENTS } from "../lib/roles";
import {
  canManageStaffMember,
  getDepartmentScope,
  isGeneralManager,
} from "../lib/staff-scope";
import { logger } from "../lib/logger";
/**
 * Safely extract a single string from an Express 5 route param.
 * In Express 5, params can be string | string[]; parseInt expects string.
 */
function paramStr(val: string | string[]): string {
  return Array.isArray(val) ? val[0] ?? "" : val;
}
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
  employeeNumber: z
    .string()
    .regex(/^\d{4}$/, "Employee number must be exactly 4 digits"),
  staffDepartment: z.enum(STAFF_DEPARTMENTS, {
    errorMap: () => ({ message: "Department must be one of: " + STAFF_DEPARTMENTS.join(", ") }),
  }),
});

const updateStaffSchema = z
  .object({
    firstName: z.string().min(1).max(80).optional(),
    lastName: z.string().min(1).max(80).optional(),
    employeeNumber: z.string().regex(/^\d{4}$/).optional(),
    staffDepartment: z.enum(STAFF_DEPARTMENTS).optional(),
    isActive: z.boolean().optional(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(200, "Password too long")
      .optional(),
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
  employeeNumber: usersTable.employeeNumber,
  role: usersTable.role,
  staffDepartment: usersTable.staffDepartment,
  isActive: usersTable.isActive,
  createdAt: usersTable.createdAt,
} as const;

// ---------------------------------------------------------------------------
// GET /staff — list all personnel for this hotel
// ---------------------------------------------------------------------------
router.get("/staff", requireStaffManagement, async (req, res): Promise<void> => {
  const session = req.session!;
  const hotelId = session.hotelId;
  const actor = { role: session.role, staffDepartment: session.staffDepartment };
  const deptScope = getDepartmentScope(actor);

  const staff = await db
    .select(STAFF_SELECT)
    .from(usersTable)
    .where(
      and(
        eq(usersTable.hotelId, hotelId),
        eq(usersTable.role, "personnel"),
        ...(deptScope ? [eq(usersTable.staffDepartment, deptScope)] : []),
      ),
    )
    .orderBy(usersTable.createdAt);

  res.json(staff);
});

// ---------------------------------------------------------------------------
// POST /staff — create a new personnel user
// ---------------------------------------------------------------------------
router.post("/staff", requireStaffManagement, async (req, res): Promise<void> => {
  const session = req.session!;
  const hotelId = session.hotelId;
  const actorId = session.userId;
  const actor = { role: session.role, staffDepartment: session.staffDepartment };
  const deptScope = getDepartmentScope(actor);

  const parsed = createStaffSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid request" });
    return;
  }

  let { email, password, firstName, lastName, employeeNumber, staffDepartment } = parsed.data;

  if (deptScope) {
    staffDepartment = deptScope;
  }
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedEmployeeNumber = employeeNumber.trim();

  // Prevent duplicate email across the whole system
  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, normalizedEmail));

  if (existing) {
    res.status(409).json({ error: "A user with this email address already exists" });
    return;
  }

  const [existingEmployeeNo] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(
      and(
        eq(usersTable.hotelId, hotelId),
        eq(usersTable.employeeNumber, normalizedEmployeeNumber),
      ),
    );

  if (existingEmployeeNo) {
    res.status(409).json({ error: "This employee number is already in use" });
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
      employeeNumber: normalizedEmployeeNumber,
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
router.patch("/staff/:id", requireStaffManagement, async (req, res): Promise<void> => {
  const session = req.session!;
  const hotelId = session.hotelId;
  const actor = { role: session.role, staffDepartment: session.staffDepartment };
  const deptScope = getDepartmentScope(actor);
  const id = parseInt(paramStr(req.params.id), 10);

  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid staff ID" });
    return;
  }

  const parsed = updateStaffSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid request" });
    return;
  }

  const [target] = await db
    .select({
      id: usersTable.id,
      role: usersTable.role,
      staffDepartment: usersTable.staffDepartment,
    })
    .from(usersTable)
    .where(and(eq(usersTable.id, id), eq(usersTable.hotelId, hotelId)));

  if (!target) {
    res.status(404).json({ error: "Staff member not found" });
    return;
  }

  if (!canManageStaffMember(actor, target)) {
    res.status(403).json({ error: "You cannot modify this staff member" });
    return;
  }

  let { firstName, lastName, employeeNumber, staffDepartment, isActive, password } = parsed.data;

  if (password !== undefined && !isGeneralManager(actor)) {
    res.status(403).json({ error: "Only general managers may reset passwords" });
    return;
  }

  if (deptScope) {
    if (staffDepartment !== undefined && staffDepartment !== deptScope) {
      res.status(403).json({ error: "Cannot assign staff outside your department" });
      return;
    }
    staffDepartment = deptScope;
  } else if (staffDepartment !== undefined && !isGeneralManager(actor)) {
    res.status(403).json({ error: "Only general managers may change department" });
    return;
  }

  if (employeeNumber !== undefined) {
    const normalizedEmployeeNumber = employeeNumber.trim();
    const [existingEmployeeNo] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(
        and(
          eq(usersTable.hotelId, hotelId),
          eq(usersTable.employeeNumber, normalizedEmployeeNumber),
        ),
      );
    if (existingEmployeeNo && existingEmployeeNo.id !== id) {
      res.status(409).json({ error: "This employee number is already in use" });
      return;
    }
  }

  let passwordHash: string | undefined;
  if (password !== undefined) {
    const salt = generateSalt();
    passwordHash = hashPassword(password, salt);
  }

  const [updated] = await db
    .update(usersTable)
    .set({
      ...(firstName !== undefined && { firstName: firstName.trim() }),
      ...(lastName !== undefined && { lastName: lastName.trim() }),
      ...(employeeNumber !== undefined && { employeeNumber: employeeNumber.trim() }),
      ...(staffDepartment !== undefined && { staffDepartment }),
      ...(isActive !== undefined && { isActive }),
      ...(passwordHash !== undefined && { passwordHash }),
    })
    .where(and(eq(usersTable.id, id), eq(usersTable.hotelId, hotelId)))
    .returning(STAFF_SELECT);

  if (passwordHash !== undefined) {
    logger.info({ actorId: session.userId, targetId: id }, "Staff password reset");
  }

  res.json(updated);
});

// ---------------------------------------------------------------------------
// DELETE /staff/:id — deactivate (soft) or permanently remove a personnel user
//
// Query params:
//   ?permanent=true  →  hard-delete the row from the database
//   (default)        →  soft-delete: sets isActive = false
//
// Managers cannot be deleted/deactivated through this endpoint.
// ---------------------------------------------------------------------------
router.delete("/staff/:id", requireStaffManagement, async (req, res): Promise<void> => {
  const session = req.session!;
  const hotelId = session.hotelId;
  const actor = { role: session.role, staffDepartment: session.staffDepartment };
  const id = parseInt(paramStr(req.params.id), 10);
  const isPermanent = req.query.permanent === "true";

  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid staff ID" });
    return;
  }

  if (isPermanent && !isGeneralManager(actor)) {
    res.status(403).json({ error: "Only general managers may permanently delete staff" });
    return;
  }

  const [target] = await db
    .select({
      id: usersTable.id,
      role: usersTable.role,
      staffDepartment: usersTable.staffDepartment,
      isActive: usersTable.isActive,
    })
    .from(usersTable)
    .where(and(eq(usersTable.id, id), eq(usersTable.hotelId, hotelId)));

  if (!target) {
    res.status(404).json({ error: "Staff member not found" });
    return;
  }

  if (!canManageStaffMember(actor, target)) {
    res.status(403).json({ error: "You cannot modify this staff member" });
    return;
  }

  if (isPermanent) {
    // Hard delete — removes the row permanently.
    // Only allowed on inactive accounts to prevent accidental removal of active staff.
    if (target.isActive) {
      res.status(409).json({ error: "Deactivate the staff member before permanently deleting them" });
      return;
    }
    await db
      .delete(usersTable)
      .where(and(eq(usersTable.id, id), eq(usersTable.hotelId, hotelId)));

    logger.info({ actorId: req.session!.userId, deletedId: id }, "Staff member permanently deleted");
    res.status(204).send();
  } else {
    // Soft delete — sets isActive = false.
    await db
      .update(usersTable)
      .set({ isActive: false })
      .where(and(eq(usersTable.id, id), eq(usersTable.hotelId, hotelId)));

    logger.info({ actorId: req.session!.userId, deactivatedId: id }, "Staff member deactivated");
    res.status(204).send();
  }
});

// ---------------------------------------------------------------------------
// Department managers — General Manager only
//
// GET    /staff/department-managers       List department managers
// POST   /staff/department-managers       Create department manager account
// PATCH  /staff/department-managers/:id   Update name / active status
// ---------------------------------------------------------------------------

const createDepartmentManagerSchema = z.object({
  email: z.string().email("A valid email address is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(200, "Password too long"),
  firstName: z.string().min(1, "First name is required").max(80),
  lastName: z.string().min(1, "Last name is required").max(80),
  staffDepartment: z.enum(DEPARTMENT_MANAGER_DEPARTMENTS, {
    errorMap: () => ({
      message: "Department must be one of: " + DEPARTMENT_MANAGER_DEPARTMENTS.join(", "),
    }),
  }),
});

const updateDepartmentManagerSchema = z
  .object({
    firstName: z.string().min(1).max(80).optional(),
    lastName: z.string().min(1).max(80).optional(),
    isActive: z.boolean().optional(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(200, "Password too long")
      .optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: "At least one field must be provided",
  });

const DEPT_MANAGER_SELECT = {
  id: usersTable.id,
  email: usersTable.email,
  firstName: usersTable.firstName,
  lastName: usersTable.lastName,
  role: usersTable.role,
  staffDepartment: usersTable.staffDepartment,
  isActive: usersTable.isActive,
  createdAt: usersTable.createdAt,
} as const;

router.get(
  "/staff/department-managers",
  requireGeneralManager,
  async (req, res): Promise<void> => {
    const hotelId = req.session!.hotelId;

    const managers = await db
      .select(DEPT_MANAGER_SELECT)
      .from(usersTable)
      .where(
        and(
          eq(usersTable.hotelId, hotelId),
          eq(usersTable.role, "manager"),
        ),
      )
      .orderBy(usersTable.staffDepartment);

    res.json(
      managers.filter((m) =>
        m.staffDepartment != null &&
        (DEPARTMENT_MANAGER_DEPARTMENTS as readonly string[]).includes(m.staffDepartment),
      ),
    );
  },
);

router.post(
  "/staff/department-managers",
  requireGeneralManager,
  async (req, res): Promise<void> => {
    const session = req.session!;
    const hotelId = session.hotelId;
    const actorId = session.userId;

    const parsed = createDepartmentManagerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid request" });
      return;
    }

    const { email, password, firstName, lastName, staffDepartment } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    const [existingEmail] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, normalizedEmail));

    if (existingEmail) {
      res.status(409).json({ error: "A user with this email address already exists" });
      return;
    }

    const [existingDeptManager] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(
        and(
          eq(usersTable.hotelId, hotelId),
          eq(usersTable.role, "manager"),
          eq(usersTable.staffDepartment, staffDepartment),
          eq(usersTable.isActive, true),
        ),
      );

    if (existingDeptManager) {
      res.status(409).json({
        error: "An active department manager already exists for this department",
      });
      return;
    }

    const salt = generateSalt();
    const passwordHash = hashPassword(password, salt);

    const [newManager] = await db
      .insert(usersTable)
      .values({
        hotelId,
        email: normalizedEmail,
        passwordHash,
        provider: "local",
        role: "manager",
        staffDepartment,
        isActive: true,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      })
      .returning(DEPT_MANAGER_SELECT);

    logger.info(
      { actorId, newManagerId: newManager.id, department: staffDepartment },
      "Department manager created",
    );

    res.status(201).json(newManager);
  },
);

router.patch(
  "/staff/department-managers/:id",
  requireGeneralManager,
  async (req, res): Promise<void> => {
    const hotelId = req.session!.hotelId;
    const id = parseInt(paramStr(req.params.id), 10);

    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid manager ID" });
      return;
    }

    const parsed = updateDepartmentManagerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid request" });
      return;
    }

    const [target] = await db
      .select({
        id: usersTable.id,
        role: usersTable.role,
        staffDepartment: usersTable.staffDepartment,
      })
      .from(usersTable)
      .where(and(eq(usersTable.id, id), eq(usersTable.hotelId, hotelId)));

    if (!target || target.role !== "manager") {
      res.status(404).json({ error: "Department manager not found" });
      return;
    }

    if (
      !target.staffDepartment ||
      !(DEPARTMENT_MANAGER_DEPARTMENTS as readonly string[]).includes(target.staffDepartment)
    ) {
      res.status(404).json({ error: "Department manager not found" });
      return;
    }

    const { firstName, lastName, isActive, password } = parsed.data;

    let passwordHash: string | undefined;
    if (password !== undefined) {
      const salt = generateSalt();
      passwordHash = hashPassword(password, salt);
    }

    const [updated] = await db
      .update(usersTable)
      .set({
        ...(firstName !== undefined && { firstName: firstName.trim() }),
        ...(lastName !== undefined && { lastName: lastName.trim() }),
        ...(isActive !== undefined && { isActive }),
        ...(passwordHash !== undefined && { passwordHash }),
      })
      .where(and(eq(usersTable.id, id), eq(usersTable.hotelId, hotelId)))
      .returning(DEPT_MANAGER_SELECT);

    if (passwordHash !== undefined) {
      logger.info(
        { actorId: req.session!.userId, targetId: id },
        "Department manager password reset",
      );
    }

    res.json(updated);
  },
);

router.delete(
  "/staff/department-managers/:id",
  requireGeneralManager,
  async (req, res): Promise<void> => {
    const session = req.session!;
    const hotelId = session.hotelId;
    const id = parseInt(paramStr(req.params.id), 10);
    const isPermanent = req.query.permanent === "true";

    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid manager ID" });
      return;
    }

    const [target] = await db
      .select({
        id: usersTable.id,
        role: usersTable.role,
        staffDepartment: usersTable.staffDepartment,
        isActive: usersTable.isActive,
      })
      .from(usersTable)
      .where(and(eq(usersTable.id, id), eq(usersTable.hotelId, hotelId)));

    if (
      !target ||
      target.role !== "manager" ||
      !target.staffDepartment ||
      !(DEPARTMENT_MANAGER_DEPARTMENTS as readonly string[]).includes(target.staffDepartment)
    ) {
      res.status(404).json({ error: "Department manager not found" });
      return;
    }

    if (isPermanent) {
      if (target.isActive) {
        res.status(409).json({
          error: "Deactivate the department manager before permanently deleting them",
        });
        return;
      }
      await db
        .delete(usersTable)
        .where(and(eq(usersTable.id, id), eq(usersTable.hotelId, hotelId)));

      logger.info(
        { actorId: session.userId, deletedId: id },
        "Department manager permanently deleted",
      );
      res.status(204).send();
      return;
    }

    await db
      .update(usersTable)
      .set({ isActive: false })
      .where(and(eq(usersTable.id, id), eq(usersTable.hotelId, hotelId)));

    logger.info(
      { actorId: session.userId, deactivatedId: id },
      "Department manager deactivated",
    );
    res.status(204).send();
  },
);

export default router;
