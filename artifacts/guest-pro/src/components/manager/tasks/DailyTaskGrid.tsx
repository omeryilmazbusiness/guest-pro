/**
 * DailyTaskGrid — employee + task timelines with expand popups.
 */

import { ClipboardList, Users } from "lucide-react";
import type { StaffTranslations } from "@/lib/staff-i18n";
import type { StaffTask } from "@/lib/tasks";
import type { GridEmployee } from "@/lib/tasks-schedule";
import { EmployeeTimelineTable } from "@/components/manager/tasks/EmployeeTimelineTable";
import { TaskTimelineTable } from "@/components/manager/tasks/TaskTimelineTable";
import { TasksTableSection } from "@/components/manager/tasks/TasksTableSection";

interface DailyTaskGridProps {
  day: Date;
  employees: GridEmployee[];
  tasks: StaffTask[];
  locale: string;
  t: StaffTranslations;
  onTaskClick: (task: StaffTask) => void;
}

export function DailyTaskGrid({
  day,
  employees,
  tasks,
  locale,
  t,
  onTaskClick,
}: DailyTaskGridProps) {
  return (
    <div className="space-y-3">
      <TasksTableSection
        icon={Users}
        title={t.tasksScheduleEmployeeShort}
        modalTitle={t.tasksScheduleByEmployee}
        accent="sky"
        t={t}
        renderContent={({ embedded, expanded }) => (
          <EmployeeTimelineTable
            day={day}
            employees={employees}
            tasks={tasks}
            locale={locale}
            t={t}
            onTaskClick={onTaskClick}
            embedded={embedded}
            expanded={expanded}
          />
        )}
      />

      <TasksTableSection
        icon={ClipboardList}
        title={t.tasksScheduleTaskShort}
        modalTitle={t.tasksScheduleByTask}
        accent="violet"
        t={t}
        renderContent={({ embedded, expanded }) => (
          <TaskTimelineTable
            day={day}
            tasks={tasks}
            locale={locale}
            t={t}
            onTaskClick={onTaskClick}
            embedded={embedded}
            expanded={expanded}
          />
        )}
      />
    </div>
  );
}
