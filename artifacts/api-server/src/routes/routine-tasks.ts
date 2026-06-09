/**
 * Routine task template routes — department manager recurring tasks.
 *
 * GET    /api/routine-tasks
 * POST   /api/routine-tasks
 * PATCH  /api/routine-tasks/:id
 * DELETE /api/routine-tasks/:id
 */

import { Router, type IRouter } from "express";
import { z } from "zod";
import { db, routineTasksTable, staffTasksTable, usersTable } from "@workspace/db";
import { and, eq, asc } from "drizzle-orm";
import { requireStaffManager } from "../middlewares/requireAuth";
import { getDepartmentScope } from "../lib/staff-scope";
import { parseTimeOfDay } from "../lib/routine-tasks";
import { logger } from "../lib/logger";

function paramStr(val: string | string[]): string {
  return Array.isArray(val) ? val[0] ?? "" : val;
}

const router: IRouter = Router();

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be HH:MM (24h)");

const createSchema = z
  .object({
    title: z.string().min(1).max(200),
    description: z.string().max(4000).optional().nullable(),
    assigneeUserId: z.number().int().positive(),
    startTime: timeSchema,
    endTime: timeSchema,
  })
  .refine(
    (d) => {
      const start = parseTimeOfDay(d.startTime);
      const end = parseTimeOfDay(d.endTime);
      if (!start || !end) return false;
      return start.hours * 60 + start.minutes < end.hours * 60 + end.minutes;
    },
    { message: "End time must be after start time", path: ["endTime"] },
  );

const updateSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(4000).optional().nullable(),
    assigneeUserId: z.number().int().positive().optional(),
    startTime: timeSchema.optional(),
    endTime: timeSchema.optional(),
    isActive: z.boolean().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: "At least one field required" });

const ROUTINE_SELECT = {
  id: routineTasksTable.id,
  hotelId: routineTasksTable.hotelId,
  createdByUserId: routineTasksTable.createdByUserId,
  title: routineTasksTable.title,
  description: routineTasksTable.description,
  assigneeUserId: routineTasksTable.assigneeUserId,
  startTime: routineTasksTable.startTime,
  endTime: routineTasksTable.endTime,
  isActive: routineTasksTable.isActive,
  createdAt: routineTasksTable.createdAt,
  updatedAt: routineTasksTable.updatedAt,
  assigneeFirstName: usersTable.firstName,
  assigneeLastName: usersTable.lastName,
  assigneeDepartment: usersTable.staffDepartment,
} as const;

function serializeRoutine(row: {
  id: number;
  hotelId: number;
  createdByUserId: number;
  title: string;
  description: string | null;
  assigneeUserId: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  assigneeFirstName: string | null;
  assigneeLastName: string | null;
  assigneeDepartment: string | null;
}) {
  const name = [row.assigneeFirstName, row.assigneeLastName].filter(Boolean).join(" ");
  return {
    id: row.id,
    hotelId: row.hotelId,
    createdByUserId: row.createdByUserId,
    title: row.title,
    description: row.description,
    assigneeUserId: row.assigneeUserId,
    startTime: row.startTime,
    endTime: row.endTime,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    assignee: {
      id: row.assigneeUserId,
      name: name || `#${row.assigneeUserId}`,
      staffDepartment: row.assigneeDepartment,
    },
  };
}

async function fetchRoutineById(id: number, hotelId: number) {
  const [row] = await db
    .select(ROUTINE_SELECT)
    .from(routineTasksTable)
    .innerJoin(usersTable, eq(routineTasksTable.assigneeUserId, usersTable.id))
    .where(and(eq(routineTasksTable.id, id), eq(routineTasksTable.hotelId, hotelId)));
  return row ?? null;
}

router.get("/routine-tasks", requireStaffManager, async (req, res): Promise<void> => {
  const session = req.session!;
  const hotelId = session.hotelId;
  const deptScope = getDepartmentScope({
    role: session.role,
    staffDepartment: session.staffDepartment,
  });

  const rows = await db
    .select(ROUTINE_SELECT)
    .from(routineTasksTable)
    .innerJoin(usersTable, eq(routineTasksTable.assigneeUserId, usersTable.id))
    .where(
      and(
        eq(routineTasksTable.hotelId, hotelId),
        ...(deptScope ? [eq(usersTable.staffDepartment, deptScope)] : []),
      ),
    )
    .orderBy(asc(routineTasksTable.title));

  res.json(rows.map(serializeRoutine));
});

router.post("/routine-tasks", requireStaffManager, async (req, res): Promise<void> => {
  const session = req.session!;
  const hotelId = session.hotelId;
  const createdByUserId = session.userId;
  const deptScope = getDepartmentScope({
    role: session.role,
    staffDepartment: session.staffDepartment,
  });

  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid request" });
    return;
  }

  const { title, description, assigneeUserId, startTime, endTime } = parsed.data;

  const [assignee] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(
      and(
        eq(usersTable.id, assigneeUserId),
        eq(usersTable.hotelId, hotelId),
        eq(usersTable.role, "personnel"),
        eq(usersTable.isActive, true),
        ...(deptScope ? [eq(usersTable.staffDepartment, deptScope)] : []),
      ),
    );

  if (!assignee) {
    res.status(400).json({ error: "Assignee must be an active employee in your department" });
    return;
  }

  const [inserted] = await db
    .insert(routineTasksTable)
    .values({
      hotelId,
      createdByUserId,
      title: title.trim(),
      description: description?.trim() || null,
      assigneeUserId,
      startTime,
      endTime,
      isActive: true,
    })
    .returning({ id: routineTasksTable.id });

  const routine = await fetchRoutineById(inserted!.id, hotelId);
  logger.info({ routineId: inserted!.id, hotelId }, "routine_task_created");
  res.status(201).json(routine ? serializeRoutine(routine) : null);
});

router.patch("/routine-tasks/:id", requireStaffManager, async (req, res): Promise<void> => {
  const session = req.session!;
  const hotelId = session.hotelId;
  const id = parseInt(paramStr(req.params.id), 10);

  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid routine task id" });
    return;
  }

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid request" });
    return;
  }

  const existing = await fetchRoutineById(id, hotelId);
  if (!existing) {
    res.status(404).json({ error: "Routine task not found" });
    return;
  }

  const data = parsed.data;
  const nextStart = data.startTime ?? existing.startTime;
  const nextEnd = data.endTime ?? existing.endTime;
  const start = parseTimeOfDay(nextStart);
  const end = parseTimeOfDay(nextEnd);
  if (!start || !end || start.hours * 60 + start.minutes >= end.hours * 60 + end.minutes) {
    res.status(400).json({ error: "End time must be after start time" });
    return;
  }

  await db
    .update(routineTasksTable)
    .set({
      ...(data.title !== undefined && { title: data.title.trim() }),
      ...(data.description !== undefined && { description: data.description?.trim() || null }),
      ...(data.assigneeUserId !== undefined && { assigneeUserId: data.assigneeUserId }),
      ...(data.startTime !== undefined && { startTime: data.startTime }),
      ...(data.endTime !== undefined && { endTime: data.endTime }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    })
    .where(eq(routineTasksTable.id, id));

  const routine = await fetchRoutineById(id, hotelId);
  res.json(routine ? serializeRoutine(routine) : null);
});

router.delete("/routine-tasks/:id", requireStaffManager, async (req, res): Promise<void> => {
  const session = req.session!;
  const hotelId = session.hotelId;
  const id = parseInt(paramStr(req.params.id), 10);

  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid routine task id" });
    return;
  }

  const existing = await fetchRoutineById(id, hotelId);
  if (!existing) {
    res.status(404).json({ error: "Routine task not found" });
    return;
  }

  try {
    await db.transaction(async (tx) => {
      // Detach generated instances (FK also SET NULL on delete via migration 0010).
      await tx
        .update(staffTasksTable)
        .set({ routineTaskId: null, sourceDate: null })
        .where(
          and(
            eq(staffTasksTable.routineTaskId, id),
            eq(staffTasksTable.hotelId, hotelId),
          ),
        );

      const deleted = await tx
        .delete(routineTasksTable)
        .where(and(eq(routineTasksTable.id, id), eq(routineTasksTable.hotelId, hotelId)))
        .returning({ id: routineTasksTable.id });

      if (deleted.length === 0) {
        throw new Error("Routine task not deleted");
      }
    });
  } catch (err) {
    logger.error({ err, routineTaskId: id, hotelId }, "routine_task_delete_failed");
    res.status(500).json({ error: "Could not delete routine task. Please try again." });
    return;
  }

  logger.info({ routineTaskId: id, hotelId }, "routine_task_deleted");
  res.status(204).send();
});

export default router;
