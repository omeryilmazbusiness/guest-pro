import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
dotenv.config({ path: path.join(root, ".env") });

const { generateConciergeResponse } = await import("../dist/lib/gemini.mjs").catch(async () => {
  await import("tsx/esm/api").then(({ register }) => register());
  return import("../src/lib/gemini.ts");
});

const r = await generateConciergeResponse("Sıkıldım", [], {
  mode: "general",
  channel: "text",
  guestContextBlock: "Guest in room 101",
  detectedLanguage: "tr",
});
console.log("response:", r.response.slice(0, 200));
console.log("options:", r.replyOptions);
