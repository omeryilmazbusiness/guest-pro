/**
 * IosScrollWheel — snap-scroll column mimicking iOS time picker wheels.
 */

import { useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export const WHEEL_ITEM_HEIGHT = 40;
const WHEEL_VISIBLE_ROWS = 5;

export interface IosScrollWheelProps<T extends string | number> {
  items: readonly T[];
  value: T;
  onChange: (value: T) => void;
  formatItem: (item: T) => string;
  ariaLabel: string;
  className?: string;
}

export function IosScrollWheel<T extends string | number>({
  items,
  value,
  onChange,
  formatItem,
  ariaLabel,
  className,
}: IosScrollWheelProps<T>) {
  const ref = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const padding = ((WHEEL_VISIBLE_ROWS - 1) / 2) * WHEEL_ITEM_HEIGHT;

  const scrollToValue = useCallback(
    (v: T, behavior: ScrollBehavior = "auto") => {
      const el = ref.current;
      if (!el) return;
      const idx = items.indexOf(v);
      if (idx < 0) return;
      el.scrollTo({ top: idx * WHEEL_ITEM_HEIGHT, behavior });
    },
    [items],
  );

  useEffect(() => {
    scrollToValue(value);
  }, [value, scrollToValue]);

  const syncFromScroll = useCallback(() => {
    const el = ref.current;
    if (!el || items.length === 0) return;
    const idx = Math.round(el.scrollTop / WHEEL_ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(items.length - 1, idx));
    const next = items[clamped];
    if (next !== value) onChange(next);
  }, [items, onChange, value]);

  const handleScroll = () => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(syncFromScroll);
  };

  const handleScrollEnd = () => {
    const el = ref.current;
    if (!el) return;
    const idx = Math.round(el.scrollTop / WHEEL_ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(items.length - 1, idx));
    el.scrollTo({ top: clamped * WHEEL_ITEM_HEIGHT, behavior: "smooth" });
    const next = items[clamped];
    if (next !== value) onChange(next);
  };

  return (
    <div className={cn("relative flex-1 min-w-0", className)}>
      <div
        className="pointer-events-none absolute inset-x-0 top-1/2 z-10 h-10 -translate-y-1/2 rounded-lg border border-zinc-200/80 bg-zinc-100/50"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-20 h-14 bg-gradient-to-b from-white via-white/90 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-14 bg-gradient-to-t from-white via-white/90 to-transparent"
        aria-hidden
      />

      <div
        ref={ref}
        role="listbox"
        aria-label={ariaLabel}
        aria-activedescendant={`wheel-${String(value)}`}
        onScroll={handleScroll}
        onTouchEnd={handleScrollEnd}
        onMouseUp={handleScrollEnd}
        className="h-[200px] overflow-y-auto overscroll-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        style={{
          scrollSnapType: "y mandatory",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <div style={{ height: padding }} aria-hidden />
        {items.map((item) => {
          const selected = item === value;
          return (
            <div
              key={String(item)}
              id={`wheel-${String(item)}`}
              role="option"
              aria-selected={selected}
              className={cn(
                "flex h-10 shrink-0 snap-center items-center justify-center text-[15px] font-medium tabular-nums transition-colors",
                selected ? "text-zinc-900 scale-105" : "text-zinc-400",
              )}
              style={{ height: WHEEL_ITEM_HEIGHT }}
            >
              {formatItem(item)}
            </div>
          );
        })}
        <div style={{ height: padding }} aria-hidden />
      </div>
    </div>
  );
}
