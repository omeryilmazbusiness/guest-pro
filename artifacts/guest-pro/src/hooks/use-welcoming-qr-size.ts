/**
 * Responsive QR size for /welcoming — fits narrow viewports without overflow.
 */

import { useEffect, useState } from "react";

const QR_MIN = 196;
const QR_MAX = 320;
/** Page horizontal padding (px-5 × 2) + safe area slack */
const WIDTH_GUTTER = 52;
/** welcoming-qr-block inner padding (1.125rem × 2) */
const BLOCK_PADDING = 36;
/** Space reserved for fixed header + cycling label */
const VERTICAL_RESERVE = 200;

function computeQrSize(): number {
  if (typeof window === "undefined") return 260;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const byWidth = Math.floor(vw - WIDTH_GUTTER - BLOCK_PADDING);
  const byHeight = Math.floor(vh - VERTICAL_RESERVE);

  return Math.max(QR_MIN, Math.min(QR_MAX, byWidth, byHeight));
}

export function useWelcomingQrSize(): number {
  const [size, setSize] = useState(computeQrSize);

  useEffect(() => {
    function update() {
      setSize(computeQrSize());
    }

    update();
    window.addEventListener("resize", update);
    window.visualViewport?.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("resize", update);
    };
  }, []);

  return size;
}
