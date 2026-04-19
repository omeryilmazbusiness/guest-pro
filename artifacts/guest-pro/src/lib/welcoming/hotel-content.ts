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
      icon: "Coffee",
      items: [
        { name: "Turkish Breakfast Platter" },
        { name: "Eggs Benedict" },
        { name: "Fresh Fruit & Yogurt" },
        { name: "Smoked Salmon Bagel" },
      ],
    },
    {
      category: "Mains",
      icon: "UtensilsCrossed",
      items: [
        { name: "Grilled Lamb Kebab" },
        { name: "Pan-Seared Sea Bass" },
        { name: "Mushroom Risotto" },
        { name: "Caesar Salad" },
      ],
    },
    {
      category: "Desserts",
      icon: "IceCream2",
      items: [
        { name: "Baklava Selection" },
        { name: "Chocolate Fondant" },
        { name: "Seasonal Sorbet" },
      ],
    },
  ],
  nearbyPlaces: [
    {
      name: "Migros Supermarket",
      type: "market",
      distance: "180 m",
      description: "Full-service supermarket with fresh produce, bakery, and everyday essentials.",
      coords: { lat: 41.0135, lng: 28.9741 },
    },
    {
      name: "Eczane (Pharmacy)",
      type: "pharmacy",
      distance: "250 m",
      description: "24-hour pharmacy stocking international medicines, health items, and toiletries.",
      coords: { lat: 41.0107, lng: 28.9738 },
    },
    {
      name: "Grand Bazaar",
      type: "bazaar",
      distance: "800 m",
      description: "One of the world's oldest and largest covered markets — over 4,000 shops inside.",
      coords: { lat: 41.0106, lng: 28.9682 },
    },
    {
      name: "Restaurant Row",
      type: "restaurant",
      distance: "120 m",
      description: "A lively strip of Turkish and international restaurants with terrace seating.",
      coords: { lat: 41.0128, lng: 28.9774 },
    },
  ],
};

// ── Welcoming UI strings per locale ─────────────────────────────────────────

export interface WelcomingStrings {
  selectLanguage: string;
  continueToStay: string;
  accessYourStay: string;
  greetingSubtitle: string;
  essentialsSection: string;
  wifiTitle: string;
  wifiNetwork: string;
  wifiPassword: string;
  emergencyTitle: string;
  emergencyCallLabel: string;
  /** "Call for help" button that fires the public welcome-support alert */
  callForSupport: string;
  callForSupportSending: string;
  callForSupportSent: string;
  callForSupportFailed: string;
  diningSection: string;
  breakfastLabel: string;
  lunchLabel: string;
  dinnerLabel: string;
  roomServiceLabel: string;
  menuTitle: string;
  nearbySection: string;
  /** "Open in Google Maps" — shown inside the nearby-place modal */
  nearbyOpenInMaps: string;
  /** "Get QR for phone" */
  nearbyGetQr: string;
  /** Modal title */
  nearbyModalTitle: string;
  /** QR code scan note */
  nearbyQrScanNote: string;
  helpSection: string;
  supportTitle: string;
  supportDesc: string;
  supportAction: string;
  supportLoginNote: string;
  placeTypeMarket: string;
  placeTypePharmacy: string;
  placeTypeBazaar: string;
  placeTypeRestaurant: string;
  placeTypeOther: string;
}

export const WELCOMING_STRINGS: Record<WelcomingLocale, WelcomingStrings> = {
  en: {
    selectLanguage:       "Select your language",
    continueToStay:       "Explore hotel info",
    accessYourStay:       "Login to access your stay",
    greetingSubtitle:     "Welcome",
    essentialsSection:    "Essentials",
    wifiTitle:            "Wi-Fi",
    wifiNetwork:          "Network",
    wifiPassword:         "Password",
    emergencyTitle:       "Emergency & Help",
    emergencyCallLabel:   "Call hotel",
    callForSupport:       "Call for help",
    callForSupportSending:"Calling...",
    callForSupportSent:   "Reception notified",
    callForSupportFailed: "Failed — please call directly",
    diningSection:        "Dining",
    breakfastLabel:       "Breakfast",
    lunchLabel:           "Lunch",
    dinnerLabel:          "Dinner",
    roomServiceLabel:     "Room Service",
    menuTitle:            "Menu Highlights",
    nearbySection:        "Nearby",
    nearbyOpenInMaps:     "Open in Google Maps",
    nearbyGetQr:          "QR for phone",
    nearbyModalTitle:     "Getting There",
    nearbyQrScanNote:     "Scan to navigate on your phone",
    helpSection:          "Support",
    supportTitle:         "Help & Complaints",
    supportDesc:          "Our concierge is available 24/7 for any issue, complaint, or request.",
    supportAction:        "Open Concierge",
    supportLoginNote:     "Login to chat with our concierge",
    placeTypeMarket:      "Supermarket",
    placeTypePharmacy:    "Pharmacy",
    placeTypeBazaar:      "Grand Bazaar",
    placeTypeRestaurant:  "Restaurant",
    placeTypeOther:       "Place",
  },
  tr: {
    selectLanguage:       "Dilinizi seçin",
    continueToStay:       "Otel bilgilerini görüntüle",
    accessYourStay:       "Girişe devam et",
    greetingSubtitle:     "Hoş geldiniz",
    essentialsSection:    "Temel Bilgiler",
    wifiTitle:            "Wi-Fi",
    wifiNetwork:          "Ağ Adı",
    wifiPassword:         "Şifre",
    emergencyTitle:       "Acil & Yardım",
    emergencyCallLabel:   "Oteli ara",
    callForSupport:       "Destek çağır",
    callForSupportSending:"İletiliyor...",
    callForSupportSent:   "Resepsiyon bildirildi",
    callForSupportFailed: "Gönderilemedi — lütfen arayın",
    diningSection:        "Yemek",
    breakfastLabel:       "Kahvaltı",
    lunchLabel:           "Öğle yemeği",
    dinnerLabel:          "Akşam yemeği",
    roomServiceLabel:     "Oda Servisi",
    menuTitle:            "Menü Öne Çıkanlar",
    nearbySection:        "Yakın Çevre",
    nearbyOpenInMaps:     "Google Maps'te aç",
    nearbyGetQr:          "Telefon için QR",
    nearbyModalTitle:     "Nasıl Gidilir",
    nearbyQrScanNote:     "Telefonunuzda navigasyon için tarayın",
    helpSection:          "Destek",
    supportTitle:         "Yardım & Şikayetler",
    supportDesc:          "Konsierjimiz her türlü istek, şikayet veya sorun için 7/24 hizmetinizdedir.",
    supportAction:        "Konsierj",
    supportLoginNote:     "Konsierjle görüşmek için giriş yapın",
    placeTypeMarket:      "Süpermarket",
    placeTypePharmacy:    "Eczane",
    placeTypeBazaar:      "Kapalıçarşı",
    placeTypeRestaurant:  "Restoran",
    placeTypeOther:       "Yer",
  },
  ru: {
    selectLanguage:       "Выберите язык",
    continueToStay:       "Информация об отеле",
    accessYourStay:       "Войти в личный кабинет",
    greetingSubtitle:     "Добро пожаловать",
    essentialsSection:    "Основное",
    wifiTitle:            "Wi-Fi",
    wifiNetwork:          "Сеть",
    wifiPassword:         "Пароль",
    emergencyTitle:       "Экстренная помощь",
    emergencyCallLabel:   "Позвонить в отель",
    callForSupport:       "Вызвать помощь",
    callForSupportSending:"Отправка...",
    callForSupportSent:   "Ресепшн уведомлён",
    callForSupportFailed: "Ошибка — позвоните напрямую",
    diningSection:        "Ресторан",
    breakfastLabel:       "Завтрак",
    lunchLabel:           "Обед",
    dinnerLabel:          "Ужин",
    roomServiceLabel:     "Обслуживание номеров",
    menuTitle:            "Меню",
    nearbySection:        "Рядом",
    nearbyOpenInMaps:     "Открыть в Google Maps",
    nearbyGetQr:          "QR для телефона",
    nearbyModalTitle:     "Как добраться",
    nearbyQrScanNote:     "Сканируйте для навигации на телефоне",
    helpSection:          "Поддержка",
    supportTitle:         "Помощь и жалобы",
    supportDesc:          "Наш консьерж доступен 24/7 по любым вопросам и жалобам.",
    supportAction:        "Консьерж",
    supportLoginNote:     "Войдите для чата с консьержем",
    placeTypeMarket:      "Супермаркет",
    placeTypePharmacy:    "Аптека",
    placeTypeBazaar:      "Гранд-базар",
    placeTypeRestaurant:  "Ресторан",
    placeTypeOther:       "Место",
  },
  hi: {
    selectLanguage:       "अपनी भाषा चुनें",
    continueToStay:       "होटल की जानकारी देखें",
    accessYourStay:       "अपने प्रवास में प्रवेश करें",
    greetingSubtitle:     "स्वागत है",
    essentialsSection:    "आवश्यक",
    wifiTitle:            "वाई-फाई",
    wifiNetwork:          "नेटवर्क",
    wifiPassword:         "पासवर्ड",
    emergencyTitle:       "आपातकाल और सहायता",
    emergencyCallLabel:   "होटल को कॉल करें",
    callForSupport:       "सहायता बुलाएं",
    callForSupportSending:"भेजा जा रहा है...",
    callForSupportSent:   "रिसेप्शन को सूचित किया",
    callForSupportFailed: "विफल — कृपया सीधे कॉल करें",
    diningSection:        "भोजन",
    breakfastLabel:       "नाश्ता",
    lunchLabel:           "दोपहर का खाना",
    dinnerLabel:          "रात का खाना",
    roomServiceLabel:     "रूम सर्विस",
    menuTitle:            "मेनू",
    nearbySection:        "पास के स्थान",
    nearbyOpenInMaps:     "Google Maps में खोलें",
    nearbyGetQr:          "फोन के लिए QR",
    nearbyModalTitle:     "कैसे पहुंचें",
    nearbyQrScanNote:     "फोन पर नेविगेशन के लिए स्कैन करें",
    helpSection:          "सहायता",
    supportTitle:         "सहायता और शिकायत",
    supportDesc:          "हमारा कंसीयर्ज 24/7 किसी भी समस्या या शिकायत के लिए उपलब्ध है।",
    supportAction:        "कंसीयर्ज",
    supportLoginNote:     "कंसीयर्ज से चैट के लिए लॉगिन करें",
    placeTypeMarket:      "सुपरमार्केट",
    placeTypePharmacy:    "फार्मेसी",
    placeTypeBazaar:      "ग्रैंड बाज़ार",
    placeTypeRestaurant:  "रेस्तरां",
    placeTypeOther:       "स्थान",
  },
  ur: {
    selectLanguage:       "اپنی زبان منتخب کریں",
    continueToStay:       "ہوٹل کی معلومات دیکھیں",
    accessYourStay:       "اپنے قیام میں داخل ہوں",
    greetingSubtitle:     "خوش آمدید",
    essentialsSection:    "ضروری معلومات",
    wifiTitle:            "وائی فائی",
    wifiNetwork:          "نیٹ ورک",
    wifiPassword:         "پاس ورڈ",
    emergencyTitle:       "ہنگامی مدد",
    emergencyCallLabel:   "ہوٹل کو کال کریں",
    callForSupport:       "مدد طلب کریں",
    callForSupportSending:"بھیجا جا رہا ہے...",
    callForSupportSent:   "ریسپشن کو اطلاع دی گئی",
    callForSupportFailed: "ناکام — براہ کرم براہ راست کال کریں",
    diningSection:        "کھانا",
    breakfastLabel:       "ناشتہ",
    lunchLabel:           "دوپہر کا کھانا",
    dinnerLabel:          "رات کا کھانا",
    roomServiceLabel:     "روم سروس",
    menuTitle:            "مینو",
    nearbySection:        "قریبی مقامات",
    nearbyOpenInMaps:     "Google Maps میں کھولیں",
    nearbyGetQr:          "فون کے لیے QR",
    nearbyModalTitle:     "کیسے پہنچیں",
    nearbyQrScanNote:     "فون پر نیویگیشن کے لیے اسکین کریں",
    helpSection:          "مدد",
    supportTitle:         "مدد اور شکایات",
    supportDesc:          "ہمارا کنسیرج 24/7 کسی بھی مسئلے یا شکایت کے لیے دستیاب ہے۔",
    supportAction:        "کنسیرج",
    supportLoginNote:     "کنسیرج سے چیٹ کے لیے لاگ ان کریں",
    placeTypeMarket:      "سپر مارکیٹ",
    placeTypePharmacy:    "فارمیسی",
    placeTypeBazaar:      "گرینڈ بازار",
    placeTypeRestaurant:  "ریستوران",
    placeTypeOther:       "جگہ",
  },
  ja: {
    selectLanguage:       "言語を選択してください",
    continueToStay:       "ホテル情報を見る",
    accessYourStay:       "ご滞在へログイン",
    greetingSubtitle:     "ようこそ",
    essentialsSection:    "基本情報",
    wifiTitle:            "Wi-Fi",
    wifiNetwork:          "ネットワーク",
    wifiPassword:         "パスワード",
    emergencyTitle:       "緊急・サポート",
    emergencyCallLabel:   "ホテルに電話",
    callForSupport:       "サポートを呼ぶ",
    callForSupportSending:"送信中...",
    callForSupportSent:   "フロントに通知しました",
    callForSupportFailed: "失敗 — 直接お電話ください",
    diningSection:        "お食事",
    breakfastLabel:       "朝食",
    lunchLabel:           "昼食",
    dinnerLabel:          "夕食",
    roomServiceLabel:     "ルームサービス",
    menuTitle:            "メニュー",
    nearbySection:        "近くの場所",
    nearbyOpenInMaps:     "Google マップで開く",
    nearbyGetQr:          "スマホ用QR",
    nearbyModalTitle:     "行き方",
    nearbyQrScanNote:     "スマートフォンでスキャンしてナビを開く",
    helpSection:          "サポート",
    supportTitle:         "サポートとご意見",
    supportDesc:          "コンシェルジュは24時間365日、あらゆるご要望やご意見に対応いたします。",
    supportAction:        "コンシェルジュ",
    supportLoginNote:     "コンシェルジュはログイン後にご利用いただけます",
    placeTypeMarket:      "スーパーマーケット",
    placeTypePharmacy:    "薬局",
    placeTypeBazaar:      "グランドバザール",
    placeTypeRestaurant:  "レストラン",
    placeTypeOther:       "場所",
  },
};

/** Get welcoming strings for a given locale, falling back to English. */
export function getWelcomingStrings(locale: string): WelcomingStrings {
  return WELCOMING_STRINGS[locale as WelcomingLocale] ?? WELCOMING_STRINGS.en;
}
