import https from "https";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

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

interface GeminiPart {
  text: string;
}

interface GeminiContent {
  role: string;
  parts: GeminiPart[];
}

function makeRequest(body: object): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!GEMINI_API_KEY) {
      reject(new Error("GEMINI_API_KEY is not configured"));
      return;
    }

    const url = new URL(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`);
    const data = JSON.stringify(body);

    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
      },
    };

    const req = https.request(options, (response) => {
      let responseData = "";
      response.on("data", (chunk: Buffer) => {
        responseData += chunk.toString();
      });
      response.on("end", () => {
        resolve(responseData);
      });
    });

    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function generateConciergeResponse(
  userMessage: string,
  conversationHistory: ChatMessage[],
  guestFirstName?: string
): Promise<{ response: string; category: string }> {
  const systemNote = guestFirstName
    ? `${HOTEL_SYSTEM_PROMPT}\n\nThe guest's first name is ${guestFirstName}.`
    : HOTEL_SYSTEM_PROMPT;

  const contents: GeminiContent[] = [];

  for (const msg of conversationHistory.slice(-10)) {
    contents.push({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    });
  }

  contents.push({
    role: "user",
    parts: [{ text: userMessage }],
  });

  const requestBody = {
    system_instruction: {
      parts: [{ text: systemNote }],
    },
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 300,
    },
  };

  try {
    const responseText = await makeRequest(requestBody);
    const parsed = JSON.parse(responseText);

    if (parsed.error) {
      throw new Error(parsed.error.message ?? "Gemini API error");
    }

    const responseContent: string = parsed.candidates?.[0]?.content?.parts?.[0]?.text ?? "I apologize, I'm having trouble responding right now. Please try again.";

    const lowerMessage = userMessage.toLowerCase();
    let category = "general";
    if (lowerMessage.includes("reception") || lowerMessage.includes("check") || lowerMessage.includes("key") || lowerMessage.includes("desk")) {
      category = "reception";
    } else if (lowerMessage.includes("room service") || lowerMessage.includes("food") || lowerMessage.includes("drink") || lowerMessage.includes("eat")) {
      category = "room_service";
    } else if (lowerMessage.includes("clean") || lowerMessage.includes("towel") || lowerMessage.includes("housekeep") || lowerMessage.includes("linen")) {
      category = "housekeeping";
    } else if (lowerMessage.includes("spa") || lowerMessage.includes("pool") || lowerMessage.includes("gym") || lowerMessage.includes("activit") || lowerMessage.includes("tour")) {
      category = "activities";
    } else if (lowerMessage.includes("taxi") || lowerMessage.includes("transport") || lowerMessage.includes("airport") || lowerMessage.includes("car")) {
      category = "transport";
    }

    return { response: responseContent, category };
  } catch (error) {
    throw new Error(`Failed to generate AI response: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
