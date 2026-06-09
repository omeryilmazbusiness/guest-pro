/**
 * IosTimeWheelPicker — hour / minute / AM-PM scroll wheels (iOS-style).
 */

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { IosScrollWheel } from "@/components/ui/ios-scroll-wheel";
import {
  clampScheduleTime,
  formatWheelHour12,
  formatWheelHour24,
  formatWheelMinute,
  formatWheelPeriod,
  from24Hour,
  getWheelHour24Options,
  localeUses12Hour,
  snapMinute,
  timeToMinutes,
  to24Hour,
  WHEEL_HOURS_12,
  WHEEL_MINUTE_STEPS,
  type WheelMinute,
  type WheelPeriod,
} from "@/lib/ios-time-wheel";

const PERIODS: WheelPeriod[] = ["AM", "PM"];

interface IosTimeWheelPickerProps {
  hour24: number;
  minute: WheelMinute;
  onChange: (hour24: number, minute: WheelMinute) => void;
  locale: string;
  label: string;
  minMinutes?: number;
  className?: string;
}

export function IosTimeWheelPicker({
  hour24,
  minute,
  onChange,
  locale,
  label,
  minMinutes,
  className,
}: IosTimeWheelPickerProps) {
  const use12h = localeUses12Hour(locale);
  const { hour12, period } = from24Hour(hour24);

  const hour24Options = useMemo(() => getWheelHour24Options(), []);

  const applyTime = (h24: number, min: WheelMinute) => {
    let next = clampScheduleTime(h24, min);
    if (minMinutes != null && timeToMinutes(next.hour24, next.minute) < minMinutes) {
      next = clampScheduleTime(Math.floor(minMinutes / 60), snapMinute(minMinutes % 60));
    }
    onChange(next.hour24, next.minute);
  };

  const handle12hChange = (h12: number, min: WheelMinute, per: WheelPeriod) => {
    applyTime(to24Hour(h12, per), min);
  };

  return (
    <div className={cn("rounded-xl border border-zinc-100 bg-white/80 p-2", className)}>
      <p className="mb-1 text-center text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
        {label}
      </p>
      <div className="flex items-stretch gap-0.5">
        {use12h ? (
          <>
            <IosScrollWheel
              items={WHEEL_HOURS_12}
              value={hour12 as (typeof WHEEL_HOURS_12)[number]}
              onChange={(h12) => handle12hChange(h12, minute, period)}
              formatItem={formatWheelHour12}
              ariaLabel={`${label} hour`}
            />
            <div className="w-px shrink-0 bg-zinc-100" aria-hidden />
            <IosScrollWheel
              items={WHEEL_MINUTE_STEPS}
              value={minute}
              onChange={(min) => handle12hChange(hour12, min, period)}
              formatItem={formatWheelMinute}
              ariaLabel={`${label} minute`}
            />
            <div className="w-px shrink-0 bg-zinc-100" aria-hidden />
            <IosScrollWheel
              items={PERIODS}
              value={period}
              onChange={(per) => handle12hChange(hour12, minute, per)}
              formatItem={(p) => formatWheelPeriod(p, locale)}
              ariaLabel={`${label} period`}
            />
          </>
        ) : (
          <>
            <IosScrollWheel
              items={hour24Options}
              value={hour24}
              onChange={(h) => applyTime(h, minute)}
              formatItem={formatWheelHour24}
              ariaLabel={`${label} hour`}
            />
            <div className="w-px shrink-0 bg-zinc-100" aria-hidden />
            <IosScrollWheel
              items={WHEEL_MINUTE_STEPS}
              value={minute}
              onChange={(min) => applyTime(hour24, min)}
              formatItem={formatWheelMinute}
              ariaLabel={`${label} minute`}
            />
          </>
        )}
      </div>
    </div>
  );
}
