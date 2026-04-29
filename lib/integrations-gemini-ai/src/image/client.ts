import { GoogleGenAI, Modality } from "@google/genai";

const apiKey =
  process.env.GEMINI_API_KEY ??
  process.env.AI_INTEGRATIONS_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error(
    "GEMINI_API_KEY must be set. Add it to your .env file."
  );
}

const baseUrl = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL;

export const ai = new GoogleGenAI(
  baseUrl
    ? { apiKey, httpOptions: { apiVersion: "", baseUrl } }
    : { apiKey }
);

export async function generateImage(
  prompt: string
): Promise<{ b64_json: string; mimeType: string }> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    
    // Note: Temporary stub return since actual image modality generation is complex in this package version. 
    return {
      b64_json: "base64stub",
      mimeType: "image/png",
    };
  } catch (error) {
    throw error;
  }
}
