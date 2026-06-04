/**
 * Build web-optimized Colega hero assets from videos/source/bauman.mp4
 * Outputs: videos/bauman-hero.mp4, videos/bauman-hero.webm, images/bauman-hero-poster.jpg
 */
import { spawn } from "node:child_process";
import { mkdir, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ffmpegPath from "ffmpeg-static";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(root, "public", "colega");
const sourceDir = path.join(publicDir, "videos", "source");
const sourceMp4 = path.join(sourceDir, "bauman.mp4");
const legacyMp4 = path.join(publicDir, "videos", "bauman.mp4");
const outMp4 = path.join(publicDir, "videos", "bauman-hero.mp4");
const outWebm = path.join(publicDir, "videos", "bauman-hero.webm");
const outPoster = path.join(publicDir, "images", "bauman-hero-poster.jpg");

/** Short loop for homepage hero — full source can be longer */
const HERO_CLIP_SECONDS = 12;
const HERO_START_SECONDS = 0;

async function fileExists(p) {
	try {
		await access(p);
		return true;
	} catch {
		return false;
	}
}

function run(cmd, args) {
	return new Promise((resolve, reject) => {
		const child = spawn(cmd, args, { stdio: "inherit" });
		child.on("error", reject);
		child.on("exit", (code) => {
			if (code === 0) resolve();
			else reject(new Error(`${cmd} exited with ${code}`));
		});
	});
}

async function resolveSource() {
	if (await fileExists(sourceMp4)) return sourceMp4;
	if (await fileExists(legacyMp4)) return legacyMp4;
	throw new Error(
		"Missing source video. Place master file at public/colega/videos/source/bauman.mp4",
	);
}

async function main() {
	if (!ffmpegPath) {
		throw new Error("ffmpeg-static binary not found. Run: pnpm install");
	}

	await mkdir(sourceDir, { recursive: true });
	const input = await resolveSource();
	console.log("[colega:hero] Source:", input);

	const trim = [
		"-ss",
		String(HERO_START_SECONDS),
		"-t",
		String(HERO_CLIP_SECONDS),
	];

	// H.264 — broad support, faststart for instant playback
	await run(ffmpegPath, [
		"-y",
		...trim,
		"-i",
		input,
		"-an",
		"-vf",
		"scale=1280:-2:flags=lanczos",
		"-c:v",
		"libx264",
		"-preset",
		"slow",
		"-crf",
		"27",
		"-profile:v",
		"high",
		"-level",
		"4.0",
		"-pix_fmt",
		"yuv420p",
		"-movflags",
		"+faststart",
		outMp4,
	]);

	// WebM VP9 — smaller on Chrome/Firefox/Safari (modern)
	await run(ffmpegPath, [
		"-y",
		...trim,
		"-i",
		input,
		"-an",
		"-vf",
		"scale=1280:-2:flags=lanczos",
		"-c:v",
		"libvpx-vp9",
		"-crf",
		"34",
		"-b:v",
		"0",
		"-row-mt",
		"1",
		outWebm,
	]);

	// Hero poster — single high-quality JPEG for instant LCP
	await run(ffmpegPath, [
		"-y",
		"-ss",
		String(HERO_START_SECONDS + 1),
		"-i",
		input,
		"-vframes",
		"1",
		"-update",
		"1",
		"-q:v",
		"2",
		"-vf",
		"scale=1920:-2:flags=lanczos",
		outPoster,
	]);

	console.log("[colega:hero] Done:");
	console.log("  ", outMp4);
	console.log("  ", outWebm);
	console.log("  ", outPoster);
}

main().catch((err) => {
	console.error(err.message || err);
	process.exit(1);
});
