/**
 * PassportScanPage — /guest/passport-scan
 *
 * TRUE PUBLIC ROUTE — no auth required.
 * Opened on the guest's phone after scanning the registration QR on the kiosk.
 *
 * Flow:
 *   idle       → auto-starts camera on mount
 *   requesting → waiting for getUserMedia permission
 *   scanning   → live camera + passport frame overlay + Tesseract OCR loop
 *   locked     → MRZ parsed → result QR + "Show to reception" card
 *   error      → camera denied / unavailable → retry button
 *
 * Locale is read from localStorage (set by the welcoming kiosk language
 * selector) so the guest sees the correct language automatically.
 */

import { useEffect } from "react";
import { GuestProLogo } from "@/components/GuestProLogo";
import { ScanFrame } from "@/components/guest/passport/ScanFrame";
import { ScanResult } from "@/components/guest/passport/ScanResult";
import { usePassportScan } from "@/hooks/use-passport-scan";
import { getPersistedWelcomingLocale } from "@/lib/welcoming/welcoming-locale";
import { getWelcomingStrings, HOTEL_CONFIG } from "@/lib/welcoming/hotel-content";
import { cn } from "@/lib/utils";
import { Camera, AlertTriangle, RefreshCw } from "lucide-react";

export default function PassportScanPage() {
  const locale = getPersistedWelcomingLocale();
  const s = getWelcomingStrings(locale);
  const dir = locale === "ur" ? "rtl" : "ltr";

  const { videoRef, canvasRef, status, passportData, errorMessage, start, reset } =
    usePassportScan();

  // Auto-start camera on mount — no extra tap required
  useEffect(() => {
    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isLocked = status === "locked";
  const isError = status === "error";

  return (
    <div dir={dir} className="min-h-dvh bg-zinc-950 flex flex-col items-center">

      {/* Header */}
      <header className="w-full px-5 pt-10 pb-4 flex items-center justify-center gap-2">
        <GuestProLogo variant="header" className="w-5 h-5 invert opacity-60" />
        <span className="text-xs font-medium text-zinc-500 tracking-wider uppercase">
          {HOTEL_CONFIG.name}
        </span>
      </header>

      {/* Title */}
      <div className="px-6 pt-2 pb-6 text-center">
        <h1 className="text-xl font-semibold text-white tracking-wide">
          {s.scanTitle}
        </h1>
      </div>

      {/* Main content */}
      <main className="flex-1 w-full max-w-sm px-5 flex flex-col items-center justify-start gap-6">

        {/* ERROR */}
        {isError && (
          <div className="w-full animate-in fade-in zoom-in-95 duration-500">
            <div className="rounded-3xl bg-zinc-900 border border-red-900/40 px-7 py-10 flex flex-col items-center gap-6 text-center">
              <div className="rounded-full bg-red-900/30 p-4">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <div className="space-y-2">
                <p className="text-white font-semibold">Camera unavailable</p>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {errorMessage ?? "Please allow camera access and try again."}
                </p>
              </div>
              <button
                onClick={() => { reset(); start(); }}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-2xl",
                  "bg-white text-zinc-900 text-sm font-semibold",
                  "hover:bg-zinc-100 active:scale-95 transition-all duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
                )}
              >
                <RefreshCw className="w-4 h-4" />
                Try again
              </button>
            </div>
          </div>
        )}

        {/* IDLE — auto-start hasn't resolved yet */}
        {status === "idle" && (
          <div className="w-full animate-in fade-in duration-300">
            <div className="rounded-3xl bg-zinc-900 border border-zinc-800 px-7 py-10 flex flex-col items-center gap-6 text-center">
              <div className="rounded-full bg-zinc-800 p-4">
                <Camera className="w-8 h-8 text-zinc-400" />
              </div>
              <p className="text-zinc-400 text-sm">{s.scanInstruction}</p>
              <button
                onClick={start}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-2xl",
                  "bg-white text-zinc-900 text-sm font-semibold",
                  "hover:bg-zinc-100 active:scale-95 transition-all duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
                )}
              >
                <Camera className="w-4 h-4" />
                Start scanning
              </button>
            </div>
          </div>
        )}

        {/* REQUESTING */}
        {status === "requesting" && (
          <div className="flex flex-col items-center gap-4 py-12 animate-in fade-in duration-300">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-2 border-zinc-700" />
              <div className="absolute inset-0 rounded-full border-t-2 border-white animate-spin" />
            </div>
            <p className="text-zinc-400 text-sm">Requesting camera…</p>
          </div>
        )}

        {/* SCANNING / LOCKED */}
        {(status === "scanning" || status === "locked") && (
          <>
            {/* Hidden canvas — OCR reads from this, never displayed */}
            <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

            {isLocked && passportData ? (
              <ScanResult
                data={passportData}
                showReceptionLabel={s.showReception}
                waitLabel={s.waitMessage}
                scanAgainLabel="Scan again"
                onReset={reset}
              />
            ) : (
              <ScanFrame
                videoRef={videoRef}
                status={status}
                instructionText={s.scanInstruction}
              />
            )}
          </>
        )}
      </main>

      {/* Footer — privacy notice */}
      <footer className="w-full px-5 py-8 flex justify-center">
        <p className="text-zinc-700 text-xs text-center max-w-xs">
          Your passport data is never stored — it is only encoded into a QR code
          shown on this screen.
        </p>
      </footer>
    </div>
  );
}
