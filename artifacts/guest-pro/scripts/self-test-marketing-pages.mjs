import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const colega = path.join(root, "public/colega");

function read(rel) {
  return readFileSync(path.join(colega, rel), "utf8");
}

const about = read("about.html");
const contact = read("contact.html");
const index = read("index.html");
const scripts = read("js/scripts.js");
const appTs = readFileSync(path.join(root, "../api-server/src/app.ts"), "utf8");
const viteTs = readFileSync(path.join(root, "vite.config.ts"), "utf8");

const checks = [
  [about.includes('<base href="/colega/"'), "about.html has colega base href"],
  [about.includes('href="/about"'), "about.html links to /about"],
  [contact.includes('href="/contact"'), "contact.html links to /contact"],
  [index.includes('href="/about"'), "index.html links to /about"],
  [about.includes("guestpro-youtube-hero.js"), "about.html loads youtube hero script"],
  [contact.includes("guestpro-youtube-hero.js"), "contact.html loads youtube hero script"],
  [contact.includes("guestpro-maps-loader.js"), "contact.html loads async maps loader"],
  [!about.includes("maps.googleapis.com"), "about.html has no inline Google Maps"],
  [about.includes("/favicon.ico?v=2"), "about.html uses Guest Pro favicon"],
  [scripts.includes("guestProInitShowcaseHeroVideo = function"), "scripts has hero init fallback"],
  [scripts.includes("removeAttr(\"data-type\")"), "scripts strips page-transition from marketing nav"],
  [appTs.includes('sendColegaPage("about.html")'), "api serves about colega HTML at /about"],
  [appTs.includes('sendColegaPage("contact.html")'), "api serves contact colega HTML at /contact"],
  [viteTs.includes('"/about"'), "vite handles /about"],
  [viteTs.includes('"/contact"'), "vite handles /contact"],
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
console.log("marketing pages self-test passed");
