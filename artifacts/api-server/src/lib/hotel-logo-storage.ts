import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { db, hotelBrandingTable, hotelsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
export const HOTEL_LOGOS_DIR = path.join(repoRoot, "uploads", "hotels");

export function hotelLogoFileName(hotelId: number): string {
  return `hotel-${hotelId}.jpg`;
}

export function hotelLogoFilePath(hotelId: number): string {
  return path.join(HOTEL_LOGOS_DIR, hotelLogoFileName(hotelId));
}

/** Public URL served by GET /api/public/hotels/:slug/logo */
export function hotelLogoPublicUrl(slug: string): string {
  return `/api/public/hotels/${encodeURIComponent(slug)}/logo`;
}

export async function ensureLogosDirectory(): Promise<void> {
  await fs.mkdir(HOTEL_LOGOS_DIR, { recursive: true });
}

export async function hotelLogoFileExists(hotelId: number): Promise<boolean> {
  try {
    await fs.access(hotelLogoFilePath(hotelId));
    return true;
  } catch {
    return false;
  }
}

function parseDataUrl(dataUrl: string): Buffer | null {
  const match = /^data:image\/[\w+.-]+;base64,(.+)$/i.exec(dataUrl.trim());
  if (!match) return null;
  try {
    return Buffer.from(match[1], "base64");
  } catch {
    return null;
  }
}

export async function writeHotelLogoFile(hotelId: number, data: Buffer): Promise<void> {
  if (!data.length) throw new Error("Empty image");
  if (data.length > 3 * 1024 * 1024) throw new Error("Image too large (max 3 MB)");
  await ensureLogosDirectory();
  await fs.writeFile(hotelLogoFilePath(hotelId), data);
}

export async function deleteHotelLogoFile(hotelId: number): Promise<void> {
  try {
    await fs.unlink(hotelLogoFilePath(hotelId));
  } catch {
    /* ignore */
  }
}

/** Persist file + store public path in hotel_branding.logo_url */
export async function saveHotelLogo(
  hotelId: number,
  slug: string,
  image: Buffer,
): Promise<string> {
  await writeHotelLogoFile(hotelId, image);
  const publicUrl = hotelLogoPublicUrl(slug);
  await upsertBrandingLogoPath(hotelId, slug, publicUrl);
  return publicUrl;
}

async function upsertBrandingLogoPath(hotelId: number, slug: string, logoPath: string): Promise<void> {
  const [row] = await db
    .select({ id: hotelBrandingTable.id })
    .from(hotelBrandingTable)
    .where(eq(hotelBrandingTable.hotelId, hotelId));
  if (row) {
    await db
      .update(hotelBrandingTable)
      .set({ logoUrl: logoPath })
      .where(eq(hotelBrandingTable.hotelId, hotelId));
  } else {
    const [hotel] = await db.select({ name: hotelsTable.name }).from(hotelsTable).where(eq(hotelsTable.id, hotelId));
    await db.insert(hotelBrandingTable).values({
      hotelId,
      appName: hotel?.name ?? slug,
      logoUrl: logoPath,
    });
  }
}

/** Migrate legacy data: URLs to disk; return resolved public path or null */
export async function resolveHotelLogoUrl(
  hotelId: number,
  slug: string,
  storedLogoUrl: string | null | undefined,
): Promise<string | null> {
  if (await hotelLogoFileExists(hotelId)) {
    return hotelLogoPublicUrl(slug);
  }

  if (storedLogoUrl?.startsWith("data:image/")) {
    const buf = parseDataUrl(storedLogoUrl);
    if (buf) {
      try {
        return await saveHotelLogo(hotelId, slug, buf);
      } catch {
        return storedLogoUrl;
      }
    }
  }

  if (storedLogoUrl?.startsWith("/api/public/hotels/")) {
    const [row] = await db
      .select({ id: hotelBrandingTable.id })
      .from(hotelBrandingTable)
      .where(eq(hotelBrandingTable.hotelId, hotelId));
    if (row) {
      await db
        .update(hotelBrandingTable)
        .set({ logoUrl: null })
        .where(eq(hotelBrandingTable.hotelId, hotelId));
    }
    return null;
  }

  return null;
}

export async function clearHotelLogo(hotelId: number): Promise<void> {
  await deleteHotelLogoFile(hotelId);
  const [row] = await db
    .select({ id: hotelBrandingTable.id })
    .from(hotelBrandingTable)
    .where(eq(hotelBrandingTable.hotelId, hotelId));
  if (row) {
    await db.update(hotelBrandingTable).set({ logoUrl: null }).where(eq(hotelBrandingTable.hotelId, hotelId));
  }
}
