/**
 * Export staff tasks (and routine templates) to a downloadable .xlsx workbook.
 */

import * as XLSX from "xlsx";
import type { StaffTranslations } from "@/lib/staff-i18n";
import type { RoutineTask } from "@/lib/routine-tasks";
import { DEPARTMENT_LABELS, type StaffDepartment } from "@/lib/staff";
import { assigneeDisplayName, type StaffTask, type TaskStatus } from "@/lib/tasks";
import { formatAnchorTitle, type TasksViewMode } from "@/lib/tasks-schedule";

function statusLabel(status: TaskStatus, t: StaffTranslations): string {
  switch (status) {
    case "pending":
      return t.tasksStatusPending;
    case "in_progress":
      return t.tasksStatusInProgress;
    case "completed":
      return t.tasksStatusCompleted;
    case "cancelled":
      return t.tasksStatusCancelled;
  }
}

function deptLabel(dept: string | null | undefined): string {
  if (!dept) return "";
  return DEPARTMENT_LABELS[dept as StaffDepartment] ?? dept;
}

function formatDateTime(iso: string | null | undefined, locale: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Excel sheet tab names — max 31 chars, ASCII-safe. */
function sheetTabName(label: string, fallback: string): string {
  const trimmed = label.replace(/[\\/?*[\]:]/g, "").slice(0, 31);
  return trimmed || fallback;
}

export interface ExportTasksWorkbookInput {
  tasks: StaffTask[];
  routines?: RoutineTask[];
  viewMode: TasksViewMode;
  anchorDate: Date;
  locale: string;
  t: StaffTranslations;
  hotelName?: string;
}

export function exportTasksWorkbook({
  tasks,
  routines = [],
  viewMode,
  anchorDate,
  locale,
  t,
  hotelName,
}: ExportTasksWorkbookInput): void {
  const periodLabel = formatAnchorTitle(viewMode, anchorDate, locale);
  const exportedAt = new Date().toLocaleString(locale);
  const sorted = [...tasks].sort(
    (a, b) =>
      new Date(a.scheduledStartAt).getTime() - new Date(b.scheduledStartAt).getTime(),
  );

  const workbook = XLSX.utils.book_new();

  const summaryRows = [
    [t.tasksExportReportTitle],
    [],
    [t.tasksExportPeriod, periodLabel],
    [t.tasksExportView, viewMode === "day" ? t.tasksDayView : t.tasksWeekView],
    ...(hotelName ? [[t.tasksExportHotel, hotelName]] : []),
    [t.tasksExportGeneratedAt, exportedAt],
    [t.tasksExportTaskCount, String(sorted.length)],
    [t.tasksExportRoutineCount, String(routines.length)],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
  summarySheet["!cols"] = [{ wch: 22 }, { wch: 48 }];
  XLSX.utils.book_append_sheet(
    workbook,
    summarySheet,
    sheetTabName(t.tasksExportSheetSummary, "Summary"),
  );

  const taskHeader = [
    t.tasksExportColId,
    t.tasksTableDay,
    t.tasksExportColStart,
    t.tasksExportColEnd,
    t.tasksExportColDurationMin,
    t.tasksTableTask,
    t.tasksDescription,
    t.tasksAssignee,
    t.tasksExportColDepartment,
    t.tasksTableStatus,
    t.tasksOverdueTitle,
    t.tasksExportColCompletedAt,
    t.tasksExportColCreatedAt,
  ];

  const taskRows = sorted.map((task) => {
    const start = new Date(task.scheduledStartAt);
    const end = new Date(task.scheduledEndAt);
    const durationMin = Math.round((end.getTime() - start.getTime()) / 60_000);

    return [
      task.id,
      formatDate(task.scheduledStartAt, locale),
      formatDateTime(task.scheduledStartAt, locale),
      formatDateTime(task.scheduledEndAt, locale),
      durationMin,
      task.title,
      task.description ?? "",
      assigneeDisplayName(task.assignee),
      deptLabel(task.assignee.staffDepartment),
      statusLabel(task.status, t),
      task.isOverdue && task.status !== "completed" ? t.tasksExportYes : t.tasksExportNo,
      formatDateTime(task.completedAt, locale),
      formatDateTime(task.createdAt, locale),
    ];
  });

  const tasksSheet = XLSX.utils.aoa_to_sheet([taskHeader, ...taskRows]);
  tasksSheet["!cols"] = [
    { wch: 6 },
    { wch: 16 },
    { wch: 18 },
    { wch: 18 },
    { wch: 10 },
    { wch: 32 },
    { wch: 36 },
    { wch: 22 },
    { wch: 18 },
    { wch: 14 },
    { wch: 10 },
    { wch: 18 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(
    workbook,
    tasksSheet,
    sheetTabName(t.tasksExportSheetTasks, "Tasks"),
  );

  if (routines.length > 0) {
    const routineHeader = [
      t.tasksExportColId,
      t.tasksTableTask,
      t.tasksDescription,
      t.tasksAssignee,
      t.tasksExportColDepartment,
      t.tasksStart,
      t.tasksEnd,
      t.tasksExportColActive,
    ];
    const routineRows = routines.map((r) => [
      r.id,
      r.title,
      r.description ?? "",
      r.assignee.name,
      deptLabel(r.assignee.staffDepartment),
      r.startTime,
      r.endTime,
      r.isActive ? t.tasksExportYes : t.tasksExportNo,
    ]);
    const routinesSheet = XLSX.utils.aoa_to_sheet([routineHeader, ...routineRows]);
    routinesSheet["!cols"] = [
      { wch: 6 },
      { wch: 32 },
      { wch: 36 },
      { wch: 22 },
      { wch: 18 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
    ];
    XLSX.utils.book_append_sheet(
      workbook,
      routinesSheet,
      sheetTabName(t.tasksExportSheetRoutines, "Routines"),
    );
  }

  const datePart = anchorDate.toISOString().slice(0, 10);
  const viewPart = viewMode === "day" ? "day" : "week";
  XLSX.writeFile(workbook, `guest-pro-tasks-${viewPart}-${datePart}.xlsx`);
}
