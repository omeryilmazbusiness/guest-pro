/**
 * ScanResult
 *
 * Renders the guest-facing result screen after a successful passport scan:
 *  - A large QR code that encodes the PassportQrPayload JSON
 *  - Guest's name & nationality as a readable summary
 *  - "Show this QR to reception" instruction label
 *  - A "Scan again" button to restart
 *
 * Single Responsibility: display only. No camera, no OCR.
 */

import { QRCodeSVG } from "qrcode.react";
import { encodePassportQr } from "@/lib/passport/types";
import type { PassportData } from "@/lib/passport/types";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";

interface ScanResultProps {
  data: PassportData;
  showReceptionLabel: string;
  waitLabel: string;
  scanAgainLabel?: string;
  onReset: () => void;
}

export function ScanResult({
  data,
  showReceptionLabel,
  waitLabel,
  scanAgainLabel = "Scan again",
  onReset,
}: ScanResultProps) {
  const qrValue = encodePassportQr(data);

  return (
    <div className="flex flex-col items-center gap-7 w-full animate-in fade-in zoom-in-95 duration-500 select-none">

      {/* ── QR Code ─────────────────────────────────────────────────────── */}
      <div className="rounded-3xl bg-white p-5 shadow-2xl shadow-black/40">
        <QRCodeSVG
          value={qrValue}
          size={220}
          level="M"
          bgColor="#ffffff"
          fgColor="#09090b"
          includeMargin={false}
        />
      </div>

      {/* ── Guest summary ───────────────────────────────────────────────── */}
      <div className="text-center space-y-1">
        <p className="text-white font-semibold text-lg tracking-wide">
          {data.firstName} {data.lastName}
        </p>
        <p className="text-zinc-400 text-sm">
          {data.nationality} · {data.dateOfBirth}
        </p>
      </div>

      {/* ── Instructions ────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-zinc-800/60 border border-zinc-700/50 px-6 py-4 text-center space-y-1 w-full max-w-xs">
        <p className="text-white text-sm font-semibold">{showReceptionLabel}</p>
        <p className="text-zinc-400 text-xs">{waitLabel}</p>
      </div>

      {/* ── Scan again ──────────────────────────────────────────────────── */}
      <button
        onClick={onReset}
        className={cn(
          "flex items-center gap-2 px-5 py-2.5 rounded-xl",
          "bg-zinc-800 hover:bg-zinc-700 active:scale-95",
          "text-zinc-300 text-sm font-medium transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500",
        )}
      >
        <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
        {scanAgainLabel}
      </button>
    </div>
  );
}
