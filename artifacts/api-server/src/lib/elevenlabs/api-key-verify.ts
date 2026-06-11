import { elevenLabsConfig } from "./config";
import { logger } from "../logger";

let cachedValid: boolean | null = null;
let verifyPromise: Promise<boolean> | null = null;

/** Cached check against ElevenLabs /v1/user — avoids hammering on every TTS request. */
export async function isElevenLabsApiKeyValid(): Promise<boolean> {
  if (!elevenLabsConfig.isConfigured) {
    cachedValid = false;
    return false;
  }
  if (cachedValid !== null) return cachedValid;
  if (verifyPromise) return verifyPromise;

  verifyPromise = (async () => {
    try {
      const response = await fetch("https://api.elevenlabs.io/v1/user", {
        headers: { "xi-api-key": elevenLabsConfig.apiKey! },
        signal: AbortSignal.timeout(8_000),
      });
      cachedValid = response.ok;
      if (!cachedValid) {
        const detail = await response.text().catch(() => "");
        logger.warn(
          { status: response.status, detail: detail.slice(0, 200) },
          "ElevenLabs API key rejected — premium TTS disabled until key is fixed",
        );
      }
      return cachedValid;
    } catch (err) {
      logger.warn({ err }, "ElevenLabs API key verification failed (network)");
      cachedValid = false;
      return false;
    } finally {
      verifyPromise = null;
    }
  })();

  return verifyPromise;
}

export function resetElevenLabsKeyValidationForTests(): void {
  cachedValid = null;
  verifyPromise = null;
}
