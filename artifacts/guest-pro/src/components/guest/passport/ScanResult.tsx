/**
 * ScanResult — premium black QR success screen after passport scan.
 */

import { QRCodeSVG } from "qrcode.react";
import { encodePassportQr } from "@/lib/passport/types";
import type { PassportData } from "@/lib/passport/types";
import { KioskBrandHeader } from "@/components/kiosk/KioskBrandHeader";
import { PremiumCtaButton } from "@/components/guest/passport/onboarding/primitives/PremiumCtaButton";
import { cn } from "@/lib/utils";

const QR_SIZE = 248;

interface ScanResultProps {
  data: PassportData;
  showReceptionLabel: string;
  waitLabel: string;
  scanAgainLabel?: string;
  onReset: () => void;
  className?: string;
}

export function ScanResult({
  data,
  showReceptionLabel,
  waitLabel,
  scanAgainLabel = "Scan again",
  onReset,
  className,
}: ScanResultProps) {
  const qrValue = encodePassportQr(data);

  return (
    <div
      className={cn(
        "passport-onboarding flex flex-col items-center w-full max-w-md mx-auto",
        "passport-luxury-enter select-none",
        className,
      )}
    >
      <KioskBrandHeader variant="embedded" className="pb-2" />

      <div className="flex flex-col items-center gap-8 w-full mt-4">
        <div className="welcoming-qr-block" aria-label="Guest registration QR code">
          <QRCodeSVG
            value={qrValue}
            size={QR_SIZE}
            level="M"
            bgColor="#ffffff"
            fgColor="#0a0a0a"
            includeMargin={false}
          />
        </div>

        <div className="text-center space-y-2 px-4">
          <p className="passport-luxury-title text-[1.35rem] sm:text-[1.5rem] text-white/95 leading-snug">
            {data.firstName}
          </p>
          <p className="passport-luxury-title text-[1.15rem] sm:text-[1.25rem] text-white/70 tracking-wide">
            {data.lastName}
          </p>
          <p className="passport-luxury-body text-[13px] text-white/45 pt-1">
            {data.nationality} · {data.dateOfBirth}
          </p>
        </div>

        <div className="w-full max-w-sm text-center space-y-2 px-2">
          <p className="passport-luxury-label text-white/55">{showReceptionLabel}</p>
          <p className="passport-luxury-body text-[13px] text-white/40 leading-relaxed">
            {waitLabel}
          </p>
        </div>

        <div className="w-full max-w-sm pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <PremiumCtaButton variant="outline" onClick={onReset}>
            {scanAgainLabel}
          </PremiumCtaButton>
        </div>
      </div>
    </div>
  );
}
