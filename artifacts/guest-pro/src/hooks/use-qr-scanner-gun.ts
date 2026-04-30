/**
 * useQrScannerGun
 *
 * Listens for rapid keyboard events emitted by a USB/Bluetooth QR scanner gun.
 * Scanner guns type the QR payload followed by Enter very fast (< 50ms/char).
 * Normal keyboard typing is much slower, so we discriminate by inter-key timing.
 *
 * When a complete scan is detected:
 *  - Attempts to decode the raw string as a PassportQrPayload
 *  - Calls onScan(data) if valid, onError(raw) if the payload is unrecognised
 *
 * Single Responsibility: input-device detection + PassportQr decoding only.
 * Rendering and form-filling are handled by the caller.
 *
 * Usage:
 *   useQrScannerGun({ onScan: (data) => fillForm(data) });
 */

import { useEffect, useRef } from "react";
import { decodePassportQr } from "@/lib/passport/types";
import type { PassportData } from "@/lib/passport/types";

// ── Constants ────────────────────────────────────────────────────────────────

/** Max ms between consecutive keystrokes to still be considered a scanner burst */
const SCANNER_BURST_MS = 60;
/** Minimum payload length to consider as a real QR scan (avoid single stray keys) */
const MIN_PAYLOAD_LEN = 10;

// ── Types ────────────────────────────────────────────────────────────────────

interface UseQrScannerGunOptions {
  /** Called when a valid PassportQrPayload is decoded from a scan */
  onScan: (data: PassportData) => void;
  /** Called when the scan burst produces a string that is not a valid PassportQr */
  onError?: (raw: string) => void;
  /** Set to false to temporarily disable (e.g. while a modal is open) */
  enabled?: boolean;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useQrScannerGun({
  onScan,
  onError,
  enabled = true,
}: UseQrScannerGunOptions): void {
  const bufferRef = useRef<string>("");
  const lastKeyTimeRef = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    function flush() {
      const raw = bufferRef.current;
      bufferRef.current = "";
      if (raw.length < MIN_PAYLOAD_LEN) return;

      const data = decodePassportQr(raw);
      if (data) {
        onScan(data);
      } else {
        onError?.(raw);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      const now = Date.now();
      const gap = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // Enter = end of scanner transmission → flush immediately
      if (e.key === "Enter") {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        flush();
        return;
      }

      // Non-scanner-like gap → reset buffer (real user keystroke)
      if (gap > SCANNER_BURST_MS && bufferRef.current.length > 0) {
        bufferRef.current = "";
      }

      // Accumulate printable characters
      if (e.key.length === 1) {
        bufferRef.current += e.key;
      }

      // Safety flush after a short idle (handles scanners that don't send Enter)
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(flush, SCANNER_BURST_MS * 4);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      bufferRef.current = "";
    };
  }, [enabled, onScan, onError]);
}
