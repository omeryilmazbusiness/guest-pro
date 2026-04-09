/**
 * useQrDataUrl
 *
 * Generates a QR code SVG data URL from a plain-text/URL string.
 *
 * Uses `qrcode.toString({ type: "svg" })` — fully client-side,
 * no canvas, no DOM ref, no portal timing issues.
 * Safe to use inside Radix UI Dialogs, portals, and animated containers.
 */

import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface QrDataUrlResult {
  dataUrl: string | null;
  generating: boolean;
  error: string | null;
}

export function useQrDataUrl(content: string | null | undefined): QrDataUrlResult {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!content) {
      setDataUrl(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setGenerating(true);
    setError(null);

    QRCode.toString(content, {
      type: "svg",
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#18181b", light: "#ffffff" },
    })
      .then((svg) => {
        if (cancelled) return;
        // Encode SVG as a data URL — no canvas, no DOM dependency
        const encoded = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
        setDataUrl(encoded);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("[useQrDataUrl] QR generation failed:", err);
        setError("Failed to generate QR code");
      })
      .finally(() => {
        if (!cancelled) setGenerating(false);
      });

    return () => {
      cancelled = true;
    };
  }, [content]);

  return { dataUrl, generating, error };
}
