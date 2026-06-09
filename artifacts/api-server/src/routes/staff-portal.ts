/**
 * Staff portal routes — field personnel task self-service.
 *
 * GET   /api/staff-portal/me
 * GET   /api/staff-portal/tasks?date=YYYY-MM-DD
 * PATCH /api/staff-portal/tasks/:id/complete
 */

import { Router, type IRouter } from "express";
import { z } from "zod";
import { db, staffTasksTable, usersTable } from "@workspace/db";
import { and, eq, gte, lte, ne, asc } from "drizzle-orm";
import { requireStaffPersonnel } from "../middlewares/requireAuth";
import { ensureDailyRoutineTasks, utcDateString, dayBoundsUtc } from "../lib/routine-tasks";
import { DEPARTMENT_LABELS, type StaffDepartment } from "../lib/roles";

function paramStr(val: string | string[]): string {
  return Array.isArray(val) ? val[0] ?? "" : val;
}

const router: IRouter = Router();

const TASK_SELECT = {
  id: staffTasksTable.id,
  title: staffTasksTable.title,
  description: staffTasksTable.description,
  scheduledStartAt: staffTasksTable.scheduledStartAt,
  scheduledEndAt: staffTasksTable.scheduledEndAt,
  status: staffTasksTable.status,
  completedAt: staffTasksTable.completedAt,
} as const;

function serializePortalTask(row: {
  id: number;
  title: string;
  description: string | null;
  scheduledStartAt: Date;
  scheduledEndAt: Date;
  status: string;
  completedAt: Date | null;
}) {
  const now = Date.now();
  const isOverdue =
    row.status !== "completed" &&
    row.status !== "cancelled" &&
    row.scheduledEndAt.getTime() < now;

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    scheduledStartAt: row.scheduledStartAt.toISOString(),
    scheduledEndAt: row.scheduledEndAt.toISOString(),
    status: row.status,
    completedAt: row.completedAt?.toISOString() ?? null,
    isOverdue,
  };
}

async function findDepartmentManager(hotelId: number, department: string | null) {
  if (!department) return null;

  const dept = department as StaffDepartment;

  const [manager] = await db
    .select({
      id: usersTable.id,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      staffDepartment: usersTable.staffDepartment,
    })
    .from(usersTable)
    .where(
      and(
        eq(usersTable.hotelId, hotelId),
        eq(usersTable.role, "manager"),
        eq(usersTable.staffDepartment, dept),
        eq(usersTable.isActive, true),
      ),
    )
    .limit(1);

  if (!manager) return null;

  const name = [manager.firstName, manager.lastName].filter(Boolean).join(" ");
  return {
    id: manager.id,
    name: name || "Department Manager",
    department: manager.staffDepartment as StaffDepartment,
    departmentLabel:
      DEPARTMENT_LABELS[manager.staffDepartment as StaffDepartment] ?? manager.staffDepartment,
  };
}

router.get("/staff-portal/me", requireStaffPersonnel, async (req, res): Promise<void> => {
  const session = req.session!;
  const hotelId = session.hotelId;
  const userId = session.userId;

  const [employee] = await db
    .select({
      id: usersTable.id,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      employeeNumber: usersTable.employeeNumber,
      staffDepartment: usersTable.staffDepartment,
    })
    .from(usersTable)
    .where(and(eq(usersTable.id, userId), eq(usersTable.hotelId, hotelId)));

  if (!employee) {
    res.status(404).json({ error: "Employee not found" });
    return;
  }

  const manager = await findDepartmentManager(hotelId, employee.staffDepartment);
  const name = [employee.firstName, employee.lastName].filter(Boolean).join(" ");

  res.json({
    employee: {
      id: employee.id,
      name: name || `#${employee.id}`,
      employeeNumber: employee.employeeNumber,
      department: employee.staffDepartment,
      departmentLabel: employee.staffDepartment
        ? DEPARTMENT_LABELS[employee.staffDepartment as StaffDepartment] ??
          employee.staffDepartment
        : null,
    },
    manager,
  });
});

router.get("/staff-portal/tasks", requireStaffPersonnel, async (req, res): Promise<void> => {
  const session = req.session!;
  const hotelId = session.hotelId;
  const userId = session.userId;

  const dateRaw = typeof req.query.date === "string" ? req.query.date : utcDateString();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateRaw)) {
    res.status(400).json({ error: "Invalid date. Use YYYY-MM-DD." });
    return;
  }

  await ensureDailyRoutineTasks(hotelId, dateRaw);
  const { start, end } = dayBoundsUtc(dateRaw);

  const rows = await db
    .select(TASK_SELECT)
    .from(staffTasksTable)
    .where(
      and(
        eq(staffTasksTable.hotelId, hotelId),
        eq(staffTasksTable.assigneeUserId, userId),
        gte(staffTasksTable.scheduledStartAt, start),
        lte(staffTasksTable.scheduledStartAt, end),
        ne(staffTasksTable.status, "cancelled"),
      ),
    )
    .orderBy(asc(staffTasksTable.scheduledStartAt));

  res.json(rows.map(serializePortalTask));
});

router.patch(
  "/staff-portal/tasks/:id/complete",
  requireStaffPersonnel,
  async (req, res): Promise<void> => {
    const session = req.session!;
    const hotelId = session.hotelId;
    const userId = session.userId;
    const id = parseInt(paramStr(req.params.id), 10);

    if (Number.isNaN(id)) {
      res.status(400).json({ error: "Invalid task id" });
      return;
    }

    const [existing] = await db
      .select(TASK_SELECT)
      .from(staffTasksTable)
      .where(
        and(
          eq(staffTasksTable.id, id),
          eq(staffTasksTable.hotelId, hotelId),
          eq(staffTasksTable.assigneeUserId, userId),
          ne(staffTasksTable.status, "cancelled"),
        ),
      );

    if (!existing) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    if (existing.status === "completed") {
      res.json(serializePortalTask(existing));
      return;
    }

    const [updated] = await db
      .update(staffTasksTable)
      .set({ status: "completed", completedAt: new Date() })
      .where(eq(staffTasksTable.id, id))
      .returning(TASK_SELECT);

    res.json(serializePortalTask(updated!));
  },
);

export default router;
