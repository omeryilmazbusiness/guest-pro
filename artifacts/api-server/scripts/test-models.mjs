import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleGenAI } from "@google/genai";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
dotenv.config({ path: path.join(root, ".env") });

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const models = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
];

for (const model of models) {
  try {
    const r = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: "Say hi in 3 words" }] }],
    });
    console.log(model, "OK:", r.text?.trim());
  } catch (e) {
    console.log(model, "FAIL:", String(e.message || e).slice(0, 150));
  }
}
