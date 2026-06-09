/**
 * TaskAiInsightDisplay — icon + short label groups with names.
 */

import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import type { StaffTranslations } from "@/lib/staff-i18n";

export interface TaskAiInsightData {
  summary: string;
  finishedOnTime?: string[];
  finishedLate?: string[];
  notFinished?: string[];
  employeeNotes?: string[];
}

interface TaskAiInsightDisplayProps {
  data: TaskAiInsightData;
  t: StaffTranslations;
  compact?: boolean;
}

export function TaskAiInsightDisplay({ data, t, compact = false }: TaskAiInsightDisplayProps) {
  const onTime = data.finishedOnTime ?? [];
  const late = data.finishedLate ?? [];
  const notFinished = data.notFinished ?? [];
  const hasStructured = onTime.length > 0 || late.length > 0 || notFinished.length > 0;

  return (
    <div className={compact ? "space-y-2.5" : "space-y-3"}>
      {data.summary ? (
        <p className="rounded-xl bg-white/70 px-3 py-2 text-[13px] leading-relaxed text-slate-700 ring-1 ring-indigo-100/60">
          {data.summary}
        </p>
      ) : null}

      {hasStructured ? (
        <div className="space-y-2">
          {onTime.length > 0 && (
            <InsightGroup
              title={t.tasksAiOnTimeShort}
              items={onTime}
              icon={CheckCircle2}
              chipClass="bg-emerald-500 text-white"
              borderClass="border-emerald-100/80 bg-emerald-50/50 ring-1 ring-emerald-100/40"
              iconClass="text-emerald-600"
            />
          )}
          {late.length > 0 && (
            <InsightGroup
              title={t.tasksAiLateShort}
              items={late}
              icon={Clock}
              chipClass="bg-amber-500 text-white"
              borderClass="border-amber-100/80 bg-amber-50/50 ring-1 ring-amber-100/40"
              iconClass="text-amber-600"
            />
          )}
          {notFinished.length > 0 && (
            <InsightGroup
              title={t.tasksAiNotFinishedShort}
              items={notFinished}
              icon={AlertTriangle}
              chipClass="bg-rose-500 text-white"
              borderClass="border-rose-100/80 bg-rose-50/50 ring-1 ring-rose-100/40"
              iconClass="text-rose-600"
            />
          )}
        </div>
      ) : data.employeeNotes && data.employeeNotes.length > 0 ? (
        <ul className="space-y-1">
          {data.employeeNotes.map((note) => (
            <li key={note} className="rounded-lg bg-white/80 px-2.5 py-1.5 text-[13px] text-slate-700">
              {note}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function InsightGroup({
  title,
  items,
  icon: Icon,
  chipClass,
  borderClass,
  iconClass,
}: {
  title: string;
  items: string[];
  icon: typeof CheckCircle2;
  chipClass: string;
  borderClass: string;
  iconClass: string;
}) {
  return (
    <div className={`rounded-xl px-2.5 py-2 ${borderClass}`}>
      <div className="mb-1.5 flex items-center gap-1.5">
        <Icon className={`h-3.5 w-3.5 shrink-0 ${iconClass}`} />
        <span className="text-[10px] font-semibold text-slate-700">{title}</span>
        <span className={`ml-auto rounded-full px-1.5 py-0.5 text-[9px] font-bold tabular-nums ${chipClass}`}>
          {items.length}
        </span>
      </div>
      <ul className="space-y-0.5">
        {items.map((line) => (
          <li key={line} className="truncate text-[12px] leading-snug text-slate-800" title={line}>
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}
