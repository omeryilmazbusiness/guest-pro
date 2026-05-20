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
    ar: {
      guestText: (n) =>
        `${n}اكتملت سعة الدردشة الذكية اليوم — حاول غداً. للمساعدة الفورية استخدم الإجراءات السريعة أدناه.`,
      options: ["طلب طعام", "طلب دعم", "معلومات الفندق", "تفضيلاتي"],
      routes: [
        { id: "food", label: "طلب طعام", href: "/guest/flow?mode=food" },
        { id: "support", label: "طلب دعم", href: "/guest/flow?mode=support" },
        { id: "info", label: "معلومات الفندق", href: "/guest/chat", chatMessage: "معلومات عن خدمات الفندق" },
        { id: "care", label: "اعتنِ بي", href: "/guest/flow?mode=care" },
      ],
    },
    ru: {
      guestText: (n) =>
        `${n}лимит ИИ-чата на сегодня исчерпан — попробуйте завтра. Для срочной помощи используйте быстрые действия ниже.`,
      options: ["Заказ еды", "Поддержка", "Инфо об отеле", "Мои предпочтения"],
      routes: [
        { id: "food", label: "Заказ еды", href: "/guest/flow?mode=food" },
        { id: "support", label: "Поддержка", href: "/guest/flow?mode=support" },
        { id: "info", label: "Инфо об отеле", href: "/guest/chat", chatMessage: "Услуги и часы работы отеля" },
        { id: "care", label: "Позаботьтесь обо мне", href: "/guest/flow?mode=care" },
      ],
    },
    de: {
      guestText: (n) =>
        `${n}die KI-Chat-Kapazität für heute ist erschöpft. Bitte nutzen Sie die Schnellaktionen unten.`,
      options: ["Essen bestellen", "Support", "Hotelinfo", "Präferenzen"],
      routes: [
        { id: "food", label: "Essen bestellen", href: "/guest/flow?mode=food" },
        { id: "support", label: "Support", href: "/guest/flow?mode=support" },
        { id: "info", label: "Hotelinfo", href: "/guest/chat", chatMessage: "Hotel services and hours" },
        { id: "care", label: "Care About Me", href: "/guest/flow?mode=care" },
      ],
    },
    fr: {
      guestText: (n) =>
        `${n}la capacité de chat IA est pleine pour aujourd'hui — réessayez demain. Utilisez les actions rapides ci-dessous.`,
      options: ["Commander", "Assistance", "Infos hôtel", "Mes préférences"],
      routes: [
        { id: "food", label: "Commander", href: "/guest/flow?mode=food" },
        { id: "support", label: "Assistance", href: "/guest/flow?mode=support" },
        { id: "info", label: "Infos hôtel", href: "/guest/chat", chatMessage: "Services et horaires de l'hôtel" },
        { id: "care", label: "Prenez soin de moi", href: "/guest/flow?mode=care" },
      ],
    },
    es: {
      guestText: (n) =>
        `${n}la capacidad de chat IA de hoy está llena — inténtelo mañana. Use las acciones rápidas abajo.`,
      options: ["Pedir comida", "Soporte", "Info del hotel", "Mis preferencias"],
      routes: [
        { id: "food", label: "Pedir comida", href: "/guest/flow?mode=food" },
        { id: "support", label: "Soporte", href: "/guest/flow?mode=support" },
        { id: "info", label: "Info del hotel", href: "/guest/chat", chatMessage: "Servicios y horarios del hotel" },
        { id: "care", label: "Cuídame", href: "/guest/flow?mode=care" },
      ],
    },
  };

  const key = l.startsWith("tr")
    ? "tr"
    : l.startsWith("ar")
      ? "ar"
      : l.startsWith("ru")
        ? "ru"
        : l.startsWith("de")
          ? "de"
          : l.startsWith("fr")
            ? "fr"
            : l.startsWith("es")
              ? "es"
              : "en";
  const p = packs[key] ?? packs.en!;

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
