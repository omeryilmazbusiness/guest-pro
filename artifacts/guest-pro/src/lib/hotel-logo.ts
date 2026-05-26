/** Build a cache-busted logo URL for <img src> */
export function getHotelLogoSrc(
  slug: string,
  logoUrl?: string | null,
  cacheKey?: string | null,
): string | null {
  let path: string | null = null;

  if (logoUrl?.startsWith("/api/")) {
    path = logoUrl;
  } else if (logoUrl?.startsWith("data:image/")) {
    return logoUrl;
  } else if (slug) {
    path = `/api/public/hotels/${encodeURIComponent(slug)}/logo`;
  }

  if (!path) return null;
  if (cacheKey) {
    const v = encodeURIComponent(cacheKey);
    return path.includes("?") ? `${path}&v=${v}` : `${path}?v=${v}`;
  }
  return path;
}

export async function dataUrlToJpegBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return blob.type === "image/jpeg" ? blob : new Blob([await blob.arrayBuffer()], { type: "image/jpeg" });
}
