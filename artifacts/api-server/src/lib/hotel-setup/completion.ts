import type {
  HotelSetupCompletion,
  HotelSetupContext,
  HotelSetupStep,
} from "./types";

/** Keep in sync with guest-pro `ABOUT_HOTEL_MIN_CHARS` in lib/hotel-setup.ts */
export const ABOUT_HOTEL_MIN_CHARS = 20;

export const SETUP_STEP_DEFS = [
  {
    id: "about",
    weight: 25,
    label: "About hotel",
    test: (ctx: HotelSetupContext) => ctx.aboutHotel.trim().length >= ABOUT_HOTEL_MIN_CHARS,
  },
  {
    id: "services",
    weight: 25,
    label: "Guest services",
    test: (ctx: HotelSetupContext) => ctx.enabledAmenityCount > 0,
  },
  {
    id: "wifi",
    weight: 25,
    label: "Wi-Fi",
    test: (ctx: HotelSetupContext) => ctx.wifiNetworkCount > 0,
  },
  {
    id: "nearby",
    weight: 25,
    label: "Nearby places",
    test: (ctx: HotelSetupContext) => ctx.nearbyPlaceCount > 0,
  },
] as const;

export function computeHotelSetupCompletion(ctx: HotelSetupContext): HotelSetupCompletion {
  let percent = 0;
  const completedSteps: string[] = [];
  const pendingSteps: string[] = [];

  for (const step of SETUP_STEP_DEFS) {
    if (step.test(ctx)) {
      percent += step.weight;
      completedSteps.push(step.id);
    } else {
      pendingSteps.push(step.id);
    }
  }

  return {
    percent: Math.min(100, percent),
    completedSteps,
    pendingSteps,
    isComplete: percent >= 100,
  };
}

export function buildHotelSetupSteps(ctx: HotelSetupContext): HotelSetupStep[] {
  return SETUP_STEP_DEFS.map((step) => ({
    id: step.id,
    label: step.label,
    done: step.test(ctx),
  }));
}
