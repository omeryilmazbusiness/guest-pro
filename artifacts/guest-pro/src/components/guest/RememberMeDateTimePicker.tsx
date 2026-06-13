import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { IosScrollWheel } from "@/components/ui/ios-scroll-wheel";
import {
  formatRememberMeDayLabel,
  getRememberMeDayKeys,
  getRememberMeHourOptions,
  REMEMBER_ME_MINUTES,
  type RememberMeMinute,
} from "@/lib/remember-me-datetime";

interface RememberMeDateTimePickerProps {
  dayKey: string;
  hour24: number;
  minute: RememberMeMinute;
  locale: string;
  onChange: (dayKey: string, hour24: number, minute: RememberMeMinute) => void;
  className?: string;
}

export function RememberMeDateTimePicker({
  dayKey,
  hour24,
  minute,
  locale,
  onChange,
  className,
}: RememberMeDateTimePickerProps) {
  const dayKeys = useMemo(() => getRememberMeDayKeys(), []);
  const hours = useMemo(() => getRememberMeHourOptions(), []);

  const safeDay = dayKeys.includes(dayKey) ? dayKey : dayKeys[0]!;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-zinc-100 bg-zinc-50/80 p-2 shadow-inner",
        className,
      )}
    >
      <div className="flex items-stretch gap-0.5">
        <IosScrollWheel
          items={dayKeys}
          value={safeDay}
          onChange={(d) => onChange(d, hour24, minute)}
          formatItem={(d) => formatRememberMeDayLabel(d, locale)}
          ariaLabel="Date"
          className="flex-[1.4]"
        />
        <div className="w-px shrink-0 bg-zinc-200/80" aria-hidden />
        <IosScrollWheel
          items={hours}
          value={hour24}
          onChange={(h) => onChange(safeDay, h, minute)}
          formatItem={(h) => String(h).padStart(2, "0")}
          ariaLabel="Hour"
        />
        <div className="flex w-3 shrink-0 items-center justify-center text-[15px] font-semibold text-zinc-400">
          :
        </div>
        <IosScrollWheel
          items={REMEMBER_ME_MINUTES}
          value={minute}
          onChange={(m) => onChange(safeDay, hour24, m)}
          formatItem={(m) => String(m).padStart(2, "0")}
          ariaLabel="Minute"
        />
      </div>
    </div>
  );
}
