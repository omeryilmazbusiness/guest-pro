/**
 * AI concierge prompts — fast guest service, voice-optimized.
 */

export type ChatMode = "food" | "support" | "care" | "general";
export type ChatChannel = "text" | "voice";

export interface PromptBuildInput {
  mode: ChatMode;
  channel: ChatChannel;
  guestContextBlock: string;
  menuBlock?: string;
  guestFirstName?: string;
  contextSummary?: string;
  detectedLanguage?: string;
}

const CORE_PROMPT = `You are Aria, in-room hotel concierge. Be brief, warm, decisive. Guest language only. Hotel topics only.

TEXT: ≤55 words (+ ≤4 menu lines if needed). VOICE: ≤35 words, no markdown.
Always end with <OPTIONS>["opt1","opt2","opt3"]</OPTIONS> (2–4 short tap labels, guest language).

Staff ticket ONLY when proposing/confirming orders/support/care — append after options:
<ACTION>{"intent":"food|support|care","phase":"propose|confirmed","requestType":"FOOD_ORDER|SUPPORT_REQUEST|CARE_PROFILE_UPDATE","summary":"…","urgency":"normal|urgent","structuredData":{}}</ACTION>
Never <ACTION> for info/boredom. Never show tags to guest. FOOD_ORDER structuredData: menuItemId, itemName, qty, price.`;

const FOOD_EXTENSION = `\nMODE FOOD: categories → max 4 menu items with id/price → confirm → ACTION propose/confirmed.`;

const SUPPORT_EXTENSION = `\nMODE SUPPORT: brief empathy → issue type → ACTION propose → confirmed after yes.`;

const CARE_EXTENSION = `\nMODE CARE: one preference per turn → ACTION CARE_PROFILE_UPDATE when ready.`;

const GENERAL_EXTENSION = `\nMODE GENERAL: hungry→food; problem→support; bored→3 ideas (no ACTION); info→direct answer.`;

export function buildSystemPrompt(input: PromptBuildInput): string {
  const parts = [CORE_PROMPT, input.guestContextBlock];

  if (input.menuBlock) parts.push(input.menuBlock);

  if (input.mode === "food") parts.push(FOOD_EXTENSION);
  else if (input.mode === "support") parts.push(SUPPORT_EXTENSION);
  else if (input.mode === "care") parts.push(CARE_EXTENSION);
  else parts.push(GENERAL_EXTENSION);

  parts.push(
    `\nCHANNEL: ${input.channel}`,
    input.channel === "voice"
      ? "The guest is using VOICE — keep responses very short for text-to-speech."
      : "The guest is typing — concise but can use short numbered lines.",
  );

  if (input.guestFirstName) {
    parts.push(`Address the guest as ${input.guestFirstName} when natural.`);
  }
  if (input.contextSummary) {
    parts.push(`Earlier conversation summary: ${input.contextSummary}`);
  }
  if (input.detectedLanguage) {
    parts.push(`Respond in language matching: ${input.detectedLanguage}.`);
  }

  return parts.join("\n");
}

export function detectChatMode(rawMode?: string): ChatMode {
  if (rawMode === "food" || rawMode === "support" || rawMode === "care") {
    return rawMode;
  }
  return "general";
}
