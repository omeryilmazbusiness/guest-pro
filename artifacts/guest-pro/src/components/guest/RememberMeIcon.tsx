import { User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRememberMeSchedule } from "@/hooks/use-remember-me-schedule";

const SIZE = 56;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = 22;
const CIRC = 2 * Math.PI * R;

function ClockRing({
  progress,
  urgent,
  idle,
}: {
  progress: number;
  urgent?: boolean;
  idle?: boolean;
}) {
  const clamped = Math.min(1, Math.max(0, progress));
  const offset = CIRC * (1 - clamped);
  const stroke = urgent ? "#f59e0b" : idle ? "#cbd5e1" : "#0ea5e9";

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="absolute inset-0 h-full w-full"
      aria-hidden
    >
      {/* Clock tick marks at 12, 3, 6, 9 */}
      {[0, 90, 180, 270].map((deg) => {
        const rad = ((deg - 90) * Math.PI) / 180;
        const x1 = CX + (R - 4) * Math.cos(rad);
        const y1 = CY + (R - 4) * Math.sin(rad);
        const x2 = CX + (R - 1) * Math.cos(rad);
        const y2 = CY + (R - 1) * Math.sin(rad);
        return (
          <line
            key={deg}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#d4d4d8"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        );
      })}
      {/* Track ring */}
      <circle
        cx={CX}
        cy={CY}
        r={R}
        fill="none"
        stroke="#e4e4e7"
        strokeWidth="3.5"
      />
      {/* Progress ring — fills clockwise from 12 o'clock like a timer */}
      <circle
        cx={CX}
        cy={CY}
        r={R}
        fill="none"
        stroke={stroke}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray={CIRC}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${CX} ${CY})`}
        className="transition-[stroke-dashoffset] duration-700 ease-out"
      />
    </svg>
  );
}

export function RememberMeIcon({ className }: { className?: string }) {
  const { active, progress, urgent } = useRememberMeSchedule();
  const idle = !active;

  return (
    <span
      className={cn("relative inline-flex h-14 w-14 items-center justify-center", className)}
      aria-hidden
    >
      <ClockRing progress={idle ? 0 : progress} urgent={urgent} idle={idle} />
      <User
        className={cn(
          "relative h-7 w-7",
          urgent ? "text-amber-600" : "text-sky-700",
        )}
        strokeWidth={1.85}
      />
    </span>
  );
}
