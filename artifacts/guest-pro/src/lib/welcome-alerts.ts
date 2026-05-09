/**
 * Welcome-area alert types and API fetch helpers.
 * Uses customFetch so the Bearer token is automatically attached.
 */
import { customFetch } from "@workspace/api-client-react";

export interface WelcomeAlert {
  id: number;
  hotelId: number;
  selectedLanguage: string;
  sessionId: string;
  status: "open" | "acknowledged";
  createdAt: string;
  acknowledgedAt: string | null;
}

export async function listWelcomeAlerts(): Promise<WelcomeAlert[]> {
  return customFetch<WelcomeAlert[]>("/api/welcome-alerts");
}

export async function acknowledgeWelcomeAlert(id: number): Promise<WelcomeAlert> {
  return customFetch<WelcomeAlert>(`/api/welcome-alerts/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "acknowledged" }),
  });
}
