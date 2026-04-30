/**
 * ScanFrame
 *
 * Renders the camera viewfinder with a passport-shaped overlay frame.
 * Frame border turns green when status === "locked".
 * Includes the sweeping scan line animation while status === "scanning".
 *
 * Single Responsibility: visual frame + video element only.
 * All scanning logic lives in usePassportScan.
 */

import type { ScanStatus } from "@/hooks/use-passport-scan";
import { cn } from "@/lib/utils";

interface ScanFrameProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  status: ScanStatus;
  instructionText: string;
}

export function ScanFrame({ videoRef, status, instructionText }: ScanFrameProps) {
  const isLocked = status === "locked";
  const isScanning = status === "scanning";

  return (
    <div className="flex flex-col items-center gap-5 w-full select-none">

      {/* ── Viewport wrapper ──────────────────────────────────────────────── */}
      <div className="relative w-full max-w-sm aspect-3/2 overflow-hidden rounded-2xl bg-zinc-900 shadow-2xl shadow-black/50">

        {/* Live camera feed */}
        <video
          ref={videoRef}
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
          aria-hidden="true"
        />

        {/* Dark vignette overlay */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 50%, transparent 55%, rgba(0,0,0,0.65) 100%)",
          }}
        />

        {/* ── Passport frame corners ───────────────────────────────────────── */}
        {/* We draw the 4 corner L-shapes and a transparent centre rectangle */}
        <div
          className={cn(
            "absolute inset-[10%] rounded-lg pointer-events-none",
            "transition-all duration-500",
            isLocked
              ? "ring-4 ring-green-400 shadow-[0_0_24px_6px_rgba(74,222,128,0.35)]"
              : "ring-2 ring-white/70",
          )}
          aria-hidden="true"
        >
          {/* Scanning beam — only while actively scanning */}
          {isScanning && (
            <div className="passport-scan-line" aria-hidden="true" />
          )}

          {/* Locked checkmark */}
          {isLocked && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rounded-full bg-green-400/20 p-3 animate-in zoom-in-50 duration-300">
                <svg
                  className="w-8 h-8 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  viewBox="0 0 24 24"
                  aria-label="Passport detected"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Status badge — top-right */}
        {(isScanning || isLocked) && (
          <div
            className={cn(
              "absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold",
              isLocked
                ? "bg-green-400 text-zinc-900"
                : "bg-zinc-900/70 text-white backdrop-blur-sm",
            )}
          >
            {isLocked ? null : (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
              </span>
            )}
            {isLocked ? "✓ Locked" : "Scanning"}
          </div>
        )}
      </div>

      {/* ── Instruction label ─────────────────────────────────────────────── */}
      <p
        className={cn(
          "text-sm text-center font-medium tracking-wide transition-colors duration-300",
          isLocked ? "text-green-400" : "text-zinc-400",
        )}
      >
        {instructionText}
      </p>
    </div>
  );
}
