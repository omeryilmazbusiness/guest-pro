/**
 * PassportScanOverlay — soft rounded frame HUD with frameless status label.
 */

import { useEffect, useState } from "react";
import {
  computePassportFrameRect,
  MRZ_BAND_FRAC,
  type FrameRect,
} from "@/lib/passport/frame-geometry";
import type { FrameFeedback, ScanStatus } from "@/hooks/use-passport-scan";
import type { PassportOnboardingStrings } from "@/lib/passport/onboarding/types";
import { GuestProLogo } from "@/components/GuestProLogo";
import { cn } from "@/lib/utils";

interface PassportScanOverlayProps {
  status: ScanStatus;
  frameFeedback: FrameFeedback;
  instructionText: string;
  hotelName: string;
  scanTitle: string;
  statusLabels: Pick<
    PassportOnboardingStrings,
    | "scanStatusRequesting"
    | "scanStatusScanning"
    | "scanStatusReading"
    | "scanStatusSuccess"
    | "scanStatusError"
    | "scanAlignError"
  >;
}

const FRAME_RADIUS = 28;
const MASK_ALPHA = "rgba(0,0,0,0.62)";

const FRAME_STYLES: Record<
  FrameFeedback,
  { ring: string; mrz: string; glow: string }
> = {
  neutral: {
    ring: "ring-[1.5px] ring-white/55",
    mrz: "border-white/25 bg-white/[0.03]",
    glow: "",
  },
  reading: {
    ring: "ring-[1.5px] ring-white/70",
    mrz: "border-white/35 bg-white/[0.05]",
    glow: "",
  },
  success: {
    ring: "ring-2 ring-emerald-400/90",
    mrz: "border-emerald-400/60 bg-emerald-400/8",
    glow: "shadow-[0_0_40px_10px_rgba(52,211,153,0.25)]",
  },
  error: {
    ring: "ring-2 ring-red-400/85",
    mrz: "border-red-400/55 bg-red-400/8",
    glow: "shadow-[0_0_32px_8px_rgba(248,113,113,0.2)]",
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

function resolveStatusLabel(
  status: ScanStatus,
  frameFeedback: FrameFeedback,
  labels: PassportScanOverlayProps["statusLabels"],
): string {
  if (status === "requesting") return labels.scanStatusRequesting;
  if (frameFeedback === "success") return labels.scanStatusSuccess;
  if (frameFeedback === "error") return labels.scanStatusError;
  if (frameFeedback === "reading") return labels.scanStatusReading;
  return labels.scanStatusScanning;
}

export function PassportScanOverlay({
  status,
  frameFeedback,
  instructionText,
  hotelName,
  scanTitle,
  statusLabels,
}: PassportScanOverlayProps) {
  const rect = useFrameRect();
  const isScanning = status === "scanning";
  const isRequesting = status === "requesting";
  const styles = FRAME_STYLES[frameFeedback];

  const { x, y, width, height } = rect;
  const mrzTop = y + height * (1 - MRZ_BAND_FRAC);
  const mrzHeight = height - (mrzTop - y) - 8;
  const mrzInset = 12;

  const statusText = resolveStatusLabel(status, frameFeedback, statusLabels);
  const showStatus = isScanning || isRequesting;

  return (
    <div className="absolute inset-0 z-10 pointer-events-none select-none">
      {/* Soft rounded cutout mask */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: x,
          top: y,
          width,
          height,
          borderRadius: FRAME_RADIUS,
          boxShadow: `0 0 0 9999px ${MASK_ALPHA}`,
        }}
        aria-hidden="true"
      />

      {/* Soft frame ring */}
      <div
        className={cn(
          "absolute pointer-events-none transition-all duration-500 ease-out",
          styles.ring,
          styles.glow,
        )}
        style={{
          left: x,
          top: y,
          width,
          height,
          borderRadius: FRAME_RADIUS,
        }}
        aria-hidden="true"
      />

      {/* MRZ guide — soft dashed inner zone */}
      <div
        className={cn(
          "absolute pointer-events-none border border-dashed transition-all duration-500 ease-out",
          styles.mrz,
        )}
        style={{
          left: x + mrzInset,
          top: mrzTop,
          width: width - mrzInset * 2,
          height: mrzHeight,
          borderRadius: FRAME_RADIUS * 0.65,
        }}
        aria-hidden="true"
      />

      {isScanning && frameFeedback !== "error" && (
        <div
          className="absolute overflow-hidden pointer-events-none"
          style={{
            left: x + mrzInset,
            top: mrzTop,
            width: width - mrzInset * 2,
            height: mrzHeight,
            borderRadius: FRAME_RADIUS * 0.65,
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

      {/* Frameless modern status — centered above frame */}
      {showStatus && (
        <div
          className="absolute inset-x-0 flex items-center justify-center gap-2.5 px-6"
          style={{ top: Math.max(16, y - 52) }}
        >
          {frameFeedback === "reading" && (
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/75 animate-pulse"
              aria-hidden="true"
            />
          )}
          {frameFeedback !== "error" && frameFeedback !== "reading" && (
            <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/50 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-white/80" />
            </span>
          )}
          <span
            className={cn(
              "passport-luxury-label text-[11px] tracking-[0.22em] transition-colors duration-300",
              frameFeedback === "success" && "text-emerald-400/95",
              frameFeedback === "error" && "text-red-400/95",
              (frameFeedback === "neutral" || frameFeedback === "reading") &&
                "text-white/75",
            )}
          >
            {statusText}
          </span>
        </div>
      )}

      <footer className="absolute inset-x-0 bottom-0 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] flex justify-center">
        <p
          className={cn(
            "passport-onboarding passport-luxury-body text-sm font-medium text-center max-w-xs transition-colors duration-300",
            frameFeedback === "success" && "text-emerald-400",
            frameFeedback === "error" && "text-red-400",
            (frameFeedback === "neutral" || frameFeedback === "reading") &&
              "text-white/88",
          )}
        >
          {frameFeedback === "error" ? statusLabels.scanAlignError : instructionText}
        </p>
      </footer>
    </div>
  );
}
