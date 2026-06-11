import type { AssistantCompletionSnapshot, AssistantOnboardingStep, HotelAssistantConfigDto } from "./types";
import { ABOUT_HOTEL_MIN_CHARS } from "../hotel-setup/completion";

const STEPS = [
  {
    id: "about",
    weight: 20,
    test: (c: HotelAssistantConfigDto) => c.aboutHotel.trim().length >= ABOUT_HOTEL_MIN_CHARS,
  },
  {
    id: "facilities",
    weight: 25,
    test: (c: HotelAssistantConfigDto) => c.amenities.some((a) => a.enabled),
  },
  {
    id: "taxi",
    weight: 15,
    test: (c: HotelAssistantConfigDto) => Boolean(c.taxiLobbyPhone?.trim() || c.taxiNotes?.trim()),
  },
  {
    id: "spa",
    weight: 15,
    test: (c: HotelAssistantConfigDto) =>
      Boolean(c.spaPhone?.trim() || c.spaInfo?.trim() || c.spaOpenTime?.trim()),
  },
  {
    id: "salon",
    weight: 10,
    test: (c: HotelAssistantConfigDto) => Boolean(c.salonInfo?.trim() || c.salonPhone?.trim()),
  },
  {
    id: "laundry",
    weight: 15,
    test: (c: HotelAssistantConfigDto) => Boolean(c.laundryInfo?.trim() || c.laundryPhone?.trim()),
  },
] as const;

const STEP_LABELS: Record<string, string> = {
  about: "About the hotel",
  facilities: "Hotel facilities",
  taxi: "Taxi service",
  spa: "Spa & wellness",
  salon: "Salon",
  laundry: "Laundry",
};

export function computeAssistantCompletion(
  config: HotelAssistantConfigDto,
): AssistantCompletionSnapshot {
  let percent = 0;
  const completedSteps: string[] = [];
  const pendingSteps: string[] = [];

  for (const step of STEPS) {
    if (step.test(config)) {
      percent += step.weight;
      completedSteps.push(step.id);
    } else {
      pendingSteps.push(step.id);
    }
  }

  const isComplete = percent >= 100;
  return { percent: Math.min(100, percent), completedSteps, pendingSteps, isComplete };
}

export function buildOnboardingSteps(config: HotelAssistantConfigDto): AssistantOnboardingStep[] {
  return STEPS.map((step) => ({
    id: step.id,
    label: STEP_LABELS[step.id] ?? step.id,
    done: step.test(config),
  }));
}
