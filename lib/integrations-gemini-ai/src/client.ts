import { GoogleGenAI } from "@google/genai";

// Support both standard GEMINI_API_KEY and the legacy Replit-specific name
const apiKey =
  process.env.GEMINI_API_KEY ??
  process.env.AI_INTEGRATIONS_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error(
    "GEMINI_API_KEY must be set. Add it to your .env file."
  );
}

// AI_INTEGRATIONS_GEMINI_BASE_URL was a Replit proxy — not needed outside Replit
const baseUrl = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL;

export const ai = new GoogleGenAI(
  baseUrl
    ? { apiKey, httpOptions: { apiVersion: "", baseUrl } }
    : { apiKey }
);
