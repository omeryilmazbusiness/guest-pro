import { customFetch } from "@workspace/api-client-react";

export interface SuggestedChatAction {
  intent: string;
  requestType: "FOOD_ORDER" | "SUPPORT_REQUEST" | "CARE_PROFILE_UPDATE" | null;
  summary: string;
  structuredData?: Record<string, unknown>;
  phase: "propose" | "confirmed";
  urgency?: "normal" | "urgent";
}

export interface QuickActionRoute {
  id: string;
  label: string;
  href: string;
  chatMessage?: string;
}

export interface SendMessageExtras {
  suggestedAction?: SuggestedChatAction | null;
  replyOptions?: string[];
  aiCapacityExceeded?: boolean;
  quickActionRoutes?: QuickActionRoute[];
  requestCreated?: { requestId: number } | null;
}

export async function confirmChatAction(
  sessionId: number,
  action: SuggestedChatAction,
  language?: string,
): Promise<{ assistantMessage: { id: number; content: string; role: string }; requestCreated: { requestId: number } }> {
  return customFetch(`/api/chat/sessions/${sessionId}/confirm-action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, language }),
  });
}
