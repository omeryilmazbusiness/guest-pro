import { useCallback, useRef } from "react";

export interface UseLongPressOptions {
  /** Short tap / click */
  onTap?: () => void;
  /** Fired on pointer-up after hold threshold (still inside user gesture) */
  onLongPress?: () => void;
  /** Hold duration before long-press arms (ms) */
  delayMs?: number;
  onHoldStart?: () => void;
  onHoldEnd?: () => void;
}

/**
 * Distinguishes tap vs long-press without relying on click.
 * Long-press actions run on pointerup so haptics stay inside the user gesture.
 */
export function useLongPress({
  onTap,
  onLongPress,
  delayMs = 420,
  onHoldStart,
  onHoldEnd,
}: UseLongPressOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longArmedRef = useRef(false);
  const movedRef = useRef(false);
  const startRef = useRef({ x: 0, y: 0 });

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      longArmedRef.current = false;
      movedRef.current = false;
      startRef.current = { x: e.clientX, y: e.clientY };
      clearTimer();
      onHoldEnd?.();

      timerRef.current = setTimeout(() => {
        if (movedRef.current) return;
        longArmedRef.current = true;
        onHoldStart?.();
      }, delayMs);
    },
    [clearTimer, delayMs, onHoldStart, onHoldEnd],
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const dx = Math.abs(e.clientX - startRef.current.x);
    const dy = Math.abs(e.clientY - startRef.current.y);
    if (dx > 10 || dy > 10) {
      movedRef.current = true;
      if (longArmedRef.current) {
        longArmedRef.current = false;
        onHoldEnd?.();
      }
      clearTimer();
    }
  }, [clearTimer, onHoldEnd]);

  const finish = useCallback(
    (cancelled: boolean) => {
      clearTimer();
      const wasLong = longArmedRef.current;
      longArmedRef.current = false;
      onHoldEnd?.();

      if (cancelled || movedRef.current) return;

      if (wasLong) {
        onLongPress?.();
      } else {
        onTap?.();
      }
    },
    [clearTimer, onHoldEnd, onLongPress, onTap],
  );

  const onPointerUp = useCallback(() => finish(false), [finish]);
  const onPointerLeave = useCallback(() => finish(true), [finish]);
  const onPointerCancel = useCallback(() => finish(true), [finish]);

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerLeave,
    onPointerCancel,
  };
}
