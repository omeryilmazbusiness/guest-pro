import type { HotelAssistantConfigDto } from "./types";
import { AMENITY_CATALOG } from "./defaults";
import { resolveExploreCity } from "./city-context";

export interface NearbyPlacePromptRow {
  name: string;
  type: string;
  description?: string | null;
  address?: string | null;
}

export interface AssistantPromptContext {
  nearbyPlaces?: NearbyPlacePromptRow[];
}

function amenityLabel(id: string): string {
  return AMENITY_CATALOG.find((a) => a.id === id)?.label ?? id;
}

function formatHours(open?: string | null, close?: string | null): string {
  const o = open?.trim();
  const c = close?.trim();
  if (o && c) return `${o}–${c}`;
  if (o) return `from ${o}`;
  if (c) return `until ${c}`;
  return "";
}

const NEARBY_TYPE_LABELS: Record<string, string> = {
  market: "Market",
  pharmacy: "Pharmacy",
  bazaar: "Bazaar",
  mall: "Mall",
  restaurant: "Restaurant",
  other: "Nearby",
};

function buildRoadmapRules(exploreLabel: string | null): string {
  if (!exploreLabel) {
    return `ROADMAP: City not configured — ask guest to check with reception for local tours, or use hotel facilities only.`;
  }
  return `ROADMAP RULES (explore / plan / trip / walk / bored / sightseeing):
- Base city ONLY: ${exploreLabel}. Never plan a different city unless the guest explicitly requests another.
- Design a personal fast-paced tour (half-day 6–8 stops, full-day 8–10 stops).
- Section mix (tag each stop with category):
  • Famous sights — landmark + view: iconic monuments, squares, waterfronts, skyline lookouts.
  • Must-try flavors — street_food: signature dishes, markets, bakeries, local drinks unique to ${exploreLabel}.
  • Local experiences — culture + shopping: museums, bazaars, neighborhoods, country-specific rituals/activities guests should try once.
- Use real well-known places for ${exploreLabel}. Include GM "Nearby picks" as hotel_pick stops when listed below.
- Hotel activities: recommend ONLY facilities marked enabled below — never invent spa/pool/etc.
- Output after a ≤18-word intro (intro only — full detail lives in JSON):
<ROADMAP>{"title":"…","city":"${exploreLabel}","summary":"1-sentence tour pitch","postcardNote":"warm 1-sentence friendly memory-style sign-off in guest language (unique each time)","stops":[{"title":"…","subtitle":"…","duration":"30–90 min","category":"landmark|street_food|culture|view|shopping|hotel_pick","tip":"practical tip"},…]}</ROADMAP>`;
}

export function formatAssistantPromptBlock(
  config: HotelAssistantConfigDto,
  hotelName: string,
  ctx: AssistantPromptContext = {},
): string {
  const explore = resolveExploreCity(config);
  const lines: string[] = [
    `HOTEL AI KNOWLEDGE (${hotelName}):`,
    "Authoritative GM-configured data. Use ONLY this for hotel services, facilities, local city tours, and concierge. Never invent phones, hours, or amenities.",
  ];

  if (config.aboutHotel.trim()) {
    lines.push(`About: ${config.aboutHotel.trim().slice(0, 1200)}`);
  }

  if (explore) {
    lines.push(
      `Explore base city: ${explore.label}`,
      `All city roadmaps and sightseeing plans MUST be set in ${explore.label}.`,
    );
  }

  const enabledAmenities = config.amenities.filter((a) => a.enabled);
  if (enabledAmenities.length > 0) {
    lines.push("Enabled hotel facilities (only these may be suggested to guests):");
    for (const a of enabledAmenities) {
      const parts = [amenityLabel(a.id)];
      const hours = formatHours(a.openTime, a.closeTime);
      if (hours) parts.push(`hours ${hours}`);
      if (a.reservationPhone?.trim()) parts.push(`reservation ${a.reservationPhone.trim()}`);
      if (a.notes?.trim()) parts.push(a.notes.trim().slice(0, 200));
      lines.push(`- ${parts.join(" · ")}`);
    }
  } else {
    lines.push("Enabled hotel facilities: none configured — do not suggest on-site activities beyond reception.");
  }

  const nearby = ctx.nearbyPlaces ?? [];
  if (nearby.length > 0) {
    lines.push("GM nearby picks (prioritize in roadmaps as hotel_pick stops):");
    for (const p of nearby.slice(0, 12)) {
      const type = NEARBY_TYPE_LABELS[p.type] ?? p.type;
      const extra = [type, p.address?.trim(), p.description?.trim()].filter(Boolean).join(" · ");
      lines.push(`- ${p.name}${extra ? ` (${extra})` : ""}`);
    }
  }

  if (config.taxiLobbyPhone?.trim() || config.taxiNotes?.trim()) {
    lines.push(
      `Taxi: lobby desk ${config.taxiLobbyPhone?.trim() ?? "ask reception"}${config.taxiNotes?.trim() ? ` — ${config.taxiNotes.trim().slice(0, 200)}` : ""}`,
    );
  }

  if (config.spaPhone?.trim() || config.spaInfo?.trim()) {
    const hours = formatHours(config.spaOpenTime, config.spaCloseTime);
    lines.push(
      `Spa & wellness: ${config.spaPhone?.trim() ?? "reception"}${hours ? ` · ${hours}` : ""}${config.spaInfo?.trim() ? ` — ${config.spaInfo.trim().slice(0, 200)}` : ""}`,
    );
  }

  if (config.salonInfo?.trim() || config.salonPhone?.trim()) {
    const hours = formatHours(config.salonOpenTime, config.salonCloseTime);
    lines.push(
      `Salon: ${config.salonPhone?.trim() ?? "reception"}${hours ? ` · ${hours}` : ""}${config.salonInfo?.trim() ? ` — ${config.salonInfo.trim().slice(0, 200)}` : ""}`,
    );
  }

  if (config.laundryInfo?.trim() || config.laundryPhone?.trim()) {
    lines.push(
      `Laundry: ${config.laundryPhone?.trim() ?? "reception"}${config.laundryInfo?.trim() ? ` — ${config.laundryInfo.trim().slice(0, 200)}` : ""}`,
    );
  }

  lines.push(buildRoadmapRules(explore?.label ?? null));

  if (lines.length <= 2) {
    return "HOTEL AI KNOWLEDGE: Not configured yet — offer reception for service bookings and local tips.";
  }

  return lines.join("\n");
}
