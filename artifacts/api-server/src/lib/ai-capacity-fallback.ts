/**
 * Graceful guest-facing response when all Gemini models are unavailable.
 * Returns a normal assistant message + quick-action chips (no HTTP error).
 */


export interface QuickActionRoute {
  id: string;
  label: string;
  /** guest-pro route path */
  href: string;
  /** optional prefill for chat */
  chatMessage?: string;
}

export interface AiCapacityFallbackPayload {
  guestText: string;
  replyOptions: string[];
  quickActionRoutes: QuickActionRoute[];
  category: string;
  originalContent: string;
}

type LangPack = {
  guestText: (name: string) => string;
  options: [string, string, string, string];
  routes: QuickActionRoute[];
};

function pack(lang: string | undefined, firstName?: string): AiCapacityFallbackPayload {
  const name = firstName?.trim() ? `${firstName}, ` : "";
  const l = (lang ?? "en").toLowerCase();

  const packs: Record<string, LangPack> = {
    tr: {
      guestText: (n) =>
        `${n}bugünkü AI sohbet kotamız doldu — yarın tekrar deneyebilirsiniz. Hemen yardım için aşağıdaki hızlı işlemleri kullanın; ekibimiz anında ilgilenir.`,
      options: ["Yemek siparişi", "Destek talebi", "Otel bilgisi", "Care profilim"],
      routes: [
        { id: "food", label: "Yemek siparişi", href: "/guest/flow?mode=food" },
        { id: "support", label: "Destek talebi", href: "/guest/flow?mode=support" },
        { id: "info", label: "Otel bilgisi", href: "/guest/chat", chatMessage: "Otel hizmetleri ve saatler hakkında bilgi" },
        { id: "care", label: "Care About Me", href: "/guest/flow?mode=care" },
      ],
    },
    en: {
      guestText: (n) =>
        `${n}today's AI chat capacity is full — please try again tomorrow. For immediate help, use the quick actions below and our team will assist you right away.`,
      options: ["Order food", "Get support", "Hotel info", "My preferences"],
      routes: [
        { id: "food", label: "Order food", href: "/guest/flow?mode=food" },
        { id: "support", label: "Get support", href: "/guest/flow?mode=support" },
        { id: "info", label: "Hotel info", href: "/guest/chat", chatMessage: "Hotel services and hours" },
        { id: "care", label: "Care About Me", href: "/guest/flow?mode=care" },
      ],
    },
  };

  const p = l.startsWith("tr")
    ? packs.tr!
    : l.startsWith("de")
      ? {
          guestText: (n: string) =>
            `${n}die KI-Chat-Kapazität für heute ist erschöpft. Bitte nutzen Sie die Schnellaktionen unten.`,
          options: ["Essen bestellen", "Support", "Hotelinfo", "Präferenzen"] as [
            string,
            string,
            string,
            string,
          ],
          routes: packs.en!.routes,
        }
      : packs.en!;

  const guestText = p.guestText(name);
  const replyOptions = [...p.options];

  return {
    guestText,
    replyOptions,
    quickActionRoutes: p.routes,
    category: "ai_capacity_limited",
    originalContent: JSON.stringify({ replyOptions, quickActionRoutes: p.routes }),
  };
}

export function buildAiCapacityFallback(
  lang?: string,
  firstName?: string,
): AiCapacityFallbackPayload {
  return pack(lang, firstName);
}
