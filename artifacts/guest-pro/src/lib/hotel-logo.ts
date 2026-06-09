/** Build a cache-busted logo URL for <img src>. Requires an explicit logoUrl from the API. */
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
