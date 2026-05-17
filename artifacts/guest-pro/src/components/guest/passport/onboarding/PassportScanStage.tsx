/**
 * Step 4 — live passport camera scan (only mounted after consent).
 */

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { PassportScanOverlay } from "@/components/guest/passport/PassportScanOverlay";
import { ScanResult } from "@/components/guest/passport/ScanResult";
import { usePassportScan } from "@/hooks/use-passport-scan";
import type { PassportOnboardingStrings } from "@/lib/passport/onboarding/types";
import type { PassportOnboardingLocale } from "@/lib/passport/onboarding/types";
import { getPassportLanguageEntry } from "@/lib/passport/onboarding/languages";
import { HOTEL_CONFIG } from "@/lib/welcoming/hotel-content";
import { cn } from "@/lib/utils";

interface PassportScanStageProps {
  locale: PassportOnboardingLocale;
  strings: PassportOnboardingStrings;
}

export function PassportScanStage({ locale, strings }: PassportScanStageProps) {
  const dir = getPassportLanguageEntry(locale).dir;

  const {
    videoRef,
    canvasRef,
    status,
    frameFeedback,
    passportData,
    errorMessage,
    start,
    reset,
  } = usePassportScan();

  useEffect(() => {
    void start();
    return () => reset();
  }, [start, reset]);

  const showCamera =
    status === "requesting" || status === "scanning" || status === "locked";
  const isLocked = status === "locked";
  const isError = status === "error";

  function handleScanAgain() {
    reset();
    void start();
  }

  return (
    <div dir={dir} className="passport-onboarding fixed inset-0 bg-zinc-950 overflow-hidden touch-none z-30">
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className={cn(
          "absolute inset-0 w-full h-full object-cover",
          showCamera ? "opacity-100" : "opacity-0",
        )}
        aria-hidden="true"
      />

      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

      {showCamera && !isLocked && (
        <PassportScanOverlay
          status={status}
          frameFeedback={frameFeedback}
          instructionText={strings.scanInstruction}
          hotelName={HOTEL_CONFIG.name}
          scanTitle={strings.scanTitle}
          statusLabels={{
            scanStatusRequesting: strings.scanStatusRequesting,
            scanStatusScanning: strings.scanStatusScanning,
            scanStatusReading: strings.scanStatusReading,
            scanStatusSuccess: strings.scanStatusSuccess,
            scanStatusError: strings.scanStatusError,
            scanAlignError: strings.scanAlignError,
          }}
        />
      )}

      {isLocked && passportData && (
        <div className="absolute inset-0 z-20 bg-zinc-950/95 backdrop-blur-sm flex flex-col items-center justify-center px-5 overflow-y-auto">
          <ScanResult
            data={passportData}
            showReceptionLabel={strings.showReception}
            waitLabel={strings.waitMessage}
            scanAgainLabel={strings.scanAgain}
            onReset={handleScanAgain}
          />
        </div>
      )}

      {isError && (
        <div className="absolute inset-0 z-30 flex items-center justify-center px-6 bg-zinc-950">
          <div className="w-full max-w-sm rounded-3xl bg-zinc-900 border border-red-900/40 px-7 py-10 flex flex-col items-center gap-6 text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="rounded-full bg-red-900/30 p-4">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <div className="space-y-2">
              <p className="passport-luxury-title text-white">Camera unavailable</p>
              <p className="passport-luxury-body text-zinc-400 text-sm">
                {errorMessage ?? "Please allow camera access and try again."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                reset();
                void start();
              }}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-2xl",
                "bg-white text-zinc-900 text-sm font-semibold",
                "hover:bg-zinc-100 active:scale-95 transition-all duration-150",
              )}
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
