/**
 * usePassportScan
 *
 * Manages the full passport-scanning pipeline:
 *  1. Request rear camera permission via getUserMedia
 *  2. Stream video frames to a <canvas> every OCR_INTERVAL_MS
 *  3. Run Tesseract.js OCR (MRZ-optimised character set)
 *  4. Attempt MRZ extraction + parsing on each captured frame
 *  5. On first successful parse → set status "locked", return PassportData
 *
 * Single Responsibility: camera + OCR + MRZ state only.
 * Does NOT render anything.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Tesseract, { PSM } from "tesseract.js";
import { parseMrzText } from "@/lib/passport/mrz-parser";
import type { PassportData } from "@/lib/passport/types";

// ── Types ────────────────────────────────────────────────────────────────────

export type ScanStatus = "idle" | "requesting" | "scanning" | "locked" | "error";

export interface UsePassportScanReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  status: ScanStatus;
  passportData: PassportData | null;
  errorMessage: string | null;
  start: () => Promise<void>;
  reset: () => void;
}

// ── Constants ────────────────────────────────────────────────────────────────

/** How often to grab a frame and OCR it (ms). Lower = faster but more CPU. */
const OCR_INTERVAL_MS = 1_400;

// ── Hook ─────────────────────────────────────────────────────────────────────

export function usePassportScan(): UsePassportScanReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const workerRef = useRef<Tesseract.Worker | null>(null);
  const isProcessingRef = useRef(false);

  const [status, setStatus] = useState<ScanStatus>("idle");
  const [passportData, setPassportData] = useState<PassportData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ── Internal cleanup ───────────────────────────────────────────────────────

  const stopAll = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (workerRef.current) {
      workerRef.current.terminate().catch(() => void 0);
      workerRef.current = null;
    }
    isProcessingRef.current = false;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopAll();
  }, [stopAll]);

  // ── OCR frame capture ──────────────────────────────────────────────────────

  const captureAndOcr = useCallback(async () => {
    if (isProcessingRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !workerRef.current) return;
    if (video.readyState < 2) return; // not enough data yet

    isProcessingRef.current = true;
    try {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      const { data } = await workerRef.current.recognize(canvas);
      const result = parseMrzText(data.text);

      if (result) {
        // Stop scanning immediately on first lock
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setPassportData(result);
        setStatus("locked");
      }
    } catch {
      // Silently swallow per-frame OCR errors — next interval will retry
    } finally {
      isProcessingRef.current = false;
    }
  }, []);

  // ── Public API ─────────────────────────────────────────────────────────────

  const start = useCallback(async () => {
    setStatus("requesting");
    setErrorMessage(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1_280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Tesseract v7 — MRZ-optimised: uppercase letters, digits, and < filler
      const worker = await Tesseract.createWorker("eng", 1);
      await worker.setParameters({
        tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<",
        // PSM 6 = assume a single uniform block of text (works well for MRZ)
        tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      });
      workerRef.current = worker;

      setStatus("scanning");
      intervalRef.current = setInterval(captureAndOcr, OCR_INTERVAL_MS);
    } catch (err) {
      const msg =
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Camera permission denied. Please allow camera access and retry."
          : err instanceof Error
            ? err.message
            : "Camera unavailable";
      setStatus("error");
      setErrorMessage(msg);
    }
  }, [captureAndOcr]);

  const reset = useCallback(() => {
    stopAll();
    setStatus("idle");
    setPassportData(null);
    setErrorMessage(null);
  }, [stopAll]);

  return {
    videoRef,
    canvasRef,
    status,
    passportData,
    errorMessage,
    start,
    reset,
  };
}
