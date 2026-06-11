import type { GuestTranslations } from "@/lib/i18n";

export type GuestChatStarterMode = "food" | "support" | "care" | "general";

export type GuestChatStarterIcon =
  | "food"
  | "trip"
  | "explore"
  | "spa"
  | "support"
  | "taxi"
  | "hotel";

type StarterKey =
  | "chatStarterFoodTitle"
  | "chatStarterFoodHint"
  | "chatStarterFoodPrompt"
  | "chatStarterTripTitle"
  | "chatStarterTripHint"
  | "chatStarterTripPrompt"
  | "chatStarterExploreTitle"
  | "chatStarterExploreHint"
  | "chatStarterExplorePrompt"
  | "chatStarterSpaTitle"
  | "chatStarterSpaHint"
  | "chatStarterSpaPrompt"
  | "chatStarterSupportTitle"
  | "chatStarterSupportHint"
  | "chatStarterSupportPrompt"
  | "chatStarterTaxiTitle"
  | "chatStarterTaxiHint"
  | "chatStarterTaxiPrompt"
  | "chatStarterHotelTitle"
  | "chatStarterHotelHint"
  | "chatStarterHotelPrompt";

export interface GuestChatStarterDef {
  id: string;
  mode: GuestChatStarterMode;
  icon: GuestChatStarterIcon;
  titleKey: StarterKey;
  hintKey: StarterKey;
  promptKey: StarterKey;
}

export const GUEST_CHAT_STARTERS: GuestChatStarterDef[] = [
  {
    id: "food",
    mode: "food",
    icon: "food",
    titleKey: "chatStarterFoodTitle",
    hintKey: "chatStarterFoodHint",
    promptKey: "chatStarterFoodPrompt",
  },
  {
    id: "trip",
    mode: "general",
    icon: "trip",
    titleKey: "chatStarterTripTitle",
    hintKey: "chatStarterTripHint",
    promptKey: "chatStarterTripPrompt",
  },
  {
    id: "explore",
    mode: "general",
    icon: "explore",
    titleKey: "chatStarterExploreTitle",
    hintKey: "chatStarterExploreHint",
    promptKey: "chatStarterExplorePrompt",
  },
  {
    id: "spa",
    mode: "general",
    icon: "spa",
    titleKey: "chatStarterSpaTitle",
    hintKey: "chatStarterSpaHint",
    promptKey: "chatStarterSpaPrompt",
  },
  {
    id: "support",
    mode: "support",
    icon: "support",
    titleKey: "chatStarterSupportTitle",
    hintKey: "chatStarterSupportHint",
    promptKey: "chatStarterSupportPrompt",
  },
  {
    id: "taxi",
    mode: "general",
    icon: "taxi",
    titleKey: "chatStarterTaxiTitle",
    hintKey: "chatStarterTaxiHint",
    promptKey: "chatStarterTaxiPrompt",
  },
  {
    id: "hotel",
    mode: "general",
    icon: "hotel",
    titleKey: "chatStarterHotelTitle",
    hintKey: "chatStarterHotelHint",
    promptKey: "chatStarterHotelPrompt",
  },
];

export interface ResolvedGuestChatStarter {
  id: string;
  mode: GuestChatStarterMode;
  icon: GuestChatStarterIcon;
  title: string;
  hint: string;
  prompt: string;
}

export function resolveGuestChatStarters(t: GuestTranslations): ResolvedGuestChatStarter[] {
  return GUEST_CHAT_STARTERS.map((starter) => ({
    id: starter.id,
    mode: starter.mode,
    icon: starter.icon,
    title: t[starter.titleKey],
    hint: t[starter.hintKey],
    prompt: t[starter.promptKey],
  }));
}
