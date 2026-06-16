import fs from "node:fs";
import path from "node:path";

function findRepoRoot(startDir: string): string {
  let dir = path.resolve(startDir);
  for (;;) {
    if (fs.existsSync(path.join(dir, "pnpm-workspace.yaml"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.resolve(startDir);
}

/** Writable root for user uploads (logos, menu images, …). */
export function getUploadsRoot(): string {
  const fromEnv = process.env.UPLOADS_DIR?.trim();
  if (fromEnv) return path.resolve(fromEnv);

  const fromVolume = process.env.RAILWAY_VOLUME_MOUNT_PATH?.trim();
  if (fromVolume) return path.resolve(fromVolume);

  return path.join(findRepoRoot(process.cwd()), "uploads");
}

export function getHotelLogosDir(): string {
  return path.join(getUploadsRoot(), "hotels");
}

export function getMenuItemsDir(): string {
  return path.join(getUploadsRoot(), "menu-items");
}
