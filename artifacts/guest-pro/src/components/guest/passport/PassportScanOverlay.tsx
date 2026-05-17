/**
 * PassportScanOverlay — full-viewport HUD with horizontal passport cutout.
 */

import { useEffect, useState, type CSSProperties } from "react";
import {
  computePassportFrameRect,
  MRZ_BAND_FRAC,
  type FrameRect,
} from "@/lib/passport/frame-geometry";
import type { ScanStatus } from "@/hooks/use-passport-scan";
import { GuestProLogo } from "@/components/GuestProLogo";
import { cn } from "@/lib/utils";

interface PassportScanOverlayProps {
  status: ScanStatus;
  instructionText: string;
  hotelName: string;
  scanTitle: string;
}

const CORNER = 34;
const STROKE = 3;
const MASK_ALPHA = "rgba(0,0,0,0.64)";

function useFrameRect(): FrameRect {
  const [rect, setRect] = useState<FrameRect>(() =>
    computePassportFrameRect(
      typeof window !== "undefined" ? window.innerWidth : 390,
      typeof window !== "undefined" ? window.innerHeight : 844,
    ),
  );

  useEffect(() => {
    function update() {
      setRect(computePassportFrameRect(window.innerWidth, window.innerHeight));
    }
    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return rect;
}

function CornerGuides({ rect, locked }: { rect: FrameRect; locked: boolean }) {
  const bar = locked ? "bg-emerald-400" : "bg-white";
  const { x, y, width: w, height: h } = rect;

  const bars: CSSProperties[] = [
    { left: x, top: y, width: CORNER, height: STROKE },
    { left: x, top: y, width: STROKE, height: CORNER },
    { left: x + w - CORNER, top: y, width: CORNER, height: STROKE },
    { left: x + w - STROKE, top: y, width: STROKE, height: CORNER },
    { left: x, top: y + h - STROKE, width: CORNER, height: STROKE },
    { left: x, top: y + h - CORNER, width: STROKE, height: CORNER },
    { left: x + w - CORNER, top: y + h - STROKE, width: CORNER, height: STROKE },
    { left: x + w - STROKE, top: y + h - CORNER, width: STROKE, height: CORNER },
  ];

  return (
    <>
      {bars.map((style, i) => (
        <div
          key={i}
          className={cn("absolute rounded-sm pointer-events-none", bar)}
          style={style}
          aria-hidden="true"
        />
      ))}
    </>
  );
}

export function PassportScanOverlay({
  status,
  instructionText,
  hotelName,
  scanTitle,
}: PassportScanOverlayProps) {
  const rect = useFrameRect();
  const isScanning = status === "scanning";
  const isLocked = status === "locked";
  const isRequesting = status === "requesting";

  const { x, y, width, height } = rect;
  const mrzTop = y + height * (1 - MRZ_BAND_FRAC);
  const mrzHeight = height - (mrzTop - y) - 8;
  const mrzInset = 10;

  return (
    <div className="absolute inset-0 z-10 pointer-events-none select-none">
      <div
        className="absolute rounded-2xl"
        style={{
          left: x,
          top: y,
          width,
          height,
          boxShadow: `0 0 0 9999px ${MASK_ALPHA}`,
        }}
        aria-hidden="true"
      />

      <CornerGuides rect={rect} locked={isLocked} />

      <div
        className={cn(
          "absolute rounded-2xl pointer-events-none transition-all duration-500",
          isLocked
            ? "ring-[3px] ring-emerald-400 shadow-[0_0_32px_8px_rgba(52,211,153,0.35)]"
            : "ring-2 ring-white/75",
        )}
        style={{ left: x, top: y, width, height }}
        aria-hidden="true"
      />

      <div
        className={cn(
          "absolute rounded-lg border border-dashed pointer-events-none transition-colors duration-300",
          isLocked
            ? "border-emerald-400/70 bg-emerald-400/5"
            : "border-white/30 bg-white/[0.04]",
        )}
        style={{
          left: x + mrzInset,
          top: mrzTop,
          width: width - mrzInset * 2,
          height: mrzHeight,
        }}
        aria-hidden="true"
      />

      {isScanning && (
        <div
          className="absolute overflow-hidden rounded-lg"
          style={{
            left: x + mrzInset,
            top: mrzTop,
            width: width - mrzInset * 2,
            height: mrzHeight,
          }}
          aria-hidden="true"
        >
          <div className="passport-scan-line" />
        </div>
      )}

      {isLocked && (
        <div
          className="absolute flex items-center justify-center animate-in zoom-in-50 duration-300"
          style={{ left: x, top: y, width, height }}
        >
          <div className="rounded-full bg-emerald-400/20 p-4 backdrop-blur-sm">
            <svg
              className="w-10 h-10 text-emerald-400"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      )}

      <header className="absolute top-0 inset-x-0 pt-[max(1rem,env(safe-area-inset-top))] px-5 flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 opacity-70">
          <GuestProLogo variant="header" className="w-5 h-5 invert" />
          <span className="text-[11px] font-medium text-white/80 tracking-widest uppercase">
            {hotelName}
          </span>
        </div>
        <h1 className="text-lg font-semibold text-white tracking-wide">{scanTitle}</h1>
      </header>

      {(isScanning || isLocked || isRequesting) && (
        <div
          className={cn(
            "absolute right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md",
            isLocked
              ? "bg-emerald-400 text-zinc-900"
              : "bg-black/50 text-white border border-white/10",
          )}
          style={{ top: Math.max(12, y - 44) }}
        >
          {isRequesting ? (
            "Starting camera…"
          ) : isLocked ? (
            "✓ Detected"
          ) : (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              Scanning
            </>
          )}
        </div>
      )}

      <footer className="absolute inset-x-0 bottom-0 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] flex justify-center">
        <p
          className={cn(
            "text-sm font-medium text-center tracking-wide max-w-xs transition-colors duration-300",
            isLocked ? "text-emerald-400" : "text-white/90",
          )}
        >
          {instructionText}
        </p>
      </footer>
    </div>
  );
}
