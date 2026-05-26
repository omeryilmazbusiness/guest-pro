const OUTPUT_SIZE = 256;
const JPEG_QUALITY = 0.86;
const MAX_BYTES = 280_000;

/**
 * Center-crop to square, resize, and compress for hotel_branding.logo_url storage.
 */
export async function processHotelLogoFile(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file (PNG, JPG, WebP).");
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error("Image is too large (max 8 MB before compression).");
  }

  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = Math.floor((bitmap.width - side) / 2);
  const sy = Math.floor((bitmap.height - side) / 2);

  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process image.");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  bitmap.close();

  let quality = JPEG_QUALITY;
  let dataUrl = canvas.toDataURL("image/jpeg", quality);
  while (dataUrl.length > MAX_BYTES && quality > 0.42) {
    quality -= 0.07;
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }
  if (dataUrl.length > MAX_BYTES) {
    throw new Error("Image is still too large after compression. Try a smaller file.");
  }
  return dataUrl;
}
