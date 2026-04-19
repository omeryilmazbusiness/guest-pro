/**
 * Welcome-area alert types and API fetch helpers.
 * Used by the manager dashboard to display anonymous guest help requests.
 */

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
  const res = await fetch("/api/welcome-alerts");
  if (!res.ok) throw new Error("Failed to fetch welcome alerts");
  return res.json() as Promise<WelcomeAlert[]>;
}

export async function acknowledgeWelcomeAlert(id: number): Promise<WelcomeAlert> {
  const res = await fetch(`/api/welcome-alerts/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "acknowledged" }),
  });
  if (!res.ok) throw new Error("Failed to acknowledge alert");
  return res.json() as Promise<WelcomeAlert>;
}
