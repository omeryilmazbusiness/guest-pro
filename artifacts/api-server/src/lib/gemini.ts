import { ai } from "@workspace/integrations-gemini-ai";

const HOTEL_SYSTEM_PROMPT = `You are a premium hotel AI concierge assistant. Your name is "Aria" and you work at a luxury hotel.

Your personality:
- Warm, professional, and attentive
- Always address guests by their first name when known
- Speak with elegance and care
- Multilingual: respond in the same language the guest uses
- Keep responses concise but complete — guests are on mobile devices

Your capabilities:
- Answer questions about hotel amenities, services, and facilities
- Help with room service, housekeeping, and maintenance requests
- Provide local area recommendations (dining, attractions, transportation)
- Assist with wake-up calls, spa bookings, and activity inquiries
- Handle special requests with grace

For each guest message, also classify the request category internally:
- reception: front desk, check-in/out, keys, general inquiries
- room_service: food, drinks, amenities to room
- housekeeping: cleaning, towels, linens
- activities: spa, pool, gym, local attractions
- transport: taxi, airport transfers, car rental
- maintenance: repairs, issues in room
- general: everything else

Keep responses under 150 words. Be warm and helpful.`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function detectCategory(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("reception") || lower.includes("check") || lower.includes("key") || lower.includes("desk")) {
    return "reception";
  } else if (lower.includes("room service") || lower.includes("food") || lower.includes("drink") || lower.includes("eat") || lower.includes("breakfast") || lower.includes("lunch") || lower.includes("dinner")) {
    return "room_service";
  } else if (lower.includes("clean") || lower.includes("towel") || lower.includes("housekeep") || lower.includes("linen")) {
    return "housekeeping";
  } else if (lower.includes("spa") || lower.includes("pool") || lower.includes("gym") || lower.includes("activit") || lower.includes("tour")) {
    return "activities";
  } else if (lower.includes("taxi") || lower.includes("transport") || lower.includes("airport") || lower.includes("car")) {
    return "transport";
  }
  return "general";
}

export async function generateConciergeResponse(
  userMessage: string,
  conversationHistory: ChatMessage[],
  guestFirstName?: string
): Promise<{ response: string; category: string }> {
  const systemNote = guestFirstName
    ? `${HOTEL_SYSTEM_PROMPT}\n\nThe guest's first name is ${guestFirstName}.`
    : HOTEL_SYSTEM_PROMPT;

  const contents = conversationHistory.slice(-10).map((msg) => ({
    role: msg.role === "assistant" ? "model" as const : "user" as const,
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

    const responseText = result.text ?? "I apologize, I'm having trouble responding right now. Please try again.";
    const category = detectCategory(userMessage);

    return { response: responseText, category };
  } catch (error) {
    throw new Error(`Failed to generate AI response: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
