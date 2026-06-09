/**
 * TaskSchedulePicker — date + iOS-style start/end time wheels.
 */

import { useMemo, useState } from "react";
import { CalendarDays, Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StaffTranslations } from "@/lib/staff-i18n";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { IosTimeWheelPicker } from "@/components/manager/tasks/IosTimeWheelPicker";
import {
  minEndMinutes,
  parseTimeFromDatetimeLocal,
  timeToMinutes,
  type WheelMinute,
} from "@/lib/ios-time-wheel";
import {
  formatScheduleDateLabel,
  formatScheduleTimeLabel,
  mergeDatetimeLocal,
  splitDatetimeLocal,
} from "@/lib/tasks-schedule";

export interface TaskSchedulePickerProps {
  startValue: string;
  endValue: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  locale: string;
  t: StaffTranslations;
}

export function TaskSchedulePicker({
  startValue,
  endValue,
  onStartChange,
  onEndChange,
  locale,
  t,
}: TaskSchedulePickerProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);

  const startParts = useMemo(() => splitDatetimeLocal(startValue), [startValue]);
  const endParts = useMemo(() => splitDatetimeLocal(endValue), [endValue]);
  const selectedDate = startParts?.date ?? new Date();

  const startTime = useMemo(
    () => parseTimeFromDatetimeLocal(startValue),
    [startValue],
  );
  const endTime = useMemo(() => parseTimeFromDatetimeLocal(endValue), [endValue]);

  const startMinutes = timeToMinutes(startTime.hour24, startTime.minute);
  const minEnd = minEndMinutes(startMinutes);

  const summary = useMemo(() => {
    if (!startValue || !endValue) return null;
    return `${formatScheduleTimeLabel(startValue, locale)} – ${formatScheduleTimeLabel(endValue, locale)}`;
  }, [startValue, endValue, locale]);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    onStartChange(mergeDatetimeLocal(date, startTime.hour24, startTime.minute));
    onEndChange(mergeDatetimeLocal(date, endTime.hour24, endTime.minute));
    setCalendarOpen(false);
  };

  const handleStartTime = (hour24: number, minute: WheelMinute) => {
    const nextStart = mergeDatetimeLocal(selectedDate, hour24, minute);
    onStartChange(nextStart);
    const nextStartMin = timeToMinutes(hour24, minute);
    const endMin = timeToMinutes(endTime.hour24, endTime.minute);
    if (endMin <= nextStartMin) {
      const bumped = minEndMinutes(nextStartMin);
      onEndChange(
        mergeDatetimeLocal(
          selectedDate,
          Math.floor(bumped / 60),
          (bumped % 60) as WheelMinute,
        ),
      );
    }
  };

  const handleEndTime = (hour24: number, minute: WheelMinute) => {
    onEndChange(mergeDatetimeLocal(selectedDate, hour24, minute));
  };

  return (
    <div className="space-y-3 rounded-2xl border border-zinc-100 bg-zinc-50/40 p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
        <CalendarDays className="h-3.5 w-3.5" />
        {t.tasksScheduleWhen}
      </div>

      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full justify-start rounded-xl border-zinc-100 bg-white px-3 text-sm font-medium text-zinc-900 shadow-none hover:bg-zinc-50"
          >
            <CalendarDays className="mr-2 h-4 w-4 text-zinc-400" />
            <span className="truncate">{formatScheduleDateLabel(selectedDate, locale)}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="z-[130] w-auto rounded-xl border-zinc-100 p-0 shadow-xl"
          align="start"
          sideOffset={6}
        >
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            defaultMonth={selectedDate}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <IosTimeWheelPicker
          hour24={startTime.hour24}
          minute={startTime.minute}
          onChange={handleStartTime}
          locale={locale}
          label={t.tasksStart}
        />
        <IosTimeWheelPicker
          hour24={endTime.hour24}
          minute={endTime.minute}
          onChange={handleEndTime}
          locale={locale}
          label={t.tasksEnd}
          minMinutes={minEnd}
        />
      </div>

      {summary && (
        <div
          className={cn(
            "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm",
            timeToMinutes(endTime.hour24, endTime.minute) > startMinutes
              ? "border-zinc-100 bg-white text-zinc-700"
              : "border-amber-200 bg-amber-50 text-amber-900",
          )}
        >
          <Clock3 className="h-4 w-4 shrink-0 opacity-60" />
          <span className="font-medium tabular-nums">{summary}</span>
        </div>
      )}
    </div>
  );
}
