import type { HotelAmenityConfig } from "@workspace/db";

export type { HotelAmenityConfig };

export interface HotelAssistantConfigDto {
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

export interface AssistantCompletionSnapshot {
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

export type ChatRoadmapStopCategory =
  | "landmark"
  | "street_food"
  | "culture"
  | "view"
  | "shopping"
  | "hotel_pick";

export interface ChatRoadmapStop {
  title: string;
  subtitle?: string;
  duration?: string;
  category?: ChatRoadmapStopCategory;
  tip?: string;
}

export interface ChatRoadmap {
  title: string;
  city?: string;
  summary?: string;
  stops: ChatRoadmapStop[];
}
