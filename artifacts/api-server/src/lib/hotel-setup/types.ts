export interface HotelSetupContext {
  aboutHotel: string;
  enabledAmenityCount: number;
  wifiNetworkCount: number;
  nearbyPlaceCount: number;
  dismissed: boolean;
}

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
