/**
 * OCR preprocessing — prepares camera frames for Tesseract MRZ reading.
 */

const TD3_LINE_LEN = 44;
const MIN_OCR_WIDTH = 640;

/** Scale factor so MRZ band has enough pixels for Tesseract */
const UPSCALE = 2;

/**
 * Draw video crop to canvas, upscale, and binarize for MRZ OCR.
 */
export function preprocessMrzFrame(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  crop: { sx: number; sy: number; sw: number; sh: number },
): { width: number; height: number } {
  const sw = Math.max(1, crop.sw);
  const sh = Math.max(1, crop.sh);

  let outW = sw * UPSCALE;
  let outH = sh * UPSCALE;
  if (outW < MIN_OCR_WIDTH) {
    const scale = MIN_OCR_WIDTH / outW;
    outW = MIN_OCR_WIDTH;
    outH = Math.round(outH * scale);
  }

  const canvas = ctx.canvas;
  canvas.width = outW;
  canvas.height = outH;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(video, crop.sx, crop.sy, sw, sh, 0, 0, outW, outH);

  const imageData = ctx.getImageData(0, 0, outW, outH);
  const px = imageData.data;

  for (let i = 0; i < px.length; i += 4) {
    const lum = 0.299 * px[i]! + 0.587 * px[i + 1]! + 0.114 * px[i + 2]!;
    const v = lum > 128 ? 255 : 0;
    px[i] = px[i + 1] = px[i + 2] = v;
  }

  ctx.putImageData(imageData, 0, 0);
  return { width: outW, height: outH };
}

export { TD3_LINE_LEN };
