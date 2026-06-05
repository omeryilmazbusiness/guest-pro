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
const appTs = readFileSync(
  path.join(root, "../api-server/src/app.ts"),
  "utf8",
);
const viteTs = readFileSync(path.join(root, "vite.config.ts"), "utf8");

const checks = [
  [about.includes('<base href="/colega/"'), "about.html has colega base href"],
  [contact.includes('<base href="/colega/"'), "contact.html has colega base href"],
  [appTs.includes('sendColegaPage("about.html")'), "api serves /about as colega HTML"],
  [appTs.includes('sendColegaPage("contact.html")'), "api serves /contact as colega HTML"],
  [viteTs.includes("guestProMarketingPagesPlugin"), "vite rewrites /about and /contact"],
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
