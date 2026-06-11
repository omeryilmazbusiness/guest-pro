import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** ISO timestamp when this API process started. */
export const SERVER_STARTED_AT = new Date().toISOString();

function readBundleStamp(): string | null {
  try {
    const stampPath = path.join(path.dirname(fileURLToPath(import.meta.url)), ".build-stamp");
    return readFileSync(stampPath, "utf8").trim() || null;
  } catch {
    return null;
  }
}

/** Bundle stamp from dist/.build-stamp at process start (dev + prod). */
export const BUNDLE_BUILD_STAMP = readBundleStamp();
