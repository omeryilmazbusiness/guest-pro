/**
 * PassportScanOverlay — full-viewport HUD with dynamic frame feedback.
 */

import { useEffect, useState, type CSSProperties } from "react";
import {
  computePassportFrameRect,
  MRZ_BAND_FRAC,
  type FrameRect,
} from "@/lib/passport/frame-geometry";
import type { FrameFeedback, ScanStatus } from "@/hooks/use-passport-scan";
import { GuestProLogo } from "@/components/GuestProLogo";
import { cn } from "@/lib/utils";

interface PassportScanOverlayProps {
  status: ScanStatus;
  frameFeedback: FrameFeedback;
  instructionText: string;
  hotelName: string;
  scanTitle: string;
}

const CORNER = 34;
const STROKE = 3;
const MASK_ALPHA = "rgba(0,0,0,0.64)";

const FRAME_STYLES: Record<
  FrameFeedback,
  { ring: string; corner: string; mrz: string; glow: string }
> = {
  neutral: {
    ring: "ring-2 ring-white/75",
    corner: "bg-white",
    mrz: "border-white/30 bg-white/[0.04]",
    glow: "",
  },
  reading: {
    ring: "ring-2 ring-white/90",
    corner: "bg-white",
    mrz: "border-white/40 bg-white/[0.06]",
    glow: "",
  },
  success: {
    ring: "ring-[3px] ring-emerald-400",
    corner: "bg-emerald-400",
    mrz: "border-emerald-400/80 bg-emerald-400/10",
    glow: "shadow-[0_0_32px_8px_rgba(52,211,153,0.4)]",
  },
  error: {
    ring: "ring-[3px] ring-red-500",
    corner: "bg-red-500",
    mrz: "border-red-500/70 bg-red-500/10",
    glow: "shadow-[0_0_28px_6px_rgba(239,68,68,0.35)]",
  },
};

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

function CornerGuides({
  rect,
  cornerClass,
}: {
  rect: FrameRect;
  cornerClass: string;
}) {
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
          className={cn(
            "absolute rounded-sm pointer-events-none transition-colors duration-300",
            cornerClass,
          )}
          style={style}
          aria-hidden="true"
        />
      ))}
    </>
  );
}

function statusLabel(status: ScanStatus, frameFeedback: FrameFeedback): string {
  if (status === "requesting") return "Starting camera…";
  if (frameFeedback === "success") return "✓ Passport read";
  if (frameFeedback === "error") return "Align MRZ lines";
  if (frameFeedback === "reading") return "Reading…";
  return "Scanning";
}

export function PassportScanOverlay({
  status,
  frameFeedback,
  instructionText,
  hotelName,
  scanTitle,
}: PassportScanOverlayProps) {
  const rect = useFrameRect();
  const isScanning = status === "scanning";
  const isRequesting = status === "requesting";
  const styles = FRAME_STYLES[frameFeedback];

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

      <CornerGuides rect={rect} cornerClass={styles.corner} />

      <div
        className={cn(
          "absolute rounded-2xl pointer-events-none transition-all duration-300",
          styles.ring,
          styles.glow,
        )}
        style={{ left: x, top: y, width, height }}
        aria-hidden="true"
      />

      <div
        className={cn(
          "absolute rounded-lg border border-dashed pointer-events-none transition-all duration-300",
          styles.mrz,
        )}
        style={{
          left: x + mrzInset,
          top: mrzTop,
          width: width - mrzInset * 2,
          height: mrzHeight,
        }}
        aria-hidden="true"
      />

      {isScanning && frameFeedback !== "error" && (
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

      <header className="passport-onboarding absolute top-0 inset-x-0 pt-[max(1rem,env(safe-area-inset-top))] px-5 pb-3 flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          <GuestProLogo variant="header" className="w-6 h-6 invert opacity-85" />
          <span className="kiosk-brand-hotel-name text-white/55">{hotelName}</span>
        </div>
        <h1 className="passport-luxury-title text-lg">{scanTitle}</h1>
      </header>

      {(isScanning || isRequesting) && (
        <div
          className={cn(
            "absolute right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md transition-colors duration-300",
            frameFeedback === "success" && "bg-emerald-400 text-zinc-900",
            frameFeedback === "error" && "bg-red-500/90 text-white",
            (frameFeedback === "neutral" || frameFeedback === "reading") &&
              "bg-black/50 text-white border border-white/10",
          )}
          style={{ top: Math.max(12, y - 44) }}
        >
          {frameFeedback === "reading" ? (
            <span className="relative flex h-3 w-3">
              <span className="absolute inset-0 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            </span>
          ) : frameFeedback === "error" ? null : (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
          )}
          {statusLabel(status, frameFeedback)}
        </div>
      )}

      <footer className="absolute inset-x-0 bottom-0 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] flex justify-center">
        <p
          className={cn(
            "passport-onboarding passport-luxury-body text-sm font-medium text-center max-w-xs transition-colors duration-300",
            frameFeedback === "success" && "text-emerald-400",
            frameFeedback === "error" && "text-red-400",
            (frameFeedback === "neutral" || frameFeedback === "reading") &&
              "text-white/90",
          )}
        >
          {frameFeedback === "error"
            ? "Move closer — MRZ lines must be clear at the bottom"
            : instructionText}
        </p>
      </footer>
    </div>
  );
}
