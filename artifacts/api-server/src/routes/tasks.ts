/**
 * Staff task routes — manager-only operational task scheduling.
 *
 * GET    /api/tasks?from=ISO&to=ISO   List tasks overlapping the window
 * POST   /api/tasks                   Create a task
 * PATCH  /api/tasks/:id               Update / complete a task
 * DELETE /api/tasks/:id               Cancel (soft) a task
 */

import { Router, type IRouter } from "express";
import { z } from "zod";
import { db, staffTasksTable, usersTable, TASK_STATUSES } from "@workspace/db";
import { and, eq, lt, gt, ne, asc } from "drizzle-orm";
import { requireManager } from "../middlewares/requireAuth";
import { logger } from "../lib/logger";

function paramStr(val: string | string[]): string {
  return Array.isArray(val) ? val[0] ?? "" : val;
}

const router: IRouter = Router();

const createTaskSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().max(4000).optional().nullable(),
    assigneeUserId: z.number().int().positive(),
    scheduledStartAt: z.string().datetime({ message: "Invalid start time" }),
    scheduledEndAt: z.string().datetime({ message: "Invalid end time" }),
  })
  .refine((d) => new Date(d.scheduledEndAt) > new Date(d.scheduledStartAt), {
    message: "End time must be after start time",
    path: ["scheduledEndAt"],
  });

const updateTaskSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(4000).optional().nullable(),
    assigneeUserId: z.number().int().positive().optional(),
    scheduledStartAt: z.string().datetime().optional(),
    scheduledEndAt: z.string().datetime().optional(),
    status: z.enum(TASK_STATUSES).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: "At least one field required" });

const TASK_SELECT = {
  id: staffTasksTable.id,
  hotelId: staffTasksTable.hotelId,
  assigneeUserId: staffTasksTable.assigneeUserId,
  createdByUserId: staffTasksTable.createdByUserId,
  title: staffTasksTable.title,
  description: staffTasksTable.description,
  scheduledStartAt: staffTasksTable.scheduledStartAt,
  scheduledEndAt: staffTasksTable.scheduledEndAt,
  status: staffTasksTable.status,
  completedAt: staffTasksTable.completedAt,
  createdAt: staffTasksTable.createdAt,
  updatedAt: staffTasksTable.updatedAt,
  assigneeFirstName: usersTable.firstName,
  assigneeLastName: usersTable.lastName,
  assigneeDepartment: usersTable.staffDepartment,
  assigneeIsActive: usersTable.isActive,
} as const;

function serializeTask(row: {
  id: number;
  hotelId: number;
  assigneeUserId: number;
  createdByUserId: number;
  title: string;
  description: string | null;
  scheduledStartAt: Date;
  scheduledEndAt: Date;
  status: string;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  assigneeFirstName: string | null;
  assigneeLastName: string | null;
  assigneeDepartment: string | null;
  assigneeIsActive: boolean;
}) {
  const now = Date.now();
  const endMs = row.scheduledEndAt.getTime();
  const isOverdue =
    row.status !== "completed" &&
    row.status !== "cancelled" &&
    endMs < now;

  return {
    id: row.id,
    hotelId: row.hotelId,
    assigneeUserId: row.assigneeUserId,
    createdByUserId: row.createdByUserId,
    title: row.title,
    description: row.description,
    scheduledStartAt: row.scheduledStartAt.toISOString(),
    scheduledEndAt: row.scheduledEndAt.toISOString(),
    status: row.status,
    completedAt: row.completedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    isOverdue,
    assignee: {
      id: row.assigneeUserId,
      firstName: row.assigneeFirstName,
      lastName: row.assigneeLastName,
      staffDepartment: row.assigneeDepartment,
      isActive: row.assigneeIsActive,
    },
  };
}

async function fetchTaskById(id: number, hotelId: number) {
  const [row] = await db
    .select(TASK_SELECT)
    .from(staffTasksTable)
    .innerJoin(usersTable, eq(staffTasksTable.assigneeUserId, usersTable.id))
    .where(and(eq(staffTasksTable.id, id), eq(staffTasksTable.hotelId, hotelId)));
  return row ?? null;
}

// ---------------------------------------------------------------------------
// GET /tasks
// ---------------------------------------------------------------------------
router.get("/tasks", requireManager, async (req, res): Promise<void> => {
  const hotelId = req.session!.hotelId;
  const fromRaw = typeof req.query.from === "string" ? req.query.from : "";
  const toRaw = typeof req.query.to === "string" ? req.query.to : "";

  const from = new Date(fromRaw);
  const to = new Date(toRaw);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    res.status(400).json({ error: "Query params from and to (ISO dates) are required" });
    return;
  }

  const rows = await db
    .select(TASK_SELECT)
    .from(staffTasksTable)
    .innerJoin(usersTable, eq(staffTasksTable.assigneeUserId, usersTable.id))
    .where(
      and(
        eq(staffTasksTable.hotelId, hotelId),
        lt(staffTasksTable.scheduledStartAt, to),
        gt(staffTasksTable.scheduledEndAt, from),
        ne(staffTasksTable.status, "cancelled"),
      ),
    )
    .orderBy(asc(staffTasksTable.scheduledStartAt));

  res.json(rows.map(serializeTask));
});

// ---------------------------------------------------------------------------
// POST /tasks
// ---------------------------------------------------------------------------
router.post("/tasks", requireManager, async (req, res): Promise<void> => {
  const hotelId = req.session!.hotelId;
  const createdByUserId = req.session!.userId;

  const parsed = createTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid request" });
    return;
  }

  const { title, description, assigneeUserId, scheduledStartAt, scheduledEndAt } = parsed.data;

  const [assignee] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(
      and(
        eq(usersTable.id, assigneeUserId),
        eq(usersTable.hotelId, hotelId),
        eq(usersTable.role, "personnel"),
        eq(usersTable.isActive, true),
      ),
    );

  if (!assignee) {
    res.status(400).json({ error: "Assignee must be an active employee at this hotel" });
    return;
  }

  const [inserted] = await db
    .insert(staffTasksTable)
    .values({
      hotelId,
      assigneeUserId,
      createdByUserId,
      title: title.trim(),
      description: description?.trim() || null,
      scheduledStartAt: new Date(scheduledStartAt),
      scheduledEndAt: new Date(scheduledEndAt),
      status: "pending",
    })
    .returning({ id: staffTasksTable.id });

  const task = await fetchTaskById(inserted!.id, hotelId);
  logger.info({ taskId: inserted!.id, hotelId, createdByUserId }, "staff_task_created");
  res.status(201).json(task);
});

// ---------------------------------------------------------------------------
// PATCH /tasks/:id
// ---------------------------------------------------------------------------
router.patch("/tasks/:id", requireManager, async (req, res): Promise<void> => {
  const hotelId = req.session!.hotelId;
  const id = parseInt(paramStr(req.params.id), 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid task id" });
    return;
  }

  const parsed = updateTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid request" });
    return;
  }

  const existing = await fetchTaskById(id, hotelId);
  if (!existing) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  const data = parsed.data;
  const patch: Partial<typeof staffTasksTable.$inferInsert> = {};

  if (data.title !== undefined) patch.title = data.title.trim();
  if (data.description !== undefined) patch.description = data.description?.trim() || null;
  if (data.scheduledStartAt !== undefined) patch.scheduledStartAt = new Date(data.scheduledStartAt);
  if (data.scheduledEndAt !== undefined) patch.scheduledEndAt = new Date(data.scheduledEndAt);

  const nextStart = patch.scheduledStartAt ?? existing.scheduledStartAt;
  const nextEnd = patch.scheduledEndAt ?? existing.scheduledEndAt;
  if (nextEnd <= nextStart) {
    res.status(400).json({ error: "End time must be after start time" });
    return;
  }

  if (data.assigneeUserId !== undefined) {
    const [assignee] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(
        and(
          eq(usersTable.id, data.assigneeUserId),
          eq(usersTable.hotelId, hotelId),
          eq(usersTable.role, "personnel"),
        ),
      );
    if (!assignee) {
      res.status(400).json({ error: "Invalid assignee" });
      return;
    }
    patch.assigneeUserId = data.assigneeUserId;
  }

  if (data.status !== undefined) {
    patch.status = data.status;
    if (data.status === "completed") {
      patch.completedAt = new Date();
    } else if (data.status === "pending" || data.status === "in_progress") {
      patch.completedAt = null;
    }
  }

  await db.update(staffTasksTable).set(patch).where(eq(staffTasksTable.id, id));

  const task = await fetchTaskById(id, hotelId);
  res.json(task);
});

// ---------------------------------------------------------------------------
// DELETE /tasks/:id — soft cancel
// ---------------------------------------------------------------------------
router.delete("/tasks/:id", requireManager, async (req, res): Promise<void> => {
  const hotelId = req.session!.hotelId;
  const id = parseInt(paramStr(req.params.id), 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid task id" });
    return;
  }

  const existing = await fetchTaskById(id, hotelId);
  if (!existing) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  await db
    .update(staffTasksTable)
    .set({ status: "cancelled", completedAt: null })
    .where(eq(staffTasksTable.id, id));

  res.status(204).send();
});

export default router;
