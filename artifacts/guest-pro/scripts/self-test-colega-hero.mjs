import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const colega = path.join(root, "public/colega");
const videoId = "cdKx1Zv3YKs";

function read(rel) {
  return readFileSync(path.join(colega, rel), "utf8");
}

const index = read("index.html");
const project = read("project01.html");
const scripts = read("js/guestpro-youtube-hero.js");
const config = read("js/guestpro-config.js");

const checks = [
  [index.includes("bgvid-youtube"), "index.html uses YouTube hero container"],
  [!index.includes("bauman.mp4"), "index.html does not reference bauman.mp4"],
  [project.includes("bgvid-youtube"), "project01.html uses YouTube hero container"],
  [!project.includes("bauman.mp4"), "project01.html does not reference bauman.mp4"],
  [config.includes(videoId), "guestpro-config.js includes YouTube video id"],
  [scripts.includes("buildEmbedUrl") && scripts.includes("mute"), "youtube hero script builds muted autoplay embed"],
  [index.includes('class="bgvid-youtube-frame"'), "index.html has YouTube iframe element"],
  [scripts.includes("guestProInitShowcaseHeroVideo"), "youtube hero script exports init"],
  [index.includes("guestpro-youtube-hero.js"), "index.html loads youtube hero script"],
];

let failed = 0;
for (const [ok, label] of checks) {
  if (!ok) {
    console.error("FAIL:", label);
    failed++;
  } else {
    console.log("ok:", label);
  }
}

if (failed > 0) process.exit(1);
console.log("colega hero self-test passed");
