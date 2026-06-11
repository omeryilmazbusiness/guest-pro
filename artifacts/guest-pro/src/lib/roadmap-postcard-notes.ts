import type { GuestTranslations } from "@/lib/i18n";
import type { ChatRoadmap } from "@/lib/chat-roadmap";

function hashSeed(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function pickPostcardNote(roadmap: ChatRoadmap, t: GuestTranslations): string {
  if (roadmap.postcardNote?.trim()) return roadmap.postcardNote.trim();
  const city = roadmap.city?.split(",")[0]?.trim() ?? roadmap.city ?? "";
  const pool = [
    t.roadmapPostcardNote1,
    t.roadmapPostcardNote2,
    t.roadmapPostcardNote3,
    t.roadmapPostcardNote4,
  ];
  const idx = hashSeed(`${roadmap.title}|${roadmap.city}|${roadmap.stops.length}`) % pool.length;
  return pool[idx]!.replace(/\{city\}/g, city);
}
