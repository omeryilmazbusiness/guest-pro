import fs from "node:fs/promises";
import path from "node:path";
import { db, restaurantMenuItemsTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { getMenuItemsDir } from "./uploads-path";

export const MENU_ITEMS_DIR = getMenuItemsDir();

export function menuItemImageFileName(itemId: number): string {
  return `item-${itemId}.jpg`;
}

export function menuItemImageFilePath(hotelId: number, itemId: number): string {
  return path.join(MENU_ITEMS_DIR, `hotel-${hotelId}`, menuItemImageFileName(itemId));
}

export function menuItemImagePublicUrl(slug: string, itemId: number): string {
  return `/api/public/hotels/${encodeURIComponent(slug)}/menu-items/${itemId}/image`;
}

export async function ensureMenuItemsDirectory(hotelId: number): Promise<void> {
  await fs.mkdir(path.join(MENU_ITEMS_DIR, `hotel-${hotelId}`), { recursive: true });
}

export async function menuItemImageExists(hotelId: number, itemId: number): Promise<boolean> {
  try {
    await fs.access(menuItemImageFilePath(hotelId, itemId));
    return true;
  } catch {
    return false;
  }
}

export async function writeMenuItemImageFile(
  hotelId: number,
  itemId: number,
  data: Buffer,
): Promise<void> {
  if (!data.length) throw new Error("Empty image");
  if (data.length > 3 * 1024 * 1024) throw new Error("Image too large (max 3 MB)");
  await ensureMenuItemsDirectory(hotelId);
  await fs.writeFile(menuItemImageFilePath(hotelId, itemId), data);
}

export async function deleteMenuItemImageFile(hotelId: number, itemId: number): Promise<void> {
  try {
    await fs.unlink(menuItemImageFilePath(hotelId, itemId));
  } catch {
    /* ignore */
  }
}

export async function saveMenuItemImage(
  hotelId: number,
  slug: string,
  itemId: number,
  image: Buffer,
): Promise<string> {
  await writeMenuItemImageFile(hotelId, itemId, image);
  const publicUrl = menuItemImagePublicUrl(slug, itemId);
  await db
    .update(restaurantMenuItemsTable)
    .set({ imageUrl: publicUrl, updatedAt: new Date() })
    .where(
      and(
        eq(restaurantMenuItemsTable.id, itemId),
        eq(restaurantMenuItemsTable.hotelId, hotelId),
      ),
    );
  return publicUrl;
}

export async function clearMenuItemImage(
  hotelId: number,
  itemId: number,
): Promise<void> {
  await deleteMenuItemImageFile(hotelId, itemId);
  await db
    .update(restaurantMenuItemsTable)
    .set({ imageUrl: null, updatedAt: new Date() })
    .where(
      and(
        eq(restaurantMenuItemsTable.id, itemId),
        eq(restaurantMenuItemsTable.hotelId, hotelId),
      ),
    );
}
