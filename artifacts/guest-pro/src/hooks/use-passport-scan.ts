/**
 * usePassportScan
 *
 * Camera + Tesseract MRZ pipeline:
 *  1. getUserMedia (rear camera, with fallback)
 *  2. Bind stream to <video> (retries when ref mounts — fixes black screen)
 *  3. OCR the MRZ band inside the passport frame every OCR_INTERVAL_MS
 *  4. On valid parse → status "locked" + PassportData
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Tesseract, { PSM } from "tesseract.js";
import {
  computePassportFrameRect,
  viewportRectToVideoCrop,
} from "@/lib/passport/frame-geometry";
import { parseMrzText } from "@/lib/passport/mrz-parser";
import type { PassportData } from "@/lib/passport/types";

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

const OCR_INTERVAL_MS = 1_200;

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

  const [status, setStatus] = useState<ScanStatus>("idle");
  const [passportData, setPassportData] = useState<PassportData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const stopAll = useCallback(() => {
    scanningActiveRef.current = false;
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
    if (video) {
      video.srcObject = null;
    }
  }, []);

  useEffect(() => () => stopAll(), [stopAll]);

  const bindVideoStream = useCallback(async (): Promise<boolean> => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream) return false;

    if (video.srcObject !== stream) {
      video.srcObject = stream;
    }

    try {
      await video.play();
      return video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
    } catch {
      return false;
    }
  }, []);

  // Attach stream when <video> mounts after status → scanning (fixes black screen)
  useEffect(() => {
    if (status !== "scanning" && status !== "requesting") return;
    void bindVideoStream();
  }, [status, bindVideoStream]);

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

      canvas.width = crop.sw;
      canvas.height = crop.sh;
      ctx.drawImage(video, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, crop.sw, crop.sh);

      // Boost contrast for MRZ OCR
      const imageData = ctx.getImageData(0, 0, crop.sw, crop.sh);
      const px = imageData.data;
      for (let i = 0; i < px.length; i += 4) {
        const lum = 0.299 * px[i]! + 0.587 * px[i + 1]! + 0.114 * px[i + 2]!;
        const v = lum > 140 ? 255 : lum < 90 ? 0 : lum > 115 ? 255 : 0;
        px[i] = px[i + 1] = px[i + 2] = v;
      }
      ctx.putImageData(imageData, 0, 0);

      const { data } = await workerRef.current.recognize(canvas);
      const result = parseMrzText(data.text);

      if (result) {
        scanningActiveRef.current = false;
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setPassportData(result);
        setStatus("locked");
      }
    } catch {
      // per-frame OCR errors are non-fatal
    } finally {
      isProcessingRef.current = false;
    }
  }, []);

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
      setErrorMessage("Camera is not supported in this browser. Use HTTPS and a modern browser.");
      return;
    }

    setStatus("requesting");
    setErrorMessage(null);
    setPassportData(null);
    scanningActiveRef.current = false;

    try {
      const stream = await requestCameraStream();
      streamRef.current = stream;

      // Move to scanning so <video> is rendered, then bind via effect + immediate attempt
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
