import { customFetch } from "@workspace/api-client-react";
import type { GuestUiLocale } from "@/lib/guest-locale";

export interface UpdateGuestLanguageResponse {
  uiLocale: GuestUiLocale;
  language: string;
}

export async function updateGuestLanguage(uiLocale: GuestUiLocale): Promise<UpdateGuestLanguageResponse> {
  return customFetch<UpdateGuestLanguageResponse>("/api/guest/language", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uiLocale }),
  });
}
