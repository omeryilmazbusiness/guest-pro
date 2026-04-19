/**
 * Hotel content configuration.
 *
 * Two layers:
 *  1. HotelConfig       — factual data (Wi-Fi, phone, hours, menu, places).
 *                         Admins change this; no localization needed.
 *  2. WelcomingStrings  — UI labels per welcoming locale (6 languages only).
 *
 * To update hotel details: edit HOTEL_CONFIG below.
 * To update labels: edit the WELCOMING_STRINGS record.
 */

import type { WelcomingLocale, ServiceHours, NearbyPlace, MenuSection } from "./types";

// ── Hotel configuration ──────────────────────────────────────────────────────

export interface HotelConfig {
  name: string;
  wifi: { ssid: string; password: string };
  emergency: { number: string };
  dining: {
    breakfast: ServiceHours;
    lunch: ServiceHours;
    dinner: ServiceHours;
    roomService: string; // e.g. "24/7" or "08:00 – 22:00"
  };
  menu: MenuSection[];
  nearbyPlaces: NearbyPlace[];
}

export const HOTEL_CONFIG: HotelConfig = {
  name: "Grand Hotel",
  wifi: {
    ssid: "GrandHotel_Guest",
    password: "welcome2024",
  },
  emergency: {
    number: "+90 212 000 0000",
  },
  dining: {
    breakfast:   { open: "07:00", close: "10:30" },
    lunch:       { open: "12:00", close: "15:00" },
    dinner:      { open: "18:30", close: "22:30" },
    roomService: "24/7",
  },
  menu: [
    {
      category: "Breakfast",
      items: [
        { name: "Turkish Breakfast Platter" },
        { name: "Eggs Benedict" },
        { name: "Fresh Fruit & Yogurt" },
        { name: "Smoked Salmon Bagel" },
      ],
    },
    {
      category: "Mains",
      items: [
        { name: "Grilled Lamb Kebab" },
        { name: "Pan-Seared Sea Bass" },
        { name: "Mushroom Risotto" },
        { name: "Caesar Salad" },
      ],
    },
    {
      category: "Desserts",
      items: [
        { name: "Baklava Selection" },
        { name: "Chocolate Fondant" },
        { name: "Seasonal Sorbet" },
      ],
    },
  ],
  nearbyPlaces: [
    { name: "Migros Supermarket", type: "market",     distance: "180 m" },
    { name: "Eczane Pharmacy",    type: "pharmacy",   distance: "250 m" },
    { name: "Grand Bazaar",       type: "bazaar",     distance: "800 m" },
    { name: "Restaurant Row",     type: "restaurant", distance: "120 m" },
  ],
};

// ── Welcoming UI strings per locale ─────────────────────────────────────────

export interface WelcomingStrings {
  selectLanguage: string;
  continueToStay: string;
  greetingSubtitle: string;
  essentialsSection: string;
  wifiTitle: string;
  wifiNetwork: string;
  wifiPassword: string;
  emergencyTitle: string;
  emergencyCallLabel: string;
  diningSection: string;
  breakfastLabel: string;
  lunchLabel: string;
  dinnerLabel: string;
  roomServiceLabel: string;
  menuTitle: string;
  nearbySection: string;
  helpSection: string;
  supportTitle: string;
  supportDesc: string;
  supportAction: string;
  placeTypeMarket: string;
  placeTypePharmacy: string;
  placeTypeBazaar: string;
  placeTypeRestaurant: string;
  placeTypeOther: string;
}

export const WELCOMING_STRINGS: Record<WelcomingLocale, WelcomingStrings> = {
  en: {
    selectLanguage:    "Select your language",
    continueToStay:    "Continue to your stay",
    greetingSubtitle:  "Welcome",
    essentialsSection: "Essentials",
    wifiTitle:         "Wi-Fi",
    wifiNetwork:       "Network",
    wifiPassword:      "Password",
    emergencyTitle:    "Emergency & Help",
    emergencyCallLabel:"Call hotel",
    diningSection:     "Dining",
    breakfastLabel:    "Breakfast",
    lunchLabel:        "Lunch",
    dinnerLabel:       "Dinner",
    roomServiceLabel:  "Room Service",
    menuTitle:         "Menu Highlights",
    nearbySection:     "Nearby",
    helpSection:       "Support",
    supportTitle:      "Help & Complaints",
    supportDesc:       "Our concierge is available 24/7 for any issue, complaint, or request.",
    supportAction:     "Open Concierge",
    placeTypeMarket:   "Supermarket",
    placeTypePharmacy: "Pharmacy",
    placeTypeBazaar:   "Grand Bazaar",
    placeTypeRestaurant:"Restaurant",
    placeTypeOther:    "Place",
  },
  tr: {
    selectLanguage:    "Dilinizi seçin",
    continueToStay:    "Konaklamaya devam et",
    greetingSubtitle:  "Hoş geldiniz",
    essentialsSection: "Temel Bilgiler",
    wifiTitle:         "Wi-Fi",
    wifiNetwork:       "Ağ Adı",
    wifiPassword:      "Şifre",
    emergencyTitle:    "Acil & Yardım",
    emergencyCallLabel:"Oteli ara",
    diningSection:     "Yemek",
    breakfastLabel:    "Kahvaltı",
    lunchLabel:        "Öğle yemeği",
    dinnerLabel:       "Akşam yemeği",
    roomServiceLabel:  "Oda Servisi",
    menuTitle:         "Menü Öne Çıkanlar",
    nearbySection:     "Yakın Çevre",
    helpSection:       "Destek",
    supportTitle:      "Yardım & Şikayetler",
    supportDesc:       "Konsierjimiz her türlü istek, şikayet veya sorun için 7/24 hizmetinizdedir.",
    supportAction:     "Konsierj",
    placeTypeMarket:   "Süpermarket",
    placeTypePharmacy: "Eczane",
    placeTypeBazaar:   "Kapalıçarşı",
    placeTypeRestaurant:"Restoran",
    placeTypeOther:    "Yer",
  },
  ru: {
    selectLanguage:    "Выберите язык",
    continueToStay:    "Продолжить",
    greetingSubtitle:  "Добро пожаловать",
    essentialsSection: "Основное",
    wifiTitle:         "Wi-Fi",
    wifiNetwork:       "Сеть",
    wifiPassword:      "Пароль",
    emergencyTitle:    "Экстренная помощь",
    emergencyCallLabel:"Позвонить в отель",
    diningSection:     "Ресторан",
    breakfastLabel:    "Завтрак",
    lunchLabel:        "Обед",
    dinnerLabel:       "Ужин",
    roomServiceLabel:  "Обслуживание номеров",
    menuTitle:         "Меню",
    nearbySection:     "Рядом",
    helpSection:       "Поддержка",
    supportTitle:      "Помощь и жалобы",
    supportDesc:       "Наш консьерж доступен 24/7 по любым вопросам и жалобам.",
    supportAction:     "Консьерж",
    placeTypeMarket:   "Супермаркет",
    placeTypePharmacy: "Аптека",
    placeTypeBazaar:   "Гранд-базар",
    placeTypeRestaurant:"Ресторан",
    placeTypeOther:    "Место",
  },
  hi: {
    selectLanguage:    "अपनी भाषा चुनें",
    continueToStay:    "अपने प्रवास पर जाएं",
    greetingSubtitle:  "स्वागत है",
    essentialsSection: "आवश्यक",
    wifiTitle:         "वाई-फाई",
    wifiNetwork:       "नेटवर्क",
    wifiPassword:      "पासवर्ड",
    emergencyTitle:    "आपातकाल और सहायता",
    emergencyCallLabel:"होटल को कॉल करें",
    diningSection:     "भोजन",
    breakfastLabel:    "नाश्ता",
    lunchLabel:        "दोपहर का खाना",
    dinnerLabel:       "रात का खाना",
    roomServiceLabel:  "रूम सर्विस",
    menuTitle:         "मेनू",
    nearbySection:     "पास के स्थान",
    helpSection:       "सहायता",
    supportTitle:      "सहायता और शिकायत",
    supportDesc:       "हमारा कंसीयर्ज 24/7 किसी भी समस्या या शिकायत के लिए उपलब्ध है।",
    supportAction:     "कंसीयर्ज",
    placeTypeMarket:   "सुपरमार्केट",
    placeTypePharmacy: "फार्मेसी",
    placeTypeBazaar:   "ग्रैंड बाज़ार",
    placeTypeRestaurant:"रेस्तरां",
    placeTypeOther:    "स्थान",
  },
  ur: {
    selectLanguage:    "اپنی زبان منتخب کریں",
    continueToStay:    "اپنے قیام پر جاریں",
    greetingSubtitle:  "خوش آمدید",
    essentialsSection: "ضروری معلومات",
    wifiTitle:         "وائی فائی",
    wifiNetwork:       "نیٹ ورک",
    wifiPassword:      "پاس ورڈ",
    emergencyTitle:    "ہنگامی مدد",
    emergencyCallLabel:"ہوٹل کو کال کریں",
    diningSection:     "کھانا",
    breakfastLabel:    "ناشتہ",
    lunchLabel:        "دوپہر کا کھانا",
    dinnerLabel:       "رات کا کھانا",
    roomServiceLabel:  "روم سروس",
    menuTitle:         "مینو",
    nearbySection:     "قریبی مقامات",
    helpSection:       "مدد",
    supportTitle:      "مدد اور شکایات",
    supportDesc:       "ہمارا کنسیرج 24/7 کسی بھی مسئلے یا شکایت کے لیے دستیاب ہے۔",
    supportAction:     "کنسیرج",
    placeTypeMarket:   "سپر مارکیٹ",
    placeTypePharmacy: "فارمیسی",
    placeTypeBazaar:   "گرینڈ بازار",
    placeTypeRestaurant:"ریستوران",
    placeTypeOther:    "جگہ",
  },
  ja: {
    selectLanguage:    "言語を選択してください",
    continueToStay:    "ご滞在へ進む",
    greetingSubtitle:  "ようこそ",
    essentialsSection: "基本情報",
    wifiTitle:         "Wi-Fi",
    wifiNetwork:       "ネットワーク",
    wifiPassword:      "パスワード",
    emergencyTitle:    "緊急・サポート",
    emergencyCallLabel:"ホテルに電話",
    diningSection:     "お食事",
    breakfastLabel:    "朝食",
    lunchLabel:        "昼食",
    dinnerLabel:       "夕食",
    roomServiceLabel:  "ルームサービス",
    menuTitle:         "メニュー",
    nearbySection:     "近くの場所",
    helpSection:       "サポート",
    supportTitle:      "サポートとご意見",
    supportDesc:       "コンシェルジュは24時間365日、あらゆるご要望やご意見に対応いたします。",
    supportAction:     "コンシェルジュ",
    placeTypeMarket:   "スーパーマーケット",
    placeTypePharmacy: "薬局",
    placeTypeBazaar:   "グランドバザール",
    placeTypeRestaurant:"レストラン",
    placeTypeOther:    "場所",
  },
};

/** Get welcoming strings for a given locale, falling back to English. */
export function getWelcomingStrings(locale: string): WelcomingStrings {
  return WELCOMING_STRINGS[locale as WelcomingLocale] ?? WELCOMING_STRINGS.en;
}
