/**
 * Trim white margins from project01 full-page screenshots.
 * Usage:
 *   node scripts/trim-guestpro-full-page.mjs guest [source.png]
 *   node scripts/trim-guestpro-full-page.mjs manager [source.png]
 */
import sharp from "sharp";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const home = process.env.HOME ?? "";

const presets = {
	guest: {
		defaultSource: path.join(home, "Downloads/guest_fullPage.png"),
		output: path.join(root, "public/colega/images/projects/guestpro-full-page.png"),
		box: { width: 1903, height: 3649 },
	},
	manager: {
		defaultSource: path.join(home, "Downloads/manager_fullPage.png"),
		output: path.join(root, "public/colega/images/projects/guestpro-manager-full-page.png"),
		box: { width: 1903, height: 5700 },
	},
};

const kind = process.argv[2] === "guest" || process.argv[2] === "manager" ? process.argv[2] : "guest";
const sourceArg = process.argv[2] === "guest" || process.argv[2] === "manager" ? process.argv[3] : process.argv[2];
const preset = presets[kind];
const source = sourceArg ?? preset.defaultSource;

if (!existsSync(source)) {
	console.error(`Source not found: ${source}`);
	process.exit(1);
}

const trimmed = await sharp(source)
	.trim({ threshold: 15, background: { r: 255, g: 255, b: 255, alpha: 255 } })
	.toBuffer({ resolveWithObject: true });

const fitted = await sharp(trimmed.data)
	.resize({ ...preset.box, fit: "inside", withoutEnlargement: false })
	.png({ compressionLevel: 9, adaptiveFiltering: true })
	.toBuffer({ resolveWithObject: true });

await sharp(fitted.data).toFile(preset.output);

console.log(
	`[${kind}] trimmed ${trimmed.info.width}×${trimmed.info.height} → fitted ${fitted.info.width}×${fitted.info.height} → ${preset.output}`,
);
