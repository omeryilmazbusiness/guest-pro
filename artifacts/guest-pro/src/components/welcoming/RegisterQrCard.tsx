/**
 * RegisterQrCard — premium kiosk QR hero for /welcoming.
 *
 * Brand header · large QR only · cycling Manrope registration label.
 */

import { QRCodeSVG } from "qrcode.react";
import { RegisterQrLabelCycle } from "./RegisterQrLabelCycle";

/** Large kiosk QR — tuned for tablet / lobby displays */
const QR_SIZE = 320;

interface RegisterQrCardProps {
  scanUrl: string;
}

export function RegisterQrCard({ scanUrl }: RegisterQrCardProps) {
  return (
    <div className="flex flex-col items-center gap-10 sm:gap-12 w-full max-w-[440px] select-none welcoming-qr-enter">
      <div className="welcoming-qr-block" aria-label="Registration QR code">
        <QRCodeSVG
          value={scanUrl}
          size={QR_SIZE}
          level="M"
          bgColor="#ffffff"
          fgColor="#0a0a0a"
          includeMargin={false}
        />
      </div>

      <RegisterQrLabelCycle />
    </div>
  );
}
