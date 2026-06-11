import { customFetch } from "@workspace/api-client-react";

export interface HotelAmenityConfig {
  id: string;
  enabled: boolean;
  openTime?: string;
  closeTime?: string;
  reservationPhone?: string;
  notes?: string;
}

export interface HotelAssistantConfig {
  hotelId: number;
  aboutHotel: string;
  cityName: string | null;
  countryCode: string | null;
  amenities: HotelAmenityConfig[];
  taxiLobbyPhone: string | null;
  taxiNotes: string | null;
  spaPhone: string | null;
  spaInfo: string | null;
  spaOpenTime: string | null;
  spaCloseTime: string | null;
  salonInfo: string | null;
  salonPhone: string | null;
  salonOpenTime: string | null;
  salonCloseTime: string | null;
  laundryInfo: string | null;
  laundryPhone: string | null;
  onboardingCompletedAt: string | null;
}

export interface AssistantCompletion {
  percent: number;
  completedSteps: string[];
  pendingSteps: string[];
  isComplete: boolean;
}

export interface AssistantOnboardingStep {
  id: string;
  label: string;
  done: boolean;
}

export interface AmenityCatalogItem {
  id: string;
  label: string;
}

export interface AssistantConfigResponse {
  config: HotelAssistantConfig;
  completion: AssistantCompletion;
  steps: AssistantOnboardingStep[];
  amenityCatalog: AmenityCatalogItem[];
}

export type AssistantConfigPatch = Partial<
  Omit<HotelAssistantConfig, "hotelId" | "onboardingCompletedAt">
> & { dismissOnboarding?: boolean };

export async function fetchAssistantConfig(): Promise<AssistantConfigResponse> {
  return customFetch<AssistantConfigResponse>("/api/hotel/assistant-config");
}

export async function saveAssistantConfig(
  patch: AssistantConfigPatch,
): Promise<AssistantConfigResponse> {
  return customFetch<AssistantConfigResponse>("/api/hotel/assistant-config", {
    method: "PUT",
    body: JSON.stringify(patch),
  });
}

export const ASSISTANT_SECTION_IDS: Record<string, string> = {
  about: "assistant-about",
  facilities: "assistant-facilities",
  taxi: "assistant-taxi",
  spa: "assistant-spa",
  salon: "assistant-salon",
  laundry: "assistant-laundry",
};
