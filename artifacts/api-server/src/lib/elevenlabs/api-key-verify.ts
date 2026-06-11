import { elevenLabsConfig } from "./config";

/**
 * ElevenLabs keys are often scoped to text-to-speech only (no user_read).
 * Do not call /v1/user — it returns 401 for valid TTS keys and broke premium voice.
 */
export async function isElevenLabsApiKeyValid(): Promise<boolean> {
  return elevenLabsConfig.isConfigured;
}

export function resetElevenLabsKeyValidationForTests(): void {
  // no-op — kept for test imports
}
