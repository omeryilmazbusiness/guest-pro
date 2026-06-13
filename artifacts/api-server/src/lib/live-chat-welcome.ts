/**
 * Welcome messages for live chat — professional, short, per guest language.
 */
const WELCOME_BY_LANG: Record<string, string> = {
  en: "Hello, I'm connecting you live from reception. How may I assist you?",
  tr: "Merhaba, resepsiyondan canlı olarak bağlanıyorum. Size nasıl yardımcı olabilirim?",
  ar: "مرحباً، أتواصل معك مباشرة من الاستقبال. كيف يمكنني مساعدتك؟",
  de: "Guten Tag, ich verbinde Sie live mit der Rezeption. Wie kann ich Ihnen helfen?",
  es: "Hola, le atiendo en directo desde recepción. ¿En qué puedo ayudarle?",
  fr: "Bonjour, je vous mets en contact en direct avec la réception. Comment puis-je vous aider ?",
  ru: "Здравствуйте, я на связи с ресепшеном. Чем могу помочь?",
  it: "Buongiorno, la metto in contatto live con la reception. Come posso aiutarla?",
  fa: "سلام، از پذیرش به‌صورت زنده با شما در ارتباط هستم. چطور می‌توانم کمکتان کنم؟",
  he: "שלום, אני מתחבר אליך בשידור חי מהקבלה. איך אוכל לעזור?",
  ku: "Silav, ji resepsiyonê bi zindî têkilîya we dikim. Çawa dikarim alîkariya we bikim?",
  ur: "السلام علیکم، میں ریسپشن سے براہِ راست رابطے میں ہوں۔ میں آپ کی کیا مدد کر سکتا/سکتی ہوں؟",
};

export function resolveGuestLanguage(lang?: string | null): string {
  if (!lang?.trim()) return "en";
  const base = lang.trim().toLowerCase().split("-")[0] ?? "en";
  return WELCOME_BY_LANG[base] ? base : "en";
}

export function getLiveChatWelcomeMessage(lang?: string | null): string {
  const code = resolveGuestLanguage(lang);
  return WELCOME_BY_LANG[code] ?? WELCOME_BY_LANG.en!;
}

/** Staff UI target languages */
export const STAFF_TARGET_LANGS = ["tr", "en", "ar"] as const;
export type StaffTargetLang = (typeof STAFF_TARGET_LANGS)[number];

export function resolveStaffTargetLang(locale?: string | null): StaffTargetLang {
  const base = locale?.trim().toLowerCase().split("-")[0] ?? "tr";
  if (base === "en" || base === "ar") return base;
  return "tr";
}

export function isStaffTyping(staffTypingUntil: Date | string | null | undefined): boolean {
  if (!staffTypingUntil) return false;
  return new Date(staffTypingUntil).getTime() > Date.now();
}

export function isGuestTyping(guestTranslatingUntil: Date | string | null | undefined): boolean {
  if (!guestTranslatingUntil) return false;
  return new Date(guestTranslatingUntil).getTime() > Date.now();
}

export function staffTypingExpiry(): Date {
  return new Date(Date.now() + 5_000);
}

/** Longer window while staff message is being translated for the guest. */
export function staffTranslatingExpiry(): Date {
  return new Date(Date.now() + 20_000);
}

/** Longer window while guest message is being translated for reception. */
export function guestTranslatingExpiry(): Date {
  return new Date(Date.now() + 20_000);
}
