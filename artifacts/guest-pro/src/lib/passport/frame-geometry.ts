/**
 * Passport frame geometry — shared between overlay UI and OCR crop.
 *
 * TD3 biometric page (ISO/IEC 7810 ID-3): 125 × 88 mm → width/height ≈ 1.42.
 * Overlay uses a horizontal (landscape) cutout centred on the viewport.
 * OCR reads the MRZ band at the bottom of that cutout.
 */

/** ICAO TD3 passport page width ÷ height */
export const PASSPORT_PAGE_ASPECT = 125 / 88;

export interface FrameRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface VideoCropRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

/** Fraction of viewport width used for the passport cutout */
const FRAME_WIDTH_FRAC = 0.94;
/** Max fraction of viewport height the frame may occupy */
const FRAME_MAX_HEIGHT_FRAC = 0.56;
/** Vertical bias — shift frame slightly above centre (thumb / UI space) */
const FRAME_Y_BIAS_FRAC = -0.04;
/** Bottom portion of the frame where MRZ lines live */
export const MRZ_BAND_FRAC = 0.38;

/**
 * Compute the passport cutout rectangle in viewport (CSS pixel) coordinates.
 */
export function computePassportFrameRect(
  viewportW: number,
  viewportH: number,
): FrameRect {
  let width = viewportW * FRAME_WIDTH_FRAC;
  let height = width / PASSPORT_PAGE_ASPECT;

  const maxHeight = viewportH * FRAME_MAX_HEIGHT_FRAC;
  if (height > maxHeight) {
    height = maxHeight;
    width = height * PASSPORT_PAGE_ASPECT;
  }

  const x = (viewportW - width) / 2;
  const y = (viewportH - height) / 2 + viewportH * FRAME_Y_BIAS_FRAC;

  return { x, y, width, height };
}

/**
 * Map a viewport-space rectangle to source pixels on the <video> element,
 * assuming object-fit: cover (centred crop).
 */
export function viewportRectToVideoCrop(
  rect: FrameRect,
  viewportW: number,
  viewportH: number,
  videoW: number,
  videoH: number,
  band: "full" | "mrz" = "mrz",
): VideoCropRect {
  if (videoW <= 0 || videoH <= 0 || viewportW <= 0 || viewportH <= 0) {
    return { sx: 0, sy: 0, sw: videoW, sh: videoH };
  }

  const scale = Math.max(viewportW / videoW, viewportH / videoH);
  const offsetX = (videoW * scale - viewportW) / 2;
  const offsetY = (videoH * scale - viewportH) / 2;

  const toVideoX = (px: number) => (px + offsetX) / scale;
  const toVideoY = (py: number) => (py + offsetY) / scale;

  let x1 = toVideoX(rect.x);
  let y1 = toVideoY(rect.y);
  let x2 = toVideoX(rect.x + rect.width);
  let y2 = toVideoY(rect.y + rect.height);

  if (band === "mrz") {
    const frameH = y2 - y1;
    const mrzH = frameH * MRZ_BAND_FRAC;
    y1 = y2 - mrzH;
  }

  const sx = clamp(Math.floor(Math.min(x1, x2)), 0, videoW - 1);
  const sy = clamp(Math.floor(Math.min(y1, y2)), 0, videoH - 1);
  const sw = clamp(Math.ceil(Math.abs(x2 - x1)), 1, videoW - sx);
  const sh = clamp(Math.ceil(Math.abs(y2 - y1)), 1, videoH - sy);

  return { sx, sy, sw, sh };
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}
