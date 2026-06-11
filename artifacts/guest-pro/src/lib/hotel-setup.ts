import { customFetch } from "@workspace/api-client-react";
import { ROUTES } from "@/lib/app-routes";

/** Keep in sync with api-server `ABOUT_HOTEL_MIN_CHARS` in lib/hotel-setup/completion.ts */
export const ABOUT_HOTEL_MIN_CHARS = 20;

export interface HotelSetupStep {
  id: string;
  label: string;
  done: boolean;
}

export interface HotelSetupCompletion {
  percent: number;
  completedSteps: string[];
  pendingSteps: string[];
  isComplete: boolean;
}

export interface HotelSetupStatus {
  steps: HotelSetupStep[];
  completion: HotelSetupCompletion;
  dismissed: boolean;
}

export const SETUP_STEP_ANCHORS: Record<string, string> = {
  about: "assistant-about",
  services: "assistant-facilities",
  wifi: "setup-wifi",
  nearby: "setup-nearby",
};

export const SETUP_GUEST_SETTINGS_PATH = `${ROUTES.managerSettings}/guest`;

export async function fetchHotelSetupStatus(): Promise<HotelSetupStatus> {
  return customFetch<HotelSetupStatus>("/api/hotel/setup-wizard", { cache: "no-store" });
}

export async function dismissHotelSetupWizard(): Promise<HotelSetupStatus> {
  return customFetch<HotelSetupStatus>("/api/hotel/setup-wizard/dismiss", {
    method: "POST",
    body: JSON.stringify({ dismiss: true }),
  });
}
