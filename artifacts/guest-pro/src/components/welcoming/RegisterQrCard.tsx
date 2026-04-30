/**
 * RegisterQrCard
 *
 * Renders the QR code that opens the passport-scan flow on the guest's phone,
 * plus a cycling multi-language "Scan QR to register" subtitle beneath it.
 *
 * Single Responsibility: display the registration entry-point QR and label.
 * Does NOT handle auth, navigation, or language selection.
 *
 * Props:
 *   scanUrl — the URL that the QR encodes (e.g. "/guest/passport-scan").
 *              Passed in so the parent (welcoming page) controls routing.
 */

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { WELCOMING_LANGUAGES } from "@/lib/welcoming/languages";
import { getWelcomingStrings } from "@/lib/welcoming/hotel-content";

// ── Constants ────────────────────────────────────────────────────────────────

const CYCLE_MS = 2800;

// ── Types ────────────────────────────────────────────────────────────────────

interface RegisterQrCardProps {
  /** Absolute URL or path that the QR code encodes */
  scanUrl: string;
}

// ── Component ────────────────────────────────────────────────────────────────

export function RegisterQrCard({ scanUrl }: RegisterQrCardProps) {
  const [index, setIndex] = useState(0);

  // Cycle through the same 6 welcoming languages as GreetingLoop
  useEffect(() => {
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % WELCOMING_LANGUAGES.length);
    }, CYCLE_MS);
    return () => clearInterval(t);
  }, []);

  const currentLang = WELCOMING_LANGUAGES[index];
  const label = getWelcomingStrings(currentLang.uiLocale).registerQrLabel;

  return (
    <div className="flex flex-col items-center gap-6 select-none">

      {/* ── QR Code ──────────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl bg-white p-4 shadow-lg shadow-black/30"
        aria-label="Registration QR code"
      >
        <QRCodeSVG
          value={scanUrl}
          size={200}
          level="M"
          bgColor="#ffffff"
          fgColor="#09090b"
          includeMargin={false}
        />
      </div>

      {/* ── Cycling label ────────────────────────────────────────────────── */}
      <div
        className="relative h-7 w-full flex items-center justify-center overflow-hidden"
        aria-live="polite"
        aria-label="registration instruction"
      >
        <span
          key={`reg-label-${index}`}
          dir={currentLang.dir}
          lang={currentLang.uiLocale}
          className="absolute text-sm font-medium tracking-wide text-zinc-300"
          style={{
            animation: `register-label-slide ${CYCLE_MS}ms ease-in-out forwards`,
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}
