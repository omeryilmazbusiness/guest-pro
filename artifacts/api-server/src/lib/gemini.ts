import { ai } from "@workspace/integrations-gemini-ai";
import { buildSystemPrompt, type ChatMode } from "./guided-prompts";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function detectCategory(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("reception") || lower.includes("check") || lower.includes("key") || lower.includes("desk") || lower.includes("resepsiyon") || lower.includes("anahtar")) {
    return "reception";
  } else if (lower.includes("room service") || lower.includes("food") || lower.includes("drink") || lower.includes("eat") || lower.includes("breakfast") || lower.includes("yemek") || lower.includes("kahvaltı") || lower.includes("acıktım") || lower.includes("sipariş")) {
    return "room_service";
  } else if (lower.includes("clean") || lower.includes("towel") || lower.includes("housekeep") || lower.includes("temizlik") || lower.includes("havlu")) {
    return "housekeeping";
  } else if (lower.includes("spa") || lower.includes("pool") || lower.includes("gym") || lower.includes("activit") || lower.includes("havuz")) {
    return "activities";
  } else if (lower.includes("taxi") || lower.includes("transport") || lower.includes("airport") || lower.includes("car") || lower.includes("taksi") || lower.includes("transfer")) {
    return "transport";
  } else if (lower.includes("support") || lower.includes("problem") || lower.includes("issue") || lower.includes("broken") || lower.includes("sorun") || lower.includes("destek") || lower.includes("arıza")) {
    return "support";
  } else if (lower.includes("care") || lower.includes("prefer") || lower.includes("tercih") || lower.includes("allerji") || lower.includes("allerg")) {
    return "care";
  }
  return "general";
}

export async function generateConversationSummary(messages: ChatMessage[]): Promise<string> {
  if (messages.length === 0) return "";

  const historyText = messages
    .map((m) => `${m.role === "user" ? "Guest" : "Concierge"}: ${m.content}`)
    .join("\n");

  try {
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Summarize this hotel guest conversation in 2-3 concise sentences. Focus on the main topics discussed, requests made, and any important context for continuing the conversation naturally:\n\n${historyText}`,
            },
          ],
        },
      ],
      config: {
        temperature: 0.3,
        maxOutputTokens: 200,
      },
    });
    return result.text ?? "";
  } catch {
    return "";
  }
}

export async function generateConciergeResponse(
  userMessage: string,
  conversationHistory: ChatMessage[],
  guestFirstName?: string,
  contextSummary?: string,
  detectedLanguage?: string,
  chatMode?: ChatMode
): Promise<{ response: string; category: string }> {
  const systemNote = buildSystemPrompt(
    chatMode ?? "general",
    guestFirstName,
    contextSummary,
    detectedLanguage
  );

  const contents = conversationHistory.slice(-8).map((msg) => ({
    role: msg.role === "assistant" ? ("model" as const) : ("user" as const),
    parts: [{ text: msg.content }],
  }));

  contents.push({
    role: "user",
    parts: [{ text: userMessage }],
  });

  try {
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction: systemNote,
        temperature: 0.7,
        maxOutputTokens: 8192,
      },
    });

    const responseText =
      result.text ??
      "I apologize, I'm having trouble responding right now. Please try again.";
    const category = chatMode === "food" ? "room_service"
      : chatMode === "support" ? "support"
      : chatMode === "care" ? "care"
      : detectCategory(userMessage);

    return { response: responseText, category };
  } catch (error) {
    throw new Error(
      `Failed to generate AI response: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
