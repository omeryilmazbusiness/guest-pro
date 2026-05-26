/**
 * Regenerate public favicons from the official Guest Pro logo PNG.
 * Run: pnpm --filter @workspace/guest-pro generate:favicons
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import toIco from "to-ico";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const input = path.join(
  root,
  "src/assets/Gemini_Generated_Image_bnqhycbnqhycbnqh-removebg-preview_1775747739132.png",
);
const publicDir = path.join(root, "public");

async function iconPng(size, { padding = 0.1, background = { r: 0, g: 0, b: 0, alpha: 0 } } = {}) {
  const inner = Math.round(size * (1 - padding * 2));
  const logo = await sharp(input)
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  return sharp({
    create: { width: size, height: size, channels: 4, background },
  })
    .composite([{ input: logo, gravity: "centre" }])
    .png()
    .toBuffer();
}

/** Light tile so the dark logo stays visible in browser tabs (incl. dark chrome). */
const faviconTile = { r: 248, g: 248, b: 248, alpha: 1 };

const faviconSizes = [16, 32, 48];
const faviconPngs = await Promise.all(
  faviconSizes.map((size) => iconPng(size, { padding: 0.08, background: faviconTile })),
);

await writeFile(path.join(publicDir, "favicon.ico"), await toIco(faviconPngs));
await writeFile(path.join(publicDir, "favicon-16x16.png"), faviconPngs[0]);
await writeFile(path.join(publicDir, "favicon-32x32.png"), faviconPngs[1]);

const svg32 = faviconPngs[1].toString("base64");
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 32 32" role="img" aria-label="Guest Pro">
  <image width="32" height="32" xlink:href="data:image/png;base64,${svg32}"/>
</svg>`;
await writeFile(path.join(publicDir, "favicon.svg"), faviconSvg);

const apple = await iconPng(180, {
  padding: 0.14,
  background: { r: 248, g: 248, b: 248, alpha: 1 },
});
await writeFile(path.join(publicDir, "apple-touch-icon.png"), apple);

const pwa192 = await iconPng(192, {
  padding: 0.12,
  background: { r: 10, g: 10, b: 10, alpha: 1 },
});
const pwa512 = await iconPng(512, {
  padding: 0.12,
  background: { r: 10, g: 10, b: 10, alpha: 1 },
});
await writeFile(path.join(publicDir, "pwa-192.png"), pwa192);
await writeFile(path.join(publicDir, "pwa-512.png"), pwa512);

console.log("Wrote favicon.ico, favicon.svg, favicon-16x16.png, favicon-32x32.png");
console.log("Wrote apple-touch-icon.png, pwa-192.png, pwa-512.png");
