import { ai } from "@workspace/integrations-gemini-ai";

const HOTEL_SYSTEM_PROMPT = `You are a premium hotel AI concierge assistant. Your name is "Aria" and you work at a luxury hotel.

Your personality:
- Warm, professional, and attentive
- Always address guests by their first name when known
- Speak with elegance and care
- Multilingual: detect the language the guest is writing or speaking in and always respond in that exact same language
- Keep responses concise but complete — guests are on mobile devices

Your capabilities:
- Answer questions about hotel amenities, services, and facilities
- Help with room service, housekeeping, and maintenance requests
- Provide local area recommendations (dining, attractions, transportation)
- Assist with wake-up calls, spa bookings, and activity inquiries
- Handle special requests with grace

Language rule: If the guest message is in Turkish, respond in Turkish. If Arabic, respond in Arabic. If Russian, respond in Russian. Match the guest's language exactly.

Keep responses under 150 words. Be warm and helpful.`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function detectCategory(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("reception") || lower.includes("check") || lower.includes("key") || lower.includes("desk") || lower.includes("resepsiyon") || lower.includes("anahtar")) {
    return "reception";
  } else if (lower.includes("room service") || lower.includes("food") || lower.includes("drink") || lower.includes("eat") || lower.includes("breakfast") || lower.includes("yemek") || lower.includes("kahvaltı")) {
    return "room_service";
  } else if (lower.includes("clean") || lower.includes("towel") || lower.includes("housekeep") || lower.includes("temizlik") || lower.includes("havlu")) {
    return "housekeeping";
  } else if (lower.includes("spa") || lower.includes("pool") || lower.includes("gym") || lower.includes("activit") || lower.includes("havuz")) {
    return "activities";
  } else if (lower.includes("taxi") || lower.includes("transport") || lower.includes("airport") || lower.includes("car") || lower.includes("taksi") || lower.includes("transfer")) {
    return "transport";
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
  detectedLanguage?: string
): Promise<{ response: string; category: string }> {
  let systemNote = HOTEL_SYSTEM_PROMPT;

  if (guestFirstName) {
    systemNote += `\n\nThe guest's first name is ${guestFirstName}.`;
  }

  if (contextSummary) {
    systemNote += `\n\nEarlier conversation summary (use this as background context): ${contextSummary}`;
  }

  if (detectedLanguage) {
    systemNote += `\n\nThe guest is communicating in: ${detectedLanguage}. Respond in this language.`;
  }

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
    const category = detectCategory(userMessage);

    return { response: responseText, category };
  } catch (error) {
    throw new Error(
      `Failed to generate AI response: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
