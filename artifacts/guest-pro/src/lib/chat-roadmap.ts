import type { Message } from "@workspace/api-client-react";
import type { GuestTranslations } from "@/lib/i18n";

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
  /** AI-generated friendly sign-off for the downloadable postcard */
  postcardNote?: string;
  stops: ChatRoadmapStop[];
}

export type RoadmapSectionId = "sights" | "flavors" | "experiences";

export interface RoadmapSection {
  id: RoadmapSectionId;
  stops: ChatRoadmapStop[];
}

interface MessageExtras {
  roadmap?: ChatRoadmap;
}

export function getRoadmapFromMessage(message: Message): ChatRoadmap | null {
  if (!message.originalContent) return null;
  try {
    const parsed = JSON.parse(message.originalContent) as MessageExtras;
    const r = parsed.roadmap;
    if (!r?.title || !Array.isArray(r.stops) || r.stops.length === 0) return null;
    return r;
  } catch {
    return null;
  }
}

export function groupRoadmapStops(stops: ChatRoadmapStop[]): RoadmapSection[] {
  const groups: Record<RoadmapSectionId, ChatRoadmapStop[]> = {
    sights: [],
    flavors: [],
    experiences: [],
  };

  for (const stop of stops) {
    const cat = stop.category;
    if (cat === "landmark" || cat === "view") groups.sights.push(stop);
    else if (cat === "street_food") groups.flavors.push(stop);
    else groups.experiences.push(stop);
  }

  const order: RoadmapSectionId[] = ["sights", "flavors", "experiences"];
  const sections = order
    .map((id) => ({ id, stops: groups[id] }))
    .filter((section) => section.stops.length > 0);

  if (sections.length > 0) return sections;
  return [{ id: "sights", stops }];
}

export function roadmapSectionTitle(id: RoadmapSectionId, t: GuestTranslations): string {
  if (id === "sights") return t.roadmapSectionSights;
  if (id === "flavors") return t.roadmapSectionFlavors;
  return t.roadmapSectionExperiences;
}

export function stopCategoryEmoji(category?: ChatRoadmapStopCategory): string {
  switch (category) {
    case "landmark":
      return "🏛️";
    case "street_food":
      return "🍽️";
    case "culture":
      return "🎭";
    case "view":
      return "🌅";
    case "shopping":
      return "🛍️";
    case "hotel_pick":
      return "🏨";
    default:
      return "📍";
  }
}

export const ROADMAP_CATEGORY_LABELS: Record<ChatRoadmapStopCategory, string> = {
  landmark: "Landmark",
  street_food: "Street food",
  culture: "Culture",
  view: "Viewpoint",
  shopping: "Shopping",
  hotel_pick: "Hotel pick",
};
