/**
 * RegisterQrCard — premium kiosk QR hero for /welcoming (responsive).
 */

import { QRCodeSVG } from "qrcode.react";
import { RegisterQrLabelCycle } from "./RegisterQrLabelCycle";
import { useWelcomingQrSize } from "@/hooks/use-welcoming-qr-size";
import { cn } from "@/lib/utils";

interface RegisterQrCardProps {
  scanUrl: string;
  className?: string;
}

export function RegisterQrCard({ scanUrl, className }: RegisterQrCardProps) {
  const qrSize = useWelcomingQrSize();

  return (
    <div
      className={cn(
        "flex flex-col items-center w-full max-w-[440px] select-none welcoming-qr-enter",
        "gap-7 sm:gap-10 md:gap-12",
        className,
      )}
    >
      <div className="welcoming-qr-block" aria-label="Registration QR code">
        <QRCodeSVG
          value={scanUrl}
          size={qrSize}
          level="M"
          bgColor="#ffffff"
          fgColor="#0a0a0a"
          includeMargin={false}
          className="max-w-full h-auto"
        />
      </div>

      <RegisterQrLabelCycle />
    </div>
  );
}
