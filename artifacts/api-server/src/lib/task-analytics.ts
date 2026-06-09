/**
 * task-analytics.ts — staff task performance for GM quick report.
 */

import { db, staffTasksTable, usersTable } from "@workspace/db";
import { and, eq, gte, lte, ne } from "drizzle-orm";
import { DEPARTMENT_LABELS, type StaffDepartment } from "./roles";

export interface StaffPerformanceEmployee {
  id: number;
  name: string;
  employeeNumber: string | null;
  department: StaffDepartment | null;
  completed: number;
  pending: number;
  overdue: number;
  total: number;
}

export interface StaffPerformanceDepartment {
  department: StaffDepartment;
  label: string;
  completed: number;
  pending: number;
  overdue: number;
  total: number;
  employees: StaffPerformanceEmployee[];
}

export interface StaffPerformanceAnalytics {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionRate: number;
  departments: StaffPerformanceDepartment[];
}

export interface EmployeeTaskTiming {
  id: number;
  name: string;
  department: string | null;
  assigned: number;
  completed: number;
  onTimeOrEarly: number;
  lateCompleted: number;
  overdueOpen: number;
  onTimeRate: number;
}

export interface TaskPerformanceChartPoint {
  name: string;
  onTimeRate: number;
  completed: number;
}

export interface TaskPerformanceReport extends StaffPerformanceAnalytics {
  periodStart: string;
  periodEnd: string;
  employees: EmployeeTaskTiming[];
  chart: TaskPerformanceChartPoint[];
}

function displayName(first: string | null, last: string | null, id: number): string {
  const full = [first, last].filter(Boolean).join(" ");
  return full || `#${id}`;
}

export async function buildStaffPerformanceAnalytics(
  hotelId: number,
  periodStart: Date,
  periodEnd: Date,
  departmentScope: StaffDepartment | null = null,
): Promise<StaffPerformanceAnalytics> {
  const now = Date.now();

  const rows = await db
    .select({
      taskId: staffTasksTable.id,
      status: staffTasksTable.status,
      scheduledEndAt: staffTasksTable.scheduledEndAt,
      assigneeId: usersTable.id,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      employeeNumber: usersTable.employeeNumber,
      staffDepartment: usersTable.staffDepartment,
    })
    .from(staffTasksTable)
    .innerJoin(usersTable, eq(staffTasksTable.assigneeUserId, usersTable.id))
    .where(
      and(
        eq(staffTasksTable.hotelId, hotelId),
        gte(staffTasksTable.scheduledStartAt, periodStart),
        lte(staffTasksTable.scheduledStartAt, periodEnd),
        ne(staffTasksTable.status, "cancelled"),
        ...(departmentScope ? [eq(usersTable.staffDepartment, departmentScope)] : []),
      ),
    );

  const deptMap = new Map<
    StaffDepartment,
    {
      completed: number;
      pending: number;
      overdue: number;
      employees: Map<number, StaffPerformanceEmployee>;
    }
  >();

  let completedTasks = 0;
  let pendingTasks = 0;
  let overdueTasks = 0;

  for (const row of rows) {
    const dept = (row.staffDepartment ?? "HOUSEKEEPING") as StaffDepartment;
    const isCompleted = row.status === "completed";
    const isOverdue =
      !isCompleted &&
      row.status !== "cancelled" &&
      row.scheduledEndAt.getTime() < now;

    if (isCompleted) completedTasks++;
    else pendingTasks++;
    if (isOverdue) overdueTasks++;

    if (!deptMap.has(dept)) {
      deptMap.set(dept, { completed: 0, pending: 0, overdue: 0, employees: new Map() });
    }
    const deptEntry = deptMap.get(dept)!;

    if (isCompleted) deptEntry.completed++;
    else deptEntry.pending++;
    if (isOverdue) deptEntry.overdue++;

    if (!deptEntry.employees.has(row.assigneeId)) {
      deptEntry.employees.set(row.assigneeId, {
        id: row.assigneeId,
        name: displayName(row.firstName, row.lastName, row.assigneeId),
        employeeNumber: row.employeeNumber,
        department: row.staffDepartment as StaffDepartment | null,
        completed: 0,
        pending: 0,
        overdue: 0,
        total: 0,
      });
    }

    const emp = deptEntry.employees.get(row.assigneeId)!;
    emp.total++;
    if (isCompleted) emp.completed++;
    else emp.pending++;
    if (isOverdue) emp.overdue++;
  }

  const departments: StaffPerformanceDepartment[] = Array.from(deptMap.entries())
    .map(([department, data]) => ({
      department,
      label: DEPARTMENT_LABELS[department] ?? department,
      completed: data.completed,
      pending: data.pending,
      overdue: data.overdue,
      total: data.completed + data.pending,
      employees: Array.from(data.employees.values()).sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    }))
    .sort((a, b) => b.overdue - a.overdue || b.pending - a.pending);

  const totalTasks = rows.length;

  return {
    totalTasks,
    completedTasks,
    pendingTasks,
    overdueTasks,
    completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    departments,
  };
}

function buildEmployeeTiming(rows: {
  status: string;
  scheduledEndAt: Date;
  completedAt: Date | null;
  assigneeId: number;
  firstName: string | null;
  lastName: string | null;
  staffDepartment: string | null;
}[]): EmployeeTaskTiming[] {
  const now = Date.now();
  const map = new Map<number, EmployeeTaskTiming>();

  for (const row of rows) {
    if (!map.has(row.assigneeId)) {
      map.set(row.assigneeId, {
        id: row.assigneeId,
        name: displayName(row.firstName, row.lastName, row.assigneeId),
        department: row.staffDepartment,
        assigned: 0,
        completed: 0,
        onTimeOrEarly: 0,
        lateCompleted: 0,
        overdueOpen: 0,
        onTimeRate: 0,
      });
    }
    const emp = map.get(row.assigneeId)!;
    emp.assigned++;

    if (row.status === "completed" && row.completedAt) {
      emp.completed++;
      if (row.completedAt.getTime() <= row.scheduledEndAt.getTime()) {
        emp.onTimeOrEarly++;
      } else {
        emp.lateCompleted++;
      }
    } else if (
      row.status !== "cancelled" &&
      row.status !== "completed" &&
      row.scheduledEndAt.getTime() < now
    ) {
      emp.overdueOpen++;
    }
  }

  return Array.from(map.values())
    .map((emp) => ({
      ...emp,
      onTimeRate:
        emp.completed > 0
          ? Math.round((emp.onTimeOrEarly / emp.completed) * 100)
          : 0,
    }))
    .sort((a, b) => b.onTimeRate - a.onTimeRate || b.completed - a.completed);
}

export async function buildTaskPerformanceReport(
  hotelId: number,
  periodStart: Date,
  periodEnd: Date,
  departmentScope: StaffDepartment | null = null,
): Promise<TaskPerformanceReport> {
  const base = await buildStaffPerformanceAnalytics(
    hotelId,
    periodStart,
    periodEnd,
    departmentScope,
  );

  const rows = await db
    .select({
      status: staffTasksTable.status,
      scheduledEndAt: staffTasksTable.scheduledEndAt,
      completedAt: staffTasksTable.completedAt,
      assigneeId: usersTable.id,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      staffDepartment: usersTable.staffDepartment,
    })
    .from(staffTasksTable)
    .innerJoin(usersTable, eq(staffTasksTable.assigneeUserId, usersTable.id))
    .where(
      and(
        eq(staffTasksTable.hotelId, hotelId),
        gte(staffTasksTable.scheduledStartAt, periodStart),
        lte(staffTasksTable.scheduledStartAt, periodEnd),
        ne(staffTasksTable.status, "cancelled"),
        ...(departmentScope ? [eq(usersTable.staffDepartment, departmentScope)] : []),
      ),
    );

  const employees = buildEmployeeTiming(rows);
  const chart: TaskPerformanceChartPoint[] = employees
    .filter((e) => e.completed > 0)
    .map((e) => ({
      name: e.name.split(" ")[0] ?? e.name,
      onTimeRate: e.onTimeRate,
      completed: e.completed,
    }));

  return {
    ...base,
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    employees,
    chart,
  };
}
