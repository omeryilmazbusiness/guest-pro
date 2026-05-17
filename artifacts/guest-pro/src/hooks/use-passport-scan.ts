/**
 * usePassportScan — camera stream, MRZ OCR loop, frame feedback, stable lock.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Tesseract, { PSM } from "tesseract.js";
import {
  computePassportFrameRect,
  viewportRectToVideoCrop,
} from "@/lib/passport/frame-geometry";
import { assessMrzText } from "@/lib/passport/mrz-parser";
import { preprocessMrzFrame } from "@/lib/passport/ocr-preprocess";
import type { PassportData } from "@/lib/passport/types";

export type ScanStatus = "idle" | "requesting" | "scanning" | "locked" | "error";

/** Frame border colour driven by latest MRZ assessment */
export type FrameFeedback = "neutral" | "reading" | "success" | "error";

export interface UsePassportScanReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  status: ScanStatus;
  frameFeedback: FrameFeedback;
  passportData: PassportData | null;
  errorMessage: string | null;
  start: () => Promise<void>;
  reset: () => void;
}

const OCR_INTERVAL_MS = 1_400;
/** Consecutive matching reads before QR lock (reduces false positives) */
const STABLE_READS_REQUIRED = 2;

function dataFingerprint(data: PassportData): string {
  return `${data.passportNumber}|${data.lastName}|${data.dateOfBirth}|${data.nationality}`;
}

async function requestCameraStream(): Promise<MediaStream> {
  const preferred: MediaStreamConstraints = {
    video: {
      facingMode: { ideal: "environment" },
      width: { ideal: 1920 },
      height: { ideal: 1080 },
    },
    audio: false,
  };

  try {
    return await navigator.mediaDevices.getUserMedia(preferred);
  } catch {
    return navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false,
    });
  }
}

export function usePassportScan(): UsePassportScanReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const workerRef = useRef<Tesseract.Worker | null>(null);
  const isProcessingRef = useRef(false);
  const scanningActiveRef = useRef(false);
  const stableFingerprintRef = useRef<string | null>(null);
  const stableCountRef = useRef(0);

  const [status, setStatus] = useState<ScanStatus>("idle");
  const [frameFeedback, setFrameFeedback] = useState<FrameFeedback>("neutral");
  const [passportData, setPassportData] = useState<PassportData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const lockWithData = useCallback((data: PassportData) => {
    scanningActiveRef.current = false;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setPassportData(data);
    setFrameFeedback("success");
    setStatus("locked");
  }, []);

  const stopAll = useCallback(() => {
    scanningActiveRef.current = false;
    stableFingerprintRef.current = null;
    stableCountRef.current = 0;
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
    const video = videoRef.current;
    if (video) video.srcObject = null;
  }, []);

  useEffect(() => () => stopAll(), [stopAll]);

  const bindVideoStream = useCallback(async (): Promise<boolean> => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream) return false;

    if (video.srcObject !== stream) video.srcObject = stream;

    try {
      await video.play();
      return video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    if (status !== "scanning" && status !== "requesting") return;
    void bindVideoStream();
  }, [status, bindVideoStream]);

  const applyAssessment = useCallback(
    (assessed: ReturnType<typeof assessMrzText>) => {
      switch (assessed.status) {
        case "no_text":
          setFrameFeedback("neutral");
          stableFingerprintRef.current = null;
          stableCountRef.current = 0;
          break;

        case "no_mrz":
        case "invalid":
          setFrameFeedback("error");
          stableFingerprintRef.current = null;
          stableCountRef.current = 0;
          break;

        case "valid_checksum":
          if (assessed.data) lockWithData(assessed.data);
          break;

        case "valid_fields": {
          if (!assessed.data) {
            setFrameFeedback("error");
            break;
          }
          setFrameFeedback("success");
          const fp = dataFingerprint(assessed.data);
          if (fp === stableFingerprintRef.current) {
            stableCountRef.current += 1;
          } else {
            stableFingerprintRef.current = fp;
            stableCountRef.current = 1;
          }
          if (stableCountRef.current >= STABLE_READS_REQUIRED) {
            lockWithData(assessed.data);
          }
          break;
        }
      }
    },
    [lockWithData],
  );

  const captureAndOcr = useCallback(async () => {
    if (isProcessingRef.current || !scanningActiveRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !workerRef.current) return;
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;

    const videoW = video.videoWidth;
    const videoH = video.videoHeight;
    if (!videoW || !videoH) return;

    isProcessingRef.current = true;
    setFrameFeedback("reading");

    try {
      const viewportW = window.innerWidth;
      const viewportH = window.innerHeight;
      const frame = computePassportFrameRect(viewportW, viewportH);
      const crop = viewportRectToVideoCrop(
        frame,
        viewportW,
        viewportH,
        videoW,
        videoH,
        "mrz",
      );

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      preprocessMrzFrame(ctx, video, crop);

      const { data } = await workerRef.current.recognize(canvas);
      applyAssessment(assessMrzText(data.text));
    } catch {
      setFrameFeedback("error");
    } finally {
      isProcessingRef.current = false;
    }
  }, [applyAssessment]);

  const beginOcrLoop = useCallback(() => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      void captureAndOcr();
    }, OCR_INTERVAL_MS);
    void captureAndOcr();
  }, [captureAndOcr]);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("error");
      setErrorMessage(
        "Camera is not supported in this browser. Use HTTPS and a modern browser.",
      );
      return;
    }

    setStatus("requesting");
    setFrameFeedback("neutral");
    setErrorMessage(null);
    setPassportData(null);
    scanningActiveRef.current = false;
    stableFingerprintRef.current = null;
    stableCountRef.current = 0;

    try {
      const stream = await requestCameraStream();
      streamRef.current = stream;

      setStatus("scanning");
      scanningActiveRef.current = true;

      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      await bindVideoStream();

      const worker = await Tesseract.createWorker("eng", 1);
      await worker.setParameters({
        tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<",
        tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      });
      workerRef.current = worker;

      beginOcrLoop();
    } catch (err) {
      scanningActiveRef.current = false;
      const msg =
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Camera permission denied. Allow camera access in browser settings, then tap Try again."
          : err instanceof DOMException && err.name === "NotFoundError"
            ? "No camera found on this device."
            : err instanceof Error
              ? err.message
              : "Camera unavailable";
      setStatus("error");
      setErrorMessage(msg);
      stopAll();
    }
  }, [bindVideoStream, beginOcrLoop, stopAll]);

  const reset = useCallback(() => {
    stopAll();
    setStatus("idle");
    setFrameFeedback("neutral");
    setPassportData(null);
    setErrorMessage(null);
  }, [stopAll]);

  return {
    videoRef,
    canvasRef,
    status,
    frameFeedback,
    passportData,
    errorMessage,
    start,
    reset,
  };
}
