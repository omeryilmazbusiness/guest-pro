/**
 * Guest-facing i18n translation dictionaries.
 *
 * Only guest UI strings live here. Manager screens stay in English.
 * Supported locales with full translations: en, tr, ar, ru, de, fr, es.
 * All other locales gracefully fall back to English.
 *
 * Usage:
 *   const { t } = useLocale();
 *   <p>{t.voiceTitle}</p>
 *   <p>{t.welcome.replace("{name}", user.firstName)}</p>
 */

export interface GuestTranslations {
  // ── Global ─────────────────────────────────────────────────────────────
  cancel: string;
  logout: string;
  logoutSuccess: string;
  room: string;
  guest: string;

  // ── Home ────────────────────────────────────────────────────────────────
  welcome: string; // contains {name}
  voiceLabel: string;
  voiceTitle: string;
  voiceSubtitle: string;
  listeningState: string;
  voiceHint: string;
  goToVoiceChat: string;

  askSomethingLabel: string;
  askSomethingTitle: string;
  askSomethingSubtitle: string;

  staySection: string;
  stayActive: string;
  chatLink: string;

  quickActionsSection: string;
  touchToAsk: string;

  infoSection: string;
  receptionTitle: string;
  receptionDesc: string;
  roomServiceTitle: string;
  roomServiceDesc: string;
  checkoutTitle: string;
  checkoutDesc: string;

  footerText: string;

  // ── Chat ────────────────────────────────────────────────────────────────
  backLabel: string;
  clearChatLabel: string;
  headerRoom: string; // contains {name} and {room}
  emptyTitle: string;
  emptySubtitle: string;
  inputPlaceholder: string;
  listeningPlaceholder: string;
  quotaPlaceholder: string;
  quotaMessage: string;

  clearTitle: string;
  clearMessage: string;
  clearConfirm: string;
  sendFailed: string;
  clearedMessage: string;

  // ── Voice errors ────────────────────────────────────────────────────────
  voiceNotSupported: string;
  micDenied: string;
  noSpeech: string;
  voiceErrorGeneric: string; // contains {code}

  // ── Install sheet ───────────────────────────────────────────────────────
  installTitle: string;
  installSubtitle: string;
  installNow: string;
  installLater: string;
  installDontShow: string;

  iosStep1Title: string;
  iosStep1Hint: string;
  iosPadStep2Title: string;
  iosPadStep2Hint: string;
  iosStep3Title: string;
  iosStep3Hint: string;
  iosStep4Title: string;

  // ── Guided Flow — navigation buttons ────────────────────────────────────
  flowConfirm: string;
  flowEditContinue: string;
  flowSkip: string;
  flowNext: string;
  flowBack: string;
  flowCustomPlaceholder: string;
  flowSuccessReturn: string;
  flowRequestReceived: string;

  // ── Flow — UI chrome ────────────────────────────────────────────────────
  flowOrType: string;   // divider between option buttons and custom textarea
  flowTypeHere: string; // textarea placeholder for plain text steps

  // ── Flow — mode labels & success messages ────────────────────────────────
  flowFoodLabel: string;
  flowSupportLabel: string;
  flowCareLabel: string;
  flowFoodSuccess: string;
  flowSupportSuccess: string;
  flowCareSuccess: string;

  // ── Flow — Food step questions / subtitles ───────────────────────────────
  flowFoodCategoryQ: string;
  flowFoodCategoryHint: string;
  flowFoodItemQ: string;
  flowFoodItemHint: string;
  flowFoodQuantityQ: string;
  flowFoodNoteQ: string;
  flowFoodNoteHint: string;
  flowFoodConfirmQ: string;

  // ── Flow — Food categories ───────────────────────────────────────────────
  flowCatBreakfast: string;
  flowCatBreakfastHint: string;
  flowCatLight: string;
  flowCatLightHint: string;
  flowCatMain: string;
  flowCatMainHint: string;
  flowCatDrinks: string;
  flowCatDrinksHint: string;

  // ── Flow — Quantity ──────────────────────────────────────────────────────
  flowQty1: string;
  flowQty2: string;
  flowQty3: string;

  // ── Flow — Support step questions / subtitles ────────────────────────────
  flowSupportIssueQ: string;
  flowSupportIssueHint: string;
  flowSupportUrgencyQ: string;
  flowSupportNoteQ: string;
  flowSupportNoteHint: string;
  flowSupportConfirmQ: string;

  // ── Flow — Support issue options ─────────────────────────────────────────
  flowIssueMinibark: string;
  flowIssueMinibarHint: string;
  flowIssuePillow: string;
  flowIssuePillowHint: string;
  flowIssueCleaning: string;
  flowIssueCleaningHint: string;
  flowIssueRoomIssue: string;
  flowIssueRoomIssueHint: string;
  flowIssueTechIssue: string;
  flowIssueTechIssueHint: string;
  flowIssueNoise: string;
  flowIssueNoiseHint: string;
  flowIssueExtra: string;
  flowIssueExtraHint: string;
  flowIssueOther: string;
  flowIssueOtherHint: string;

  // ── Flow — Urgency options ───────────────────────────────────────────────
  flowUrgUrgent: string;
  flowUrgUrgentHint: string;
  flowUrgNormal: string;
  flowUrgNormalHint: string;

  // ── Flow — Care step questions / subtitles ───────────────────────────────
  flowCareIntroQ: string;
  flowCareIntroHint: string;
  flowCareIntroPH: string;
  flowCareNextHint: string;
  flowCareSleepQ: string;
  flowCareDietQ: string;
  flowCareComfortQ: string;
  flowCareServiceQ: string;
  flowCareConfirmQ: string;

  // ── Flow — Care sleep options ─────────────────────────────────────────────
  flowSleepEarly: string;
  flowSleepEarlyHint: string;
  flowSleepNormal: string;
  flowSleepNormalHint: string;
  flowSleepLate: string;
  flowSleepLateHint: string;

  // ── Flow — Care diet options ──────────────────────────────────────────────
  flowDietNormal: string;
  flowDietNormalHint: string;
  flowDietVeg: string;
  flowDietVegHint: string;
  flowDietVegan: string;
  flowDietVeganHint: string;
  flowDietGluten: string;
  flowDietGlutenHint: string;
  flowDietHalal: string;
  flowDietHalalHint: string;

  // ── Flow — Care comfort options ───────────────────────────────────────────
  flowComfortStd: string;
  flowComfortStdHint: string;
  flowComfortPillow: string;
  flowComfortPillowHint: string;
  flowComfortBlanket: string;
  flowComfortBlanketHint: string;
  flowComfortCool: string;
  flowComfortCoolHint: string;
  flowComfortWarm: string;
  flowComfortWarmHint: string;

  // ── Flow — Care service options ───────────────────────────────────────────
  flowServiceFull: string;
  flowServiceFullHint: string;
  flowServiceMin: string;
  flowServiceMinHint: string;

  // ── Flow — Confirm card summary labels ────────────────────────────────────
  flowSumFood: string;
  flowSumPortions: string;
  flowSumKitchenNote: string;
  flowSumTopic: string;
  flowSumPriority: string;
  flowSumDetail: string;
  flowSumNote: string;
  flowSumSleep: string;
  flowSumDiet: string;
  flowSumComfort: string;
  flowSumService: string;

  // ── Quick Actions ─────────────────────────────────────────────────────────
  quickActionFoodTitle: string;
  quickActionFoodSubtitle: string;
  quickActionSupportTitle: string;
  quickActionSupportSubtitle: string;
  quickActionCareTitle: string;
  quickActionCareSubtitle: string;

  // ── My Requests ───────────────────────────────────────────────────────────
  myRequestsTitle: string;
  myRequestsSubtitle: string;
  myRequestsEmpty: string;
  reqStatusOpen: string;
  reqStatusInProgress: string;
  reqStatusResolved: string;
}

type SupportedLocale = "en" | "tr" | "ar" | "ru" | "de" | "fr" | "es";

const translations: Record<SupportedLocale, GuestTranslations> = {
  // ── English ──────────────────────────────────────────────────────────────
  en: {
    cancel: "Cancel",
    logout: "Log out",
    logoutSuccess: "Safe travels!",
    room: "Room",
    guest: "Guest",

    welcome: "Welcome, {name}",
    voiceLabel: "Ask by Voice",
    voiceTitle: "Talk to Me",
    voiceSubtitle: "Your concierge is listening. Speak in any language.",
    listeningState: "Listening…",
    voiceHint: "Tap the microphone and start speaking",
    goToVoiceChat: "Switch to voice chat",

    askSomethingLabel: "Ask by Text",
    askSomethingTitle: "Ask Something",
    askSomethingSubtitle: "Anything about your stay",

    staySection: "Your Stay",
    stayActive: "Stay active",
    chatLink: "Chat",

    quickActionsSection: "Quick Actions",
    touchToAsk: "Touch to ask →",

    infoSection: "At Your Service",
    receptionTitle: "24/7 Reception",
    receptionDesc: "Our team is always ready for any request.",
    roomServiceTitle: "Room Service",
    roomServiceDesc: "Request housekeeping or in-room service via Concierge.",
    checkoutTitle: "Check-out",
    checkoutDesc: "Standard check-out time is 12:00.",

    footerText: "AI powered concierge",

    backLabel: "Go to home",
    clearChatLabel: "Clear conversation",
    headerRoom: "{name} · Room {room}",
    emptyTitle: "How can I help you?",
    emptySubtitle: "You can ask anything about your stay, the hotel, or the city.",
    inputPlaceholder: "Ask something…",
    listeningPlaceholder: "Listening…",
    quotaPlaceholder: "Daily limit reached. See you tomorrow.",
    quotaMessage: "Your daily message limit has been reached. Please try again tomorrow.",

    clearTitle: "Delete conversation?",
    clearMessage: "All messages will be permanently deleted. This cannot be undone.",
    clearConfirm: "Delete All",
    sendFailed: "Failed to send. Please try again.",
    clearedMessage: "Conversation cleared.",

    voiceNotSupported: "Speech recognition is not supported in this browser. Please type your message.",
    micDenied: "Microphone access denied. Please allow access in your browser settings.",
    noSpeech: "No speech detected. Please try again.",
    voiceErrorGeneric: "Voice error: {code}",

    installTitle: "Install Guest Pro",
    installSubtitle: "Add to your home screen for the best experience.",
    installNow: "Add to Home Screen",
    installLater: "Later",
    installDontShow: "Don't show again",
    iosStep1Title: "Tap the Share icon",
    iosStep1Hint: "At the bottom of Safari",
    iosPadStep2Title: "Tap \"View More\"",
    iosPadStep2Hint: "Scroll down in the share menu",
    iosStep3Title: "Add to Home Screen",
    iosStep3Hint: "Tap \"Add to Home Screen\"",
    iosStep4Title: "Tap Add",

    flowConfirm: "Confirm",
    flowEditContinue: "Continue editing",
    flowSkip: "Skip",
    flowNext: "Next",
    flowBack: "Back",
    flowCustomPlaceholder: "Or describe your own need…",
    flowSuccessReturn: "Return to Home",
    flowRequestReceived: "Request Received",

    flowOrType: "or describe your own",
    flowTypeHere: "Type here…",

    flowFoodLabel: "Room Service",
    flowSupportLabel: "Support Request",
    flowCareLabel: "Care About Me",
    flowFoodSuccess: "Your order has been sent to the kitchen. It will be ready shortly.",
    flowSupportSuccess: "Your request has been forwarded to staff. We'll attend to it soon.",
    flowCareSuccess: "Your preferences have been saved. We'll personalize your stay.",

    flowFoodCategoryQ: "What are you craving?",
    flowFoodCategoryHint: "Select a category",
    flowFoodItemQ: "Which dish would you like?",
    flowFoodItemHint: "Select an item",
    flowFoodQuantityQ: "How many servings?",
    flowFoodNoteQ: "Any note for the kitchen?",
    flowFoodNoteHint: "Optional — allergies, special requests…",
    flowFoodConfirmQ: "Confirm your order",

    flowCatBreakfast: "Breakfast",
    flowCatBreakfastHint: "Spreads, omelettes, toast",
    flowCatLight: "Light Meals",
    flowCatLightHint: "Sandwiches, soup, salads",
    flowCatMain: "Main Dishes",
    flowCatMainHint: "Chicken, fish, pasta",
    flowCatDrinks: "Beverages",
    flowCatDrinksHint: "Tea, coffee, juice",

    flowQty1: "1 serving",
    flowQty2: "2 servings",
    flowQty3: "3 servings",

    flowSupportIssueQ: "How can we help you?",
    flowSupportIssueHint: "Select a topic",
    flowSupportUrgencyQ: "How urgent is this?",
    flowSupportNoteQ: "Anything else to add?",
    flowSupportNoteHint: "Optional — details or special info",
    flowSupportConfirmQ: "Confirm your support request",

    flowIssueMinibark: "Minibar Restock",
    flowIssueMinibarHint: "Refresh drinks & snacks",
    flowIssuePillow: "Extra Pillow",
    flowIssuePillowHint: "Bring an additional pillow",
    flowIssueCleaning: "Room Cleaning",
    flowIssueCleaningHint: "Please clean my room",
    flowIssueRoomIssue: "Room Issue",
    flowIssueRoomIssueHint: "A/C, heating, door, etc.",
    flowIssueTechIssue: "Technical Problem",
    flowIssueTechIssueHint: "TV, Wi-Fi, electricity",
    flowIssueNoise: "Noise Complaint",
    flowIssueNoiseHint: "Neighboring room, hallway",
    flowIssueExtra: "Extra Supplies",
    flowIssueExtraHint: "Towels, toiletries, etc.",
    flowIssueOther: "Other",
    flowIssueOtherHint: "Something else",

    flowUrgUrgent: "Urgent",
    flowUrgUrgentHint: "Needs immediate attention",
    flowUrgNormal: "Normal",
    flowUrgNormalHint: "When convenient",

    flowCareIntroQ: "Share Your Preferences",
    flowCareIntroHint: "Let us personalize your stay",
    flowCareIntroPH: "Tell us what matters to you during your stay… (allergies, special preferences, personal notes)",
    flowCareNextHint: "In the next steps, you can quickly select your preferences.",
    flowCareSleepQ: "What is your sleep schedule?",
    flowCareDietQ: "What is your diet preference?",
    flowCareComfortQ: "What is your comfort preference?",
    flowCareServiceQ: "What is your service style?",
    flowCareConfirmQ: "Confirm your preferences",

    flowSleepEarly: "Early to bed",
    flowSleepEarlyHint: "Before 22:00",
    flowSleepNormal: "Normal",
    flowSleepNormalHint: "Between 23:00 – 01:00",
    flowSleepLate: "Late to bed",
    flowSleepLateHint: "After 01:00",

    flowDietNormal: "Normal",
    flowDietNormalHint: "Everything",
    flowDietVeg: "Vegetarian",
    flowDietVegHint: "No meat",
    flowDietVegan: "Vegan",
    flowDietVeganHint: "No animal products",
    flowDietGluten: "Gluten-free",
    flowDietGlutenHint: "No gluten",
    flowDietHalal: "Halal",
    flowDietHalalHint: "Halal food",

    flowComfortStd: "Standard",
    flowComfortStdHint: "Normal comfort settings",
    flowComfortPillow: "Extra Pillow",
    flowComfortPillowHint: "Additional pillow",
    flowComfortBlanket: "Extra Blanket",
    flowComfortBlanketHint: "Additional blanket",
    flowComfortCool: "Cool Room",
    flowComfortCoolHint: "Keep the A/C cool",
    flowComfortWarm: "Warm Room",
    flowComfortWarmHint: "Keep the heating high",

    flowServiceFull: "Full Service",
    flowServiceFullHint: "Frequent check-ins, help always ready",
    flowServiceMin: "Minimal Disturbance",
    flowServiceMinHint: "I prefer privacy",

    flowSumFood: "Food",
    flowSumPortions: "Portions",
    flowSumKitchenNote: "Kitchen note",
    flowSumTopic: "Topic",
    flowSumPriority: "Priority",
    flowSumDetail: "Detail",
    flowSumNote: "Your note",
    flowSumSleep: "Sleep",
    flowSumDiet: "Diet",
    flowSumComfort: "Comfort",
    flowSumService: "Service",

    quickActionFoodTitle: "I'm Hungry",
    quickActionFoodSubtitle: "Room service",
    quickActionSupportTitle: "Support Request",
    quickActionSupportSubtitle: "Something wrong?",
    quickActionCareTitle: "Care About Me",
    quickActionCareSubtitle: "Your preferences",

    myRequestsTitle: "My Requests",
    myRequestsSubtitle: "Track your service requests",
    myRequestsEmpty: "No requests yet",
    reqStatusOpen: "Open",
    reqStatusInProgress: "In Progress",
    reqStatusResolved: "Completed",
  },

  // ── Turkish ───────────────────────────────────────────────────────────────
  tr: {
    cancel: "İptal",
    logout: "Çıkış yap",
    logoutSuccess: "Güvenli yolculuklar!",
    room: "Oda",
    guest: "Misafir",

    welcome: "Hoş geldiniz, {name}",
    voiceLabel: "Sesle Sor",
    voiceTitle: "Konuş Benimle",
    voiceSubtitle: "Concierge'iniz dinliyor. İstediğiniz dilde konuşun.",
    listeningState: "Dinleniyor…",
    voiceHint: "Mikrofona dokunun ve konuşmaya başlayın",
    goToVoiceChat: "Sesli sohbete geç",

    askSomethingLabel: "Yazarak Sor",
    askSomethingTitle: "Bir Şey Sor",
    askSomethingSubtitle: "Konaklamanız hakkında her şey",

    staySection: "Konaklamanız",
    stayActive: "Konaklama aktif",
    chatLink: "Chat",

    quickActionsSection: "Hızlı İstekler",
    touchToAsk: "Sormak için dokun →",

    infoSection: "Hizmetinizde",
    receptionTitle: "7/24 Resepsiyon",
    receptionDesc: "Her isteğiniz için ekibimiz her zaman hazır.",
    roomServiceTitle: "Oda Servisi",
    roomServiceDesc: "Concierge'den oda temizliği veya servis talep edin.",
    checkoutTitle: "Check-out",
    checkoutDesc: "Standart çıkış saati 12:00'dir.",

    footerText: "AI destekli concierge",

    backLabel: "Ana sayfaya dön",
    clearChatLabel: "Konuşmayı temizle",
    headerRoom: "{name} · Oda {room}",
    emptyTitle: "Nasıl yardımcı olabilirim?",
    emptySubtitle: "Konaklamanız, otel veya şehir hakkında her şeyi sorabilirsiniz.",
    inputPlaceholder: "Bir şey sorun…",
    listeningPlaceholder: "Dinleniyor…",
    quotaPlaceholder: "Günlük limit doldu. Yarın görüşürüz.",
    quotaMessage: "Bugünkü mesaj limitiniz doldu. Lütfen yarın tekrar deneyin.",

    clearTitle: "Konuşmayı sil?",
    clearMessage: "Tüm mesajlar kalıcı olarak silinecek. Bu işlem geri alınamaz.",
    clearConfirm: "Tümünü Sil",
    sendFailed: "Gönderilemedi. Lütfen tekrar deneyin.",
    clearedMessage: "Konuşma silindi.",

    voiceNotSupported: "Ses tanıma bu tarayıcıda desteklenmiyor. Lütfen mesajınızı yazın.",
    micDenied: "Mikrofon erişimi reddedildi. Tarayıcı ayarlarından izin verin.",
    noSpeech: "Ses algılanamadı. Lütfen tekrar deneyin.",
    voiceErrorGeneric: "Ses hatası: {code}",

    installTitle: "Guest Pro'yu Yükle",
    installSubtitle: "En iyi deneyim için ana ekranınıza ekleyin.",
    installNow: "Ana Ekrana Ekle",
    installLater: "Sonra",
    installDontShow: "Bir daha gösterme",
    iosStep1Title: "Share ikonuna dokunun",
    iosStep1Hint: "Safari'nin alt kısmında",
    iosPadStep2Title: "\"View More\" seçeneğine dokunun",
    iosPadStep2Hint: "Paylaşım menüsünde aşağı kaydırın",
    iosStep3Title: "Ana Ekrana Ekle",
    iosStep3Hint: "\"Ana Ekrana Ekle\" seçeneğine dokunun",
    iosStep4Title: "Ekle'ye dokunun",

    flowConfirm: "Onaylıyorum",
    flowEditContinue: "Düzenlemeye devam et",
    flowSkip: "Atla",
    flowNext: "İleri",
    flowBack: "Geri",
    flowCustomPlaceholder: "Ya da kendi isteğinizi yazın…",
    flowSuccessReturn: "Ana sayfaya dön",
    flowRequestReceived: "Talebiniz Alındı",

    flowOrType: "veya kendiniz yazın",
    flowTypeHere: "Buraya yazın…",

    flowFoodLabel: "Oda Servisi",
    flowSupportLabel: "Destek Talebi",
    flowCareLabel: "Care About Me",
    flowFoodSuccess: "Siparişiniz mutfağa iletildi. En kısa sürede hazırlanacak.",
    flowSupportSuccess: "Talebiniz personele iletildi. En kısa sürede ilgilenilecek.",
    flowCareSuccess: "Tercihleriniz kaydedildi. Konaklamanızı kişiselleştireceğiz.",

    flowFoodCategoryQ: "Ne canınız çekiyor?",
    flowFoodCategoryHint: "Bir kategori seçin",
    flowFoodItemQ: "Hangi yemeği istersiniz?",
    flowFoodItemHint: "Bir ürün seçin",
    flowFoodQuantityQ: "Kaç porsiyon?",
    flowFoodNoteQ: "Mutfağa notunuz var mı?",
    flowFoodNoteHint: "Opsiyonel — alerjiler, özel istek…",
    flowFoodConfirmQ: "Siparişinizi onaylayın",

    flowCatBreakfast: "Kahvaltı",
    flowCatBreakfastHint: "Serpme, omlet, tost",
    flowCatLight: "Hafif Yemekler",
    flowCatLightHint: "Sandviç, çorba, salata",
    flowCatMain: "Ana Yemekler",
    flowCatMainHint: "Tavuk, balık, makarna",
    flowCatDrinks: "İçecekler",
    flowCatDrinksHint: "Çay, kahve, meyve suyu",

    flowQty1: "1 porsiyon",
    flowQty2: "2 porsiyon",
    flowQty3: "3 porsiyon",

    flowSupportIssueQ: "Nasıl yardımcı olalım?",
    flowSupportIssueHint: "Konuyu seçin",
    flowSupportUrgencyQ: "Bu ne kadar acil?",
    flowSupportNoteQ: "Eklemek istediğiniz bir şey var mı?",
    flowSupportNoteHint: "Opsiyonel — detay veya özel bilgi",
    flowSupportConfirmQ: "Destek talebini onaylayın",

    flowIssueMinibark: "Minibar Tazele",
    flowIssueMinibarHint: "İçecek ve atıştırmalık yenileme",
    flowIssuePillow: "Odaya Yastık",
    flowIssuePillowHint: "Ekstra yastık getirin",
    flowIssueCleaning: "Oda Temizliği",
    flowIssueCleaningHint: "Odam temizlensin",
    flowIssueRoomIssue: "Oda Sorunu",
    flowIssueRoomIssueHint: "Klima, ısıtma, kapı vb.",
    flowIssueTechIssue: "Teknik Sorun",
    flowIssueTechIssueHint: "TV, wi-fi, elektrik",
    flowIssueNoise: "Gürültü Şikayeti",
    flowIssueNoiseHint: "Komşu oda, koridor",
    flowIssueExtra: "Ekstra Malzeme",
    flowIssueExtraHint: "Havlu, sabun vb.",
    flowIssueOther: "Diğer",
    flowIssueOtherHint: "Başka bir konuda",

    flowUrgUrgent: "Acil",
    flowUrgUrgentHint: "Hemen ilgilenilmeli",
    flowUrgNormal: "Normal",
    flowUrgNormalHint: "Müsait olduğunuzda",

    flowCareIntroQ: "Tercihlerinizi Paylaşın",
    flowCareIntroHint: "Konaklamanızı sizin için kişiselleştirelim",
    flowCareIntroPH: "Dikkat etmemizi istediklerinizi buraya yazın… (alerjiler, özel tercihler, kişisel notlar)",
    flowCareNextHint: "Aşağıdaki adımlarda tercihlerinizi hızlıca seçebilirsiniz.",
    flowCareSleepQ: "Uyku düzeniniz nedir?",
    flowCareDietQ: "Beslenme tercihiniz?",
    flowCareComfortQ: "Konfor tercihiniz?",
    flowCareServiceQ: "Hizmet stiliniz nedir?",
    flowCareConfirmQ: "Tercihlerinizi onaylayın",

    flowSleepEarly: "Erken yatarım",
    flowSleepEarlyHint: "22:00'dan önce",
    flowSleepNormal: "Normal",
    flowSleepNormalHint: "23:00 – 01:00 arası",
    flowSleepLate: "Geç yatarım",
    flowSleepLateHint: "01:00'dan sonra",

    flowDietNormal: "Normal",
    flowDietNormalHint: "Her şey",
    flowDietVeg: "Vejeteryan",
    flowDietVegHint: "Et yok",
    flowDietVegan: "Vegan",
    flowDietVeganHint: "Hayvansal ürün yok",
    flowDietGluten: "Gluten-free",
    flowDietGlutenHint: "Gluten içermez",
    flowDietHalal: "Helal",
    flowDietHalalHint: "Helal gıda",

    flowComfortStd: "Standart",
    flowComfortStdHint: "Normal konfor ayarları",
    flowComfortPillow: "Fazla Yastık",
    flowComfortPillowHint: "Ekstra yastık",
    flowComfortBlanket: "Fazla Battaniye",
    flowComfortBlanketHint: "Ekstra battaniye",
    flowComfortCool: "Serin Oda",
    flowComfortCoolHint: "Klimayı serin tutun",
    flowComfortWarm: "Sıcak Oda",
    flowComfortWarmHint: "Isıtmayı yüksek tutun",

    flowServiceFull: "Tam Hizmet",
    flowServiceFullHint: "Sık kontrol, yardım hazır",
    flowServiceMin: "Minimal Rahatsızlık",
    flowServiceMinHint: "Yalnız kalmak tercihim",

    flowSumFood: "Yemek",
    flowSumPortions: "Porsiyon",
    flowSumKitchenNote: "Mutfak notu",
    flowSumTopic: "Konu",
    flowSumPriority: "Öncelik",
    flowSumDetail: "Detay",
    flowSumNote: "Notunuz",
    flowSumSleep: "Uyku",
    flowSumDiet: "Beslenme",
    flowSumComfort: "Konfor",
    flowSumService: "Hizmet",

    quickActionFoodTitle: "Acıktım",
    quickActionFoodSubtitle: "Odaya servis",
    quickActionSupportTitle: "Destek Talep",
    quickActionSupportSubtitle: "Bir sorun mu var?",
    quickActionCareTitle: "Care About Me",
    quickActionCareSubtitle: "Tercihleriniz",

    myRequestsTitle: "Taleplerim",
    myRequestsSubtitle: "Taleplerinizi takip edin",
    myRequestsEmpty: "Henüz talep yok",
    reqStatusOpen: "Açık",
    reqStatusInProgress: "İşlemde",
    reqStatusResolved: "Tamamlandı",
  },

  // ── Arabic ────────────────────────────────────────────────────────────────
  ar: {
    cancel: "إلغاء",
    logout: "تسجيل الخروج",
    logoutSuccess: "رحلة موفقة!",
    room: "غرفة",
    guest: "ضيف",

    welcome: "مرحباً، {name}",
    voiceLabel: "اسأل بصوتك",
    voiceTitle: "تحدث معي",
    voiceSubtitle: "كونسيرجك يستمع. تحدث بأي لغة.",
    listeningState: "جارٍ الاستماع…",
    voiceHint: "اضغط على الميكروفون وابدأ الحديث",
    goToVoiceChat: "الانتقال إلى المحادثة الصوتية",

    askSomethingLabel: "اسأل كتابةً",
    askSomethingTitle: "اسأل عن أي شيء",
    askSomethingSubtitle: "كل شيء عن إقامتك",

    staySection: "إقامتك",
    stayActive: "الإقامة نشطة",
    chatLink: "محادثة",

    quickActionsSection: "الإجراءات السريعة",
    touchToAsk: "اضغط للسؤال ←",

    infoSection: "في خدمتك",
    receptionTitle: "الاستقبال 24/7",
    receptionDesc: "فريقنا دائماً مستعد لأي طلب.",
    roomServiceTitle: "خدمة الغرف",
    roomServiceDesc: "اطلب التنظيف أو الخدمة عبر الكونسيرج.",
    checkoutTitle: "تسجيل المغادرة",
    checkoutDesc: "وقت المغادرة القياسي هو 12:00.",

    footerText: "كونسيرج مدعوم بالذكاء الاصطناعي",

    backLabel: "الرجوع للصفحة الرئيسية",
    clearChatLabel: "مسح المحادثة",
    headerRoom: "{name} · غرفة {room}",
    emptyTitle: "كيف يمكنني مساعدتك؟",
    emptySubtitle: "يمكنك السؤال عن إقامتك أو الفندق أو المدينة.",
    inputPlaceholder: "اسأل عن أي شيء…",
    listeningPlaceholder: "جارٍ الاستماع…",
    quotaPlaceholder: "تم الوصول إلى الحد اليومي. نراك غداً.",
    quotaMessage: "لقد وصلت إلى حد رسائلك اليومي. يرجى المحاولة مرة أخرى غداً.",

    clearTitle: "حذف المحادثة؟",
    clearMessage: "سيتم حذف جميع الرسائل بشكل دائم. لا يمكن التراجع عن هذا.",
    clearConfirm: "حذف الكل",
    sendFailed: "فشل الإرسال. يرجى المحاولة مرة أخرى.",
    clearedMessage: "تم مسح المحادثة.",

    voiceNotSupported: "التعرف على الصوت غير مدعوم في هذا المتصفح. يرجى كتابة رسالتك.",
    micDenied: "تم رفض الوصول إلى الميكروفون. يرجى السماح بالوصول في إعدادات متصفحك.",
    noSpeech: "لم يتم اكتشاف صوت. يرجى المحاولة مرة أخرى.",
    voiceErrorGeneric: "خطأ صوتي: {code}",

    installTitle: "تثبيت Guest Pro",
    installSubtitle: "أضفه إلى شاشتك الرئيسية للحصول على أفضل تجربة.",
    installNow: "إضافة إلى الشاشة الرئيسية",
    installLater: "لاحقاً",
    installDontShow: "لا تُظهر مرة أخرى",
    iosStep1Title: "اضغط على أيقونة المشاركة",
    iosStep1Hint: "في أسفل Safari",
    iosPadStep2Title: "اضغط \"عرض المزيد\"",
    iosPadStep2Hint: "مرر للأسفل في قائمة المشاركة",
    iosStep3Title: "إضافة إلى الشاشة الرئيسية",
    iosStep3Hint: "اضغط \"إضافة إلى الشاشة الرئيسية\"",
    iosStep4Title: "اضغط إضافة",

    flowConfirm: "تأكيد",
    flowEditContinue: "مواصلة التعديل",
    flowSkip: "تخطي",
    flowNext: "التالي",
    flowBack: "رجوع",
    flowCustomPlaceholder: "أو اكتب طلبك الخاص…",
    flowSuccessReturn: "العودة للرئيسية",
    flowRequestReceived: "تم استلام الطلب",

    flowOrType: "أو اكتب طلبك الخاص",
    flowTypeHere: "اكتب هنا…",

    flowFoodLabel: "خدمة الغرف",
    flowSupportLabel: "طلب دعم",
    flowCareLabel: "اعتنِ بي",
    flowFoodSuccess: "تم إرسال طلبك إلى المطبخ. سيكون جاهزاً قريباً.",
    flowSupportSuccess: "تم إرسال طلبك إلى الموظفين. سنتولى ذلك قريباً.",
    flowCareSuccess: "تم حفظ تفضيلاتك. سنجعل إقامتك مميزة.",

    flowFoodCategoryQ: "ماذا تشتهي؟",
    flowFoodCategoryHint: "اختر فئة",
    flowFoodItemQ: "أي طبق تريد؟",
    flowFoodItemHint: "اختر عنصراً",
    flowFoodQuantityQ: "كم حصة؟",
    flowFoodNoteQ: "هل لديك ملاحظة للمطبخ؟",
    flowFoodNoteHint: "اختياري — حساسيات، طلبات خاصة…",
    flowFoodConfirmQ: "تأكيد طلبك",

    flowCatBreakfast: "فطور",
    flowCatBreakfastHint: "مشكل، أومليت، توست",
    flowCatLight: "وجبات خفيفة",
    flowCatLightHint: "ساندويش، حساء، سلطة",
    flowCatMain: "الأطباق الرئيسية",
    flowCatMainHint: "دجاج، سمك، معكرونة",
    flowCatDrinks: "مشروبات",
    flowCatDrinksHint: "شاي، قهوة، عصير",

    flowQty1: "حصة واحدة",
    flowQty2: "حصتان",
    flowQty3: "3 حصص",

    flowSupportIssueQ: "كيف يمكننا مساعدتك؟",
    flowSupportIssueHint: "اختر موضوعاً",
    flowSupportUrgencyQ: "ما مدى إلحاحية هذا؟",
    flowSupportNoteQ: "هل تريد إضافة شيء آخر؟",
    flowSupportNoteHint: "اختياري — تفاصيل أو معلومات خاصة",
    flowSupportConfirmQ: "تأكيد طلب الدعم",

    flowIssueMinibark: "تجديد الميني بار",
    flowIssueMinibarHint: "تجديد المشروبات والوجبات",
    flowIssuePillow: "وسادة إضافية",
    flowIssuePillowHint: "إحضار وسادة إضافية",
    flowIssueCleaning: "تنظيف الغرفة",
    flowIssueCleaningHint: "الرجاء تنظيف غرفتي",
    flowIssueRoomIssue: "مشكلة في الغرفة",
    flowIssueRoomIssueHint: "تكييف، تدفئة، باب، إلخ.",
    flowIssueTechIssue: "مشكلة تقنية",
    flowIssueTechIssueHint: "تلفاز، واي فاي، كهرباء",
    flowIssueNoise: "شكوى ضوضاء",
    flowIssueNoiseHint: "غرفة مجاورة، ممر",
    flowIssueExtra: "مستلزمات إضافية",
    flowIssueExtraHint: "مناشف، أدوات نظافة، إلخ.",
    flowIssueOther: "أخرى",
    flowIssueOtherHint: "شيء آخر",

    flowUrgUrgent: "عاجل",
    flowUrgUrgentHint: "يحتاج اهتماماً فورياً",
    flowUrgNormal: "عادي",
    flowUrgNormalHint: "عند توفر الوقت",

    flowCareIntroQ: "شارك تفضيلاتك",
    flowCareIntroHint: "دعنا نخصص إقامتك",
    flowCareIntroPH: "أخبرنا بما يهمك خلال إقامتك… (حساسيات، تفضيلات خاصة، ملاحظات شخصية)",
    flowCareNextHint: "في الخطوات التالية، يمكنك اختيار تفضيلاتك بسرعة.",
    flowCareSleepQ: "ما جدولك للنوم؟",
    flowCareDietQ: "ما تفضيلاتك الغذائية؟",
    flowCareComfortQ: "ما تفضيلاتك للراحة؟",
    flowCareServiceQ: "ما أسلوب الخدمة المفضل لديك؟",
    flowCareConfirmQ: "تأكيد تفضيلاتك",

    flowSleepEarly: "نوم مبكر",
    flowSleepEarlyHint: "قبل 22:00",
    flowSleepNormal: "عادي",
    flowSleepNormalHint: "بين 23:00 – 01:00",
    flowSleepLate: "نوم متأخر",
    flowSleepLateHint: "بعد 01:00",

    flowDietNormal: "عادي",
    flowDietNormalHint: "كل شيء",
    flowDietVeg: "نباتي",
    flowDietVegHint: "بدون لحم",
    flowDietVegan: "نباتي صرف",
    flowDietVeganHint: "بدون منتجات حيوانية",
    flowDietGluten: "خالٍ من الجلوتين",
    flowDietGlutenHint: "لا جلوتين",
    flowDietHalal: "حلال",
    flowDietHalalHint: "طعام حلال",

    flowComfortStd: "معياري",
    flowComfortStdHint: "إعدادات راحة عادية",
    flowComfortPillow: "وسادة إضافية",
    flowComfortPillowHint: "وسادة إضافية",
    flowComfortBlanket: "بطانية إضافية",
    flowComfortBlanketHint: "بطانية إضافية",
    flowComfortCool: "غرفة باردة",
    flowComfortCoolHint: "ابقِ التكييف بارداً",
    flowComfortWarm: "غرفة دافئة",
    flowComfortWarmHint: "ابقِ التدفئة عالية",

    flowServiceFull: "خدمة كاملة",
    flowServiceFullHint: "تفقد متكرر، المساعدة دائماً متاحة",
    flowServiceMin: "إزعاج بسيط",
    flowServiceMinHint: "أفضل الخصوصية",

    flowSumFood: "الطعام",
    flowSumPortions: "الحصص",
    flowSumKitchenNote: "ملاحظة المطبخ",
    flowSumTopic: "الموضوع",
    flowSumPriority: "الأولوية",
    flowSumDetail: "التفاصيل",
    flowSumNote: "ملاحظتك",
    flowSumSleep: "النوم",
    flowSumDiet: "النظام الغذائي",
    flowSumComfort: "الراحة",
    flowSumService: "الخدمة",

    quickActionFoodTitle: "أنا جائع",
    quickActionFoodSubtitle: "خدمة الغرف",
    quickActionSupportTitle: "طلب دعم",
    quickActionSupportSubtitle: "هل هناك مشكلة؟",
    quickActionCareTitle: "اعتنِ بي",
    quickActionCareSubtitle: "تفضيلاتك",

    myRequestsTitle: "طلباتي",
    myRequestsSubtitle: "تتبع طلبات الخدمة",
    myRequestsEmpty: "لا توجد طلبات بعد",
    reqStatusOpen: "مفتوح",
    reqStatusInProgress: "قيد التنفيذ",
    reqStatusResolved: "مكتمل",
  },

  // ── Russian ───────────────────────────────────────────────────────────────
  ru: {
    cancel: "Отмена",
    logout: "Выйти",
    logoutSuccess: "Счастливого пути!",
    room: "Номер",
    guest: "Гость",

    welcome: "Добро пожаловать, {name}",
    voiceLabel: "Голосовой запрос",
    voiceTitle: "Поговорите со мной",
    voiceSubtitle: "Ваш консьерж слушает. Говорите на любом языке.",
    listeningState: "Слушаю…",
    voiceHint: "Нажмите на микрофон и начните говорить",
    goToVoiceChat: "Перейти к голосовому чату",

    askSomethingLabel: "Спросить текстом",
    askSomethingTitle: "Задать вопрос",
    askSomethingSubtitle: "Всё о вашем пребывании",

    staySection: "Ваше пребывание",
    stayActive: "Проживание активно",
    chatLink: "Чат",

    quickActionsSection: "Быстрые действия",
    touchToAsk: "Нажмите, чтобы спросить →",

    infoSection: "К вашим услугам",
    receptionTitle: "Ресепшн 24/7",
    receptionDesc: "Наша команда всегда готова выполнить любой запрос.",
    roomServiceTitle: "Обслуживание номеров",
    roomServiceDesc: "Закажите уборку или сервис через консьержа.",
    checkoutTitle: "Выезд",
    checkoutDesc: "Стандартное время выезда — 12:00.",

    footerText: "Консьерж на базе ИИ",

    backLabel: "На главную",
    clearChatLabel: "Очистить чат",
    headerRoom: "{name} · Номер {room}",
    emptyTitle: "Чем я могу вам помочь?",
    emptySubtitle: "Вы можете спросить всё о вашем пребывании, отеле или городе.",
    inputPlaceholder: "Задайте вопрос…",
    listeningPlaceholder: "Слушаю…",
    quotaPlaceholder: "Дневной лимит исчерпан. До завтра!",
    quotaMessage: "Вы достигли дневного лимита сообщений. Попробуйте снова завтра.",

    clearTitle: "Удалить переписку?",
    clearMessage: "Все сообщения будут удалены безвозвратно. Это действие нельзя отменить.",
    clearConfirm: "Удалить всё",
    sendFailed: "Не удалось отправить. Попробуйте ещё раз.",
    clearedMessage: "Переписка удалена.",

    voiceNotSupported: "Распознавание речи не поддерживается в этом браузере. Пожалуйста, введите сообщение.",
    micDenied: "Доступ к микрофону запрещён. Разрешите доступ в настройках браузера.",
    noSpeech: "Речь не обнаружена. Попробуйте ещё раз.",
    voiceErrorGeneric: "Ошибка голоса: {code}",

    installTitle: "Установить Guest Pro",
    installSubtitle: "Добавьте на главный экран для лучшего опыта.",
    installNow: "Добавить на главный экран",
    installLater: "Позже",
    installDontShow: "Больше не показывать",
    iosStep1Title: "Нажмите значок «Поделиться»",
    iosStep1Hint: "Внизу Safari",
    iosPadStep2Title: "Нажмите «Ещё»",
    iosPadStep2Hint: "Прокрутите вниз в меню «Поделиться»",
    iosStep3Title: "На экран «Домой»",
    iosStep3Hint: "Нажмите «На экран Домой»",
    iosStep4Title: "Нажмите «Добавить»",

    flowConfirm: "Подтвердить",
    flowEditContinue: "Продолжить редактирование",
    flowSkip: "Пропустить",
    flowNext: "Далее",
    flowBack: "Назад",
    flowCustomPlaceholder: "Или опишите свою потребность…",
    flowSuccessReturn: "На главную",
    flowRequestReceived: "Запрос получен",

    flowOrType: "или опишите своё пожелание",
    flowTypeHere: "Введите здесь…",

    flowFoodLabel: "Обслуживание номеров",
    flowSupportLabel: "Запрос в поддержку",
    flowCareLabel: "Позаботьтесь обо мне",
    flowFoodSuccess: "Ваш заказ передан на кухню. Он будет готов в ближайшее время.",
    flowSupportSuccess: "Ваш запрос передан персоналу. Мы займёмся этим в ближайшее время.",
    flowCareSuccess: "Ваши предпочтения сохранены. Мы персонализируем ваше пребывание.",

    flowFoodCategoryQ: "Чего вам хочется?",
    flowFoodCategoryHint: "Выберите категорию",
    flowFoodItemQ: "Какое блюдо вы хотите?",
    flowFoodItemHint: "Выберите блюдо",
    flowFoodQuantityQ: "Сколько порций?",
    flowFoodNoteQ: "Есть ли пожелания для кухни?",
    flowFoodNoteHint: "Необязательно — аллергии, особые пожелания…",
    flowFoodConfirmQ: "Подтвердите ваш заказ",

    flowCatBreakfast: "Завтрак",
    flowCatBreakfastHint: "Ассорти, омлет, тост",
    flowCatLight: "Лёгкие блюда",
    flowCatLightHint: "Сэндвичи, суп, салаты",
    flowCatMain: "Основные блюда",
    flowCatMainHint: "Курица, рыба, паста",
    flowCatDrinks: "Напитки",
    flowCatDrinksHint: "Чай, кофе, сок",

    flowQty1: "1 порция",
    flowQty2: "2 порции",
    flowQty3: "3 порции",

    flowSupportIssueQ: "Чем мы можем помочь?",
    flowSupportIssueHint: "Выберите тему",
    flowSupportUrgencyQ: "Насколько это срочно?",
    flowSupportNoteQ: "Хотите добавить что-нибудь ещё?",
    flowSupportNoteHint: "Необязательно — детали или особая информация",
    flowSupportConfirmQ: "Подтвердите запрос в поддержку",

    flowIssueMinibark: "Пополнить мини-бар",
    flowIssueMinibarHint: "Обновить напитки и закуски",
    flowIssuePillow: "Дополнительная подушка",
    flowIssuePillowHint: "Принести дополнительную подушку",
    flowIssueCleaning: "Уборка номера",
    flowIssueCleaningHint: "Пожалуйста, уберите мой номер",
    flowIssueRoomIssue: "Проблема в номере",
    flowIssueRoomIssueHint: "Кондиционер, отопление, дверь и т.д.",
    flowIssueTechIssue: "Технические проблемы",
    flowIssueTechIssueHint: "ТВ, Wi-Fi, электричество",
    flowIssueNoise: "Жалоба на шум",
    flowIssueNoiseHint: "Соседний номер, коридор",
    flowIssueExtra: "Дополнительные принадлежности",
    flowIssueExtraHint: "Полотенца, туалетные принадлежности и т.д.",
    flowIssueOther: "Другое",
    flowIssueOtherHint: "Что-то ещё",

    flowUrgUrgent: "Срочно",
    flowUrgUrgentHint: "Требует немедленного внимания",
    flowUrgNormal: "Обычно",
    flowUrgNormalHint: "При возможности",

    flowCareIntroQ: "Поделитесь своими предпочтениями",
    flowCareIntroHint: "Давайте персонализируем ваше пребывание",
    flowCareIntroPH: "Расскажите, что для вас важно во время проживания… (аллергии, особые пожелания, личные заметки)",
    flowCareNextHint: "На следующих шагах вы сможете быстро выбрать свои предпочтения.",
    flowCareSleepQ: "Каков ваш режим сна?",
    flowCareDietQ: "Каковы ваши диетические предпочтения?",
    flowCareComfortQ: "Каковы ваши предпочтения по комфорту?",
    flowCareServiceQ: "Какой стиль обслуживания вы предпочитаете?",
    flowCareConfirmQ: "Подтвердите ваши предпочтения",

    flowSleepEarly: "Рано ложусь спать",
    flowSleepEarlyHint: "До 22:00",
    flowSleepNormal: "Обычно",
    flowSleepNormalHint: "Между 23:00 – 01:00",
    flowSleepLate: "Поздно ложусь спать",
    flowSleepLateHint: "После 01:00",

    flowDietNormal: "Обычное",
    flowDietNormalHint: "Всё подходит",
    flowDietVeg: "Вегетарианское",
    flowDietVegHint: "Без мяса",
    flowDietVegan: "Веганское",
    flowDietVeganHint: "Без животных продуктов",
    flowDietGluten: "Без глютена",
    flowDietGlutenHint: "Без глютена",
    flowDietHalal: "Халяль",
    flowDietHalalHint: "Халяльная еда",

    flowComfortStd: "Стандарт",
    flowComfortStdHint: "Обычные настройки комфорта",
    flowComfortPillow: "Дополнительная подушка",
    flowComfortPillowHint: "Ещё одна подушка",
    flowComfortBlanket: "Дополнительное одеяло",
    flowComfortBlanketHint: "Ещё одно одеяло",
    flowComfortCool: "Прохладный номер",
    flowComfortCoolHint: "Держать кондиционер на прохладном режиме",
    flowComfortWarm: "Тёплый номер",
    flowComfortWarmHint: "Держать отопление высоким",

    flowServiceFull: "Полное обслуживание",
    flowServiceFullHint: "Частые проверки, помощь всегда готова",
    flowServiceMin: "Минимум беспокойства",
    flowServiceMinHint: "Предпочитаю конфиденциальность",

    flowSumFood: "Блюдо",
    flowSumPortions: "Порции",
    flowSumKitchenNote: "Заметка для кухни",
    flowSumTopic: "Тема",
    flowSumPriority: "Приоритет",
    flowSumDetail: "Детали",
    flowSumNote: "Ваша заметка",
    flowSumSleep: "Сон",
    flowSumDiet: "Питание",
    flowSumComfort: "Комфорт",
    flowSumService: "Обслуживание",

    quickActionFoodTitle: "Хочу есть",
    quickActionFoodSubtitle: "Обслуживание в номере",
    quickActionSupportTitle: "Поддержка",
    quickActionSupportSubtitle: "Что-то не так?",
    quickActionCareTitle: "Позаботьтесь обо мне",
    quickActionCareSubtitle: "Ваши предпочтения",

    myRequestsTitle: "Мои запросы",
    myRequestsSubtitle: "Отслеживайте свои запросы",
    myRequestsEmpty: "Запросов пока нет",
    reqStatusOpen: "Открыт",
    reqStatusInProgress: "В работе",
    reqStatusResolved: "Выполнен",
  },

  // ── German ────────────────────────────────────────────────────────────────
  de: {
    cancel: "Abbrechen",
    logout: "Abmelden",
    logoutSuccess: "Gute Reise!",
    room: "Zimmer",
    guest: "Gast",

    welcome: "Willkommen, {name}",
    voiceLabel: "Per Sprache fragen",
    voiceTitle: "Sprechen Sie mit mir",
    voiceSubtitle: "Ihr Concierge hört zu. Sprechen Sie in jeder Sprache.",
    listeningState: "Höre zu…",
    voiceHint: "Tippen Sie auf das Mikrofon und beginnen Sie zu sprechen",
    goToVoiceChat: "Zum Sprachchat wechseln",

    askSomethingLabel: "Per Text fragen",
    askSomethingTitle: "Etwas fragen",
    askSomethingSubtitle: "Alles über Ihren Aufenthalt",

    staySection: "Ihr Aufenthalt",
    stayActive: "Aufenthalt aktiv",
    chatLink: "Chat",

    quickActionsSection: "Schnellaktionen",
    touchToAsk: "Tippen zum Fragen →",

    infoSection: "Zu Ihren Diensten",
    receptionTitle: "24/7 Rezeption",
    receptionDesc: "Unser Team ist immer für Ihre Anfragen bereit.",
    roomServiceTitle: "Zimmerservice",
    roomServiceDesc: "Housekeeping oder Zimmerservice über den Concierge anfordern.",
    checkoutTitle: "Check-out",
    checkoutDesc: "Standard-Check-out-Zeit ist 12:00 Uhr.",

    footerText: "KI-gestützter Concierge",

    backLabel: "Zur Startseite",
    clearChatLabel: "Gespräch löschen",
    headerRoom: "{name} · Zimmer {room}",
    emptyTitle: "Wie kann ich Ihnen helfen?",
    emptySubtitle: "Sie können alles über Ihren Aufenthalt, das Hotel oder die Stadt fragen.",
    inputPlaceholder: "Etwas fragen…",
    listeningPlaceholder: "Höre zu…",
    quotaPlaceholder: "Tageslimit erreicht. Bis morgen!",
    quotaMessage: "Ihr tägliches Nachrichtenlimit wurde erreicht. Bitte morgen erneut versuchen.",

    clearTitle: "Gespräch löschen?",
    clearMessage: "Alle Nachrichten werden dauerhaft gelöscht. Dies kann nicht rückgängig gemacht werden.",
    clearConfirm: "Alles löschen",
    sendFailed: "Senden fehlgeschlagen. Bitte erneut versuchen.",
    clearedMessage: "Gespräch gelöscht.",

    voiceNotSupported: "Spracherkennung wird in diesem Browser nicht unterstützt. Bitte tippen Sie Ihre Nachricht.",
    micDenied: "Mikrofonzugriff verweigert. Bitte erlauben Sie den Zugriff in Ihren Browsereinstellungen.",
    noSpeech: "Keine Sprache erkannt. Bitte erneut versuchen.",
    voiceErrorGeneric: "Sprachfehler: {code}",

    installTitle: "Guest Pro installieren",
    installSubtitle: "Zum Startbildschirm hinzufügen für das beste Erlebnis.",
    installNow: "Zum Startbildschirm hinzufügen",
    installLater: "Später",
    installDontShow: "Nicht mehr anzeigen",
    iosStep1Title: "Tippen Sie auf das Teilen-Symbol",
    iosStep1Hint: "Am unteren Rand von Safari",
    iosPadStep2Title: "Tippen Sie auf \"Mehr anzeigen\"",
    iosPadStep2Hint: "Im Teilen-Menü nach unten scrollen",
    iosStep3Title: "Zum Home-Bildschirm",
    iosStep3Hint: "Tippen Sie auf \"Zum Home-Bildschirm\"",
    iosStep4Title: "Auf \"Hinzufügen\" tippen",

    flowConfirm: "Bestätigen",
    flowEditContinue: "Weiter bearbeiten",
    flowSkip: "Überspringen",
    flowNext: "Weiter",
    flowBack: "Zurück",
    flowCustomPlaceholder: "Oder eigenen Bedarf beschreiben…",
    flowSuccessReturn: "Zur Startseite",
    flowRequestReceived: "Anfrage eingegangen",

    flowOrType: "oder eigenen Bedarf angeben",
    flowTypeHere: "Hier eingeben…",

    flowFoodLabel: "Zimmerservice",
    flowSupportLabel: "Support-Anfrage",
    flowCareLabel: "Kümmere dich um mich",
    flowFoodSuccess: "Ihre Bestellung wurde an die Küche weitergeleitet. Sie wird in Kürze fertig sein.",
    flowSupportSuccess: "Ihre Anfrage wurde an das Personal weitergeleitet. Wir kümmern uns darum.",
    flowCareSuccess: "Ihre Präferenzen wurden gespeichert. Wir personalisieren Ihren Aufenthalt.",

    flowFoodCategoryQ: "Wonach ist Ihnen?",
    flowFoodCategoryHint: "Kategorie auswählen",
    flowFoodItemQ: "Welches Gericht möchten Sie?",
    flowFoodItemHint: "Ein Gericht auswählen",
    flowFoodQuantityQ: "Wie viele Portionen?",
    flowFoodNoteQ: "Haben Sie eine Anmerkung für die Küche?",
    flowFoodNoteHint: "Optional — Allergien, besondere Wünsche…",
    flowFoodConfirmQ: "Bestellung bestätigen",

    flowCatBreakfast: "Frühstück",
    flowCatBreakfastHint: "Büfett, Omelett, Toast",
    flowCatLight: "Leichte Mahlzeiten",
    flowCatLightHint: "Sandwiches, Suppe, Salate",
    flowCatMain: "Hauptgerichte",
    flowCatMainHint: "Hähnchen, Fisch, Pasta",
    flowCatDrinks: "Getränke",
    flowCatDrinksHint: "Tee, Kaffee, Saft",

    flowQty1: "1 Portion",
    flowQty2: "2 Portionen",
    flowQty3: "3 Portionen",

    flowSupportIssueQ: "Wie können wir Ihnen helfen?",
    flowSupportIssueHint: "Thema auswählen",
    flowSupportUrgencyQ: "Wie dringend ist das?",
    flowSupportNoteQ: "Möchten Sie noch etwas hinzufügen?",
    flowSupportNoteHint: "Optional — Details oder besondere Informationen",
    flowSupportConfirmQ: "Support-Anfrage bestätigen",

    flowIssueMinibark: "Minibar auffüllen",
    flowIssueMinibarHint: "Getränke & Snacks erneuern",
    flowIssuePillow: "Zusatzkissen",
    flowIssuePillowHint: "Ein weiteres Kissen bringen",
    flowIssueCleaning: "Zimmerreinigung",
    flowIssueCleaningHint: "Bitte mein Zimmer reinigen",
    flowIssueRoomIssue: "Zimmerproblem",
    flowIssueRoomIssueHint: "Klimaanlage, Heizung, Tür usw.",
    flowIssueTechIssue: "Technisches Problem",
    flowIssueTechIssueHint: "TV, WLAN, Strom",
    flowIssueNoise: "Lärmbeschwerde",
    flowIssueNoiseHint: "Nachbarzimmer, Flur",
    flowIssueExtra: "Zusätzliche Ausstattung",
    flowIssueExtraHint: "Handtücher, Toilettenartikel usw.",
    flowIssueOther: "Sonstiges",
    flowIssueOtherHint: "Etwas anderes",

    flowUrgUrgent: "Dringend",
    flowUrgUrgentHint: "Sofortige Aufmerksamkeit erforderlich",
    flowUrgNormal: "Normal",
    flowUrgNormalHint: "Wenn es passt",

    flowCareIntroQ: "Teilen Sie Ihre Präferenzen mit",
    flowCareIntroHint: "Lassen Sie uns Ihren Aufenthalt personalisieren",
    flowCareIntroPH: "Teilen Sie uns mit, was Ihnen wichtig ist… (Allergien, besondere Präferenzen, persönliche Anmerkungen)",
    flowCareNextHint: "In den nächsten Schritten können Sie Ihre Präferenzen schnell auswählen.",
    flowCareSleepQ: "Wie ist Ihr Schlafrhythmus?",
    flowCareDietQ: "Was ist Ihre Ernährungspräferenz?",
    flowCareComfortQ: "Was ist Ihre Komfortpräferenz?",
    flowCareServiceQ: "Welchen Servicestil bevorzugen Sie?",
    flowCareConfirmQ: "Ihre Präferenzen bestätigen",

    flowSleepEarly: "Frühschläfer",
    flowSleepEarlyHint: "Vor 22:00 Uhr",
    flowSleepNormal: "Normal",
    flowSleepNormalHint: "Zwischen 23:00 – 01:00 Uhr",
    flowSleepLate: "Nachtmensch",
    flowSleepLateHint: "Nach 01:00 Uhr",

    flowDietNormal: "Normal",
    flowDietNormalHint: "Alles",
    flowDietVeg: "Vegetarisch",
    flowDietVegHint: "Kein Fleisch",
    flowDietVegan: "Vegan",
    flowDietVeganHint: "Keine tierischen Produkte",
    flowDietGluten: "Glutenfrei",
    flowDietGlutenHint: "Kein Gluten",
    flowDietHalal: "Halal",
    flowDietHalalHint: "Halal-Essen",

    flowComfortStd: "Standard",
    flowComfortStdHint: "Normale Komforteinstellungen",
    flowComfortPillow: "Zusatzkissen",
    flowComfortPillowHint: "Zusätzliches Kissen",
    flowComfortBlanket: "Zusatzdecke",
    flowComfortBlanketHint: "Zusätzliche Decke",
    flowComfortCool: "Kühles Zimmer",
    flowComfortCoolHint: "Klimaanlage kühl halten",
    flowComfortWarm: "Warmes Zimmer",
    flowComfortWarmHint: "Heizung hoch halten",

    flowServiceFull: "Vollservice",
    flowServiceFullHint: "Häufige Kontrollen, Hilfe immer bereit",
    flowServiceMin: "Minimale Störung",
    flowServiceMinHint: "Ich bevorzuge Privatsphäre",

    flowSumFood: "Gericht",
    flowSumPortions: "Portionen",
    flowSumKitchenNote: "Küchenanmerkung",
    flowSumTopic: "Thema",
    flowSumPriority: "Priorität",
    flowSumDetail: "Detail",
    flowSumNote: "Ihre Anmerkung",
    flowSumSleep: "Schlaf",
    flowSumDiet: "Ernährung",
    flowSumComfort: "Komfort",
    flowSumService: "Service",

    quickActionFoodTitle: "Ich habe Hunger",
    quickActionFoodSubtitle: "Zimmerservice",
    quickActionSupportTitle: "Support-Anfrage",
    quickActionSupportSubtitle: "Etwas nicht in Ordnung?",
    quickActionCareTitle: "Kümmere dich um mich",
    quickActionCareSubtitle: "Ihre Präferenzen",

    myRequestsTitle: "Meine Anfragen",
    myRequestsSubtitle: "Ihre Serviceanfragen verfolgen",
    myRequestsEmpty: "Noch keine Anfragen",
    reqStatusOpen: "Offen",
    reqStatusInProgress: "In Bearbeitung",
    reqStatusResolved: "Abgeschlossen",
  },

  // ── French ────────────────────────────────────────────────────────────────
  fr: {
    cancel: "Annuler",
    logout: "Se déconnecter",
    logoutSuccess: "Bon voyage !",
    room: "Chambre",
    guest: "Client",

    welcome: "Bienvenue, {name}",
    voiceLabel: "Demander par la voix",
    voiceTitle: "Parlez-moi",
    voiceSubtitle: "Votre concierge vous écoute. Parlez dans n'importe quelle langue.",
    listeningState: "En écoute…",
    voiceHint: "Appuyez sur le microphone et commencez à parler",
    goToVoiceChat: "Passer au chat vocal",

    askSomethingLabel: "Demander par écrit",
    askSomethingTitle: "Poser une question",
    askSomethingSubtitle: "Tout sur votre séjour",

    staySection: "Votre séjour",
    stayActive: "Séjour actif",
    chatLink: "Chat",

    quickActionsSection: "Actions rapides",
    touchToAsk: "Appuyer pour demander →",

    infoSection: "À votre service",
    receptionTitle: "Réception 24/7",
    receptionDesc: "Notre équipe est toujours prête pour toute demande.",
    roomServiceTitle: "Service en chambre",
    roomServiceDesc: "Demandez le ménage ou le service via le concierge.",
    checkoutTitle: "Check-out",
    checkoutDesc: "L'heure de départ standard est 12h00.",

    footerText: "Concierge propulsé par l'IA",

    backLabel: "Retour à l'accueil",
    clearChatLabel: "Effacer la conversation",
    headerRoom: "{name} · Chambre {room}",
    emptyTitle: "Comment puis-je vous aider ?",
    emptySubtitle: "Vous pouvez poser toutes vos questions sur votre séjour, l'hôtel ou la ville.",
    inputPlaceholder: "Poser une question…",
    listeningPlaceholder: "En écoute…",
    quotaPlaceholder: "Limite quotidienne atteinte. À demain !",
    quotaMessage: "Vous avez atteint votre limite de messages quotidiens. Réessayez demain.",

    clearTitle: "Supprimer la conversation ?",
    clearMessage: "Tous les messages seront définitivement supprimés. Cette action est irréversible.",
    clearConfirm: "Tout supprimer",
    sendFailed: "Échec de l'envoi. Veuillez réessayer.",
    clearedMessage: "Conversation effacée.",

    voiceNotSupported: "La reconnaissance vocale n'est pas prise en charge dans ce navigateur. Veuillez taper votre message.",
    micDenied: "Accès au microphone refusé. Veuillez autoriser l'accès dans les paramètres de votre navigateur.",
    noSpeech: "Aucune parole détectée. Veuillez réessayer.",
    voiceErrorGeneric: "Erreur vocale : {code}",

    installTitle: "Installer Guest Pro",
    installSubtitle: "Ajoutez à votre écran d'accueil pour la meilleure expérience.",
    installNow: "Ajouter à l'écran d'accueil",
    installLater: "Plus tard",
    installDontShow: "Ne plus afficher",
    iosStep1Title: "Appuyez sur l'icône Partager",
    iosStep1Hint: "En bas de Safari",
    iosPadStep2Title: "Appuyez sur \"Voir plus\"",
    iosPadStep2Hint: "Faites défiler vers le bas dans le menu de partage",
    iosStep3Title: "Sur l'écran d'accueil",
    iosStep3Hint: "Appuyez sur \"Sur l'écran d'accueil\"",
    iosStep4Title: "Appuyez sur Ajouter",

    flowConfirm: "Confirmer",
    flowEditContinue: "Continuer à modifier",
    flowSkip: "Passer",
    flowNext: "Suivant",
    flowBack: "Retour",
    flowCustomPlaceholder: "Ou décrivez votre besoin…",
    flowSuccessReturn: "Retour à l'accueil",
    flowRequestReceived: "Demande reçue",

    flowOrType: "ou décrivez votre besoin",
    flowTypeHere: "Tapez ici…",

    flowFoodLabel: "Service en chambre",
    flowSupportLabel: "Demande d'assistance",
    flowCareLabel: "Prenez soin de moi",
    flowFoodSuccess: "Votre commande a été envoyée en cuisine. Elle sera prête sous peu.",
    flowSupportSuccess: "Votre demande a été transmise au personnel. Nous nous en occupons.",
    flowCareSuccess: "Vos préférences ont été enregistrées. Nous personaliserons votre séjour.",

    flowFoodCategoryQ: "Qu'avez-vous envie ?",
    flowFoodCategoryHint: "Sélectionnez une catégorie",
    flowFoodItemQ: "Quel plat souhaitez-vous ?",
    flowFoodItemHint: "Sélectionnez un plat",
    flowFoodQuantityQ: "Combien de portions ?",
    flowFoodNoteQ: "Une note pour la cuisine ?",
    flowFoodNoteHint: "Optionnel — allergies, demandes spéciales…",
    flowFoodConfirmQ: "Confirmer votre commande",

    flowCatBreakfast: "Petit-déjeuner",
    flowCatBreakfastHint: "Buffet, omelette, toast",
    flowCatLight: "Plats légers",
    flowCatLightHint: "Sandwichs, soupe, salades",
    flowCatMain: "Plats principaux",
    flowCatMainHint: "Poulet, poisson, pâtes",
    flowCatDrinks: "Boissons",
    flowCatDrinksHint: "Thé, café, jus",

    flowQty1: "1 portion",
    flowQty2: "2 portions",
    flowQty3: "3 portions",

    flowSupportIssueQ: "Comment pouvons-nous vous aider ?",
    flowSupportIssueHint: "Sélectionnez un sujet",
    flowSupportUrgencyQ: "Quelle est l'urgence ?",
    flowSupportNoteQ: "Souhaitez-vous ajouter autre chose ?",
    flowSupportNoteHint: "Optionnel — détails ou informations spéciales",
    flowSupportConfirmQ: "Confirmer la demande d'assistance",

    flowIssueMinibark: "Réapprovisionner le minibar",
    flowIssueMinibarHint: "Renouveler les boissons et snacks",
    flowIssuePillow: "Oreiller supplémentaire",
    flowIssuePillowHint: "Apporter un oreiller supplémentaire",
    flowIssueCleaning: "Nettoyage de la chambre",
    flowIssueCleaningHint: "Veuillez nettoyer ma chambre",
    flowIssueRoomIssue: "Problème dans la chambre",
    flowIssueRoomIssueHint: "Climatisation, chauffage, porte, etc.",
    flowIssueTechIssue: "Problème technique",
    flowIssueTechIssueHint: "TV, Wi-Fi, électricité",
    flowIssueNoise: "Plainte de bruit",
    flowIssueNoiseHint: "Chambre voisine, couloir",
    flowIssueExtra: "Fournitures supplémentaires",
    flowIssueExtraHint: "Serviettes, articles de toilette, etc.",
    flowIssueOther: "Autre",
    flowIssueOtherHint: "Autre chose",

    flowUrgUrgent: "Urgent",
    flowUrgUrgentHint: "Nécessite une attention immédiate",
    flowUrgNormal: "Normal",
    flowUrgNormalHint: "Quand c'est possible",

    flowCareIntroQ: "Partagez vos préférences",
    flowCareIntroHint: "Laissez-nous personnaliser votre séjour",
    flowCareIntroPH: "Dites-nous ce qui vous importe pendant votre séjour… (allergies, préférences spéciales, notes personnelles)",
    flowCareNextHint: "Aux étapes suivantes, vous pourrez rapidement sélectionner vos préférences.",
    flowCareSleepQ: "Quel est votre rythme de sommeil ?",
    flowCareDietQ: "Quelle est votre préférence alimentaire ?",
    flowCareComfortQ: "Quelle est votre préférence de confort ?",
    flowCareServiceQ: "Quel style de service préférez-vous ?",
    flowCareConfirmQ: "Confirmer vos préférences",

    flowSleepEarly: "Couche-tôt",
    flowSleepEarlyHint: "Avant 22h00",
    flowSleepNormal: "Normal",
    flowSleepNormalHint: "Entre 23h00 – 01h00",
    flowSleepLate: "Couche-tard",
    flowSleepLateHint: "Après 01h00",

    flowDietNormal: "Normal",
    flowDietNormalHint: "Tout",
    flowDietVeg: "Végétarien",
    flowDietVegHint: "Sans viande",
    flowDietVegan: "Vegan",
    flowDietVeganHint: "Sans produits animaux",
    flowDietGluten: "Sans gluten",
    flowDietGlutenHint: "Sans gluten",
    flowDietHalal: "Halal",
    flowDietHalalHint: "Nourriture halal",

    flowComfortStd: "Standard",
    flowComfortStdHint: "Paramètres de confort normaux",
    flowComfortPillow: "Oreiller supplémentaire",
    flowComfortPillowHint: "Oreiller supplémentaire",
    flowComfortBlanket: "Couverture supplémentaire",
    flowComfortBlanketHint: "Couverture supplémentaire",
    flowComfortCool: "Chambre fraîche",
    flowComfortCoolHint: "Garder la climatisation fraîche",
    flowComfortWarm: "Chambre chaude",
    flowComfortWarmHint: "Garder le chauffage élevé",

    flowServiceFull: "Service complet",
    flowServiceFullHint: "Contrôles fréquents, aide toujours disponible",
    flowServiceMin: "Dérangement minimal",
    flowServiceMinHint: "Je préfère la confidentialité",

    flowSumFood: "Plat",
    flowSumPortions: "Portions",
    flowSumKitchenNote: "Note cuisine",
    flowSumTopic: "Sujet",
    flowSumPriority: "Priorité",
    flowSumDetail: "Détail",
    flowSumNote: "Votre note",
    flowSumSleep: "Sommeil",
    flowSumDiet: "Alimentation",
    flowSumComfort: "Confort",
    flowSumService: "Service",

    quickActionFoodTitle: "J'ai faim",
    quickActionFoodSubtitle: "Service en chambre",
    quickActionSupportTitle: "Demande d'assistance",
    quickActionSupportSubtitle: "Un problème ?",
    quickActionCareTitle: "Prenez soin de moi",
    quickActionCareSubtitle: "Vos préférences",

    myRequestsTitle: "Mes demandes",
    myRequestsSubtitle: "Suivez vos demandes de service",
    myRequestsEmpty: "Aucune demande pour l'instant",
    reqStatusOpen: "Ouvert",
    reqStatusInProgress: "En cours",
    reqStatusResolved: "Terminé",
  },

  // ── Spanish ───────────────────────────────────────────────────────────────
  es: {
    cancel: "Cancelar",
    logout: "Cerrar sesión",
    logoutSuccess: "¡Buen viaje!",
    room: "Habitación",
    guest: "Huésped",

    welcome: "Bienvenido, {name}",
    voiceLabel: "Preguntar por voz",
    voiceTitle: "Háblame",
    voiceSubtitle: "Tu conserje está escuchando. Habla en cualquier idioma.",
    listeningState: "Escuchando…",
    voiceHint: "Toca el micrófono y empieza a hablar",
    goToVoiceChat: "Cambiar al chat de voz",

    askSomethingLabel: "Preguntar por texto",
    askSomethingTitle: "Preguntar algo",
    askSomethingSubtitle: "Todo sobre tu estancia",

    staySection: "Tu estancia",
    stayActive: "Estancia activa",
    chatLink: "Chat",

    quickActionsSection: "Acciones rápidas",
    touchToAsk: "Toca para preguntar →",

    infoSection: "A tu servicio",
    receptionTitle: "Recepción 24/7",
    receptionDesc: "Nuestro equipo siempre está listo para cualquier solicitud.",
    roomServiceTitle: "Servicio de habitaciones",
    roomServiceDesc: "Solicita limpieza o servicio a través del conserje.",
    checkoutTitle: "Check-out",
    checkoutDesc: "La hora estándar de salida es las 12:00.",

    footerText: "Conserje impulsado por IA",

    backLabel: "Ir al inicio",
    clearChatLabel: "Borrar conversación",
    headerRoom: "{name} · Habitación {room}",
    emptyTitle: "¿En qué puedo ayudarte?",
    emptySubtitle: "Puedes preguntar cualquier cosa sobre tu estancia, el hotel o la ciudad.",
    inputPlaceholder: "Pregunta algo…",
    listeningPlaceholder: "Escuchando…",
    quotaPlaceholder: "Límite diario alcanzado. ¡Hasta mañana!",
    quotaMessage: "Has alcanzado tu límite diario de mensajes. Por favor, inténtalo mañana.",

    clearTitle: "¿Eliminar conversación?",
    clearMessage: "Todos los mensajes se eliminarán permanentemente. Esto no se puede deshacer.",
    clearConfirm: "Eliminar todo",
    sendFailed: "Error al enviar. Por favor, inténtalo de nuevo.",
    clearedMessage: "Conversación borrada.",

    voiceNotSupported: "El reconocimiento de voz no es compatible con este navegador. Por favor, escribe tu mensaje.",
    micDenied: "Acceso al micrófono denegado. Permite el acceso en la configuración del navegador.",
    noSpeech: "No se detectó voz. Por favor, inténtalo de nuevo.",
    voiceErrorGeneric: "Error de voz: {code}",

    installTitle: "Instalar Guest Pro",
    installSubtitle: "Añade a tu pantalla de inicio para la mejor experiencia.",
    installNow: "Añadir a la pantalla de inicio",
    installLater: "Más tarde",
    installDontShow: "No mostrar de nuevo",
    iosStep1Title: "Toca el icono Compartir",
    iosStep1Hint: "En la parte inferior de Safari",
    iosPadStep2Title: "Toca \"Ver más\"",
    iosPadStep2Hint: "Desplázate hacia abajo en el menú de compartir",
    iosStep3Title: "Añadir a inicio",
    iosStep3Hint: "Toca \"Añadir a pantalla de inicio\"",
    iosStep4Title: "Toca Añadir",

    flowConfirm: "Confirmar",
    flowEditContinue: "Continuar editando",
    flowSkip: "Omitir",
    flowNext: "Siguiente",
    flowBack: "Atrás",
    flowCustomPlaceholder: "O describe tu propia necesidad…",
    flowSuccessReturn: "Volver al inicio",
    flowRequestReceived: "Solicitud recibida",

    flowOrType: "o describe tu propia necesidad",
    flowTypeHere: "Escribe aquí…",

    flowFoodLabel: "Servicio a la habitación",
    flowSupportLabel: "Solicitud de soporte",
    flowCareLabel: "Cuídame",
    flowFoodSuccess: "Tu pedido ha sido enviado a la cocina. Estará listo en breve.",
    flowSupportSuccess: "Tu solicitud ha sido enviada al personal. Nos ocuparemos en breve.",
    flowCareSuccess: "Tus preferencias han sido guardadas. Personalizaremos tu estancia.",

    flowFoodCategoryQ: "¿Qué te apetece?",
    flowFoodCategoryHint: "Selecciona una categoría",
    flowFoodItemQ: "¿Qué plato quieres?",
    flowFoodItemHint: "Selecciona un plato",
    flowFoodQuantityQ: "¿Cuántas porciones?",
    flowFoodNoteQ: "¿Tienes alguna nota para la cocina?",
    flowFoodNoteHint: "Opcional — alergias, peticiones especiales…",
    flowFoodConfirmQ: "Confirmar tu pedido",

    flowCatBreakfast: "Desayuno",
    flowCatBreakfastHint: "Bufé, tortilla, tostadas",
    flowCatLight: "Platos ligeros",
    flowCatLightHint: "Sándwiches, sopa, ensaladas",
    flowCatMain: "Platos principales",
    flowCatMainHint: "Pollo, pescado, pasta",
    flowCatDrinks: "Bebidas",
    flowCatDrinksHint: "Té, café, zumo",

    flowQty1: "1 porción",
    flowQty2: "2 porciones",
    flowQty3: "3 porciones",

    flowSupportIssueQ: "¿Cómo podemos ayudarte?",
    flowSupportIssueHint: "Selecciona un tema",
    flowSupportUrgencyQ: "¿Qué tan urgente es?",
    flowSupportNoteQ: "¿Quieres añadir algo más?",
    flowSupportNoteHint: "Opcional — detalles o información especial",
    flowSupportConfirmQ: "Confirmar solicitud de soporte",

    flowIssueMinibark: "Reponer minibar",
    flowIssueMinibarHint: "Renovar bebidas y aperitivos",
    flowIssuePillow: "Almohada adicional",
    flowIssuePillowHint: "Traer una almohada adicional",
    flowIssueCleaning: "Limpieza de habitación",
    flowIssueCleaningHint: "Por favor, limpia mi habitación",
    flowIssueRoomIssue: "Problema en la habitación",
    flowIssueRoomIssueHint: "Aire acondicionado, calefacción, puerta, etc.",
    flowIssueTechIssue: "Problema técnico",
    flowIssueTechIssueHint: "TV, Wi-Fi, electricidad",
    flowIssueNoise: "Queja de ruido",
    flowIssueNoiseHint: "Habitación vecina, pasillo",
    flowIssueExtra: "Suministros adicionales",
    flowIssueExtraHint: "Toallas, artículos de aseo, etc.",
    flowIssueOther: "Otro",
    flowIssueOtherHint: "Otra cosa",

    flowUrgUrgent: "Urgente",
    flowUrgUrgentHint: "Necesita atención inmediata",
    flowUrgNormal: "Normal",
    flowUrgNormalHint: "Cuando sea conveniente",

    flowCareIntroQ: "Comparte tus preferencias",
    flowCareIntroHint: "Déjanos personalizar tu estancia",
    flowCareIntroPH: "Cuéntanos qué te importa durante tu estancia… (alergias, preferencias especiales, notas personales)",
    flowCareNextHint: "En los siguientes pasos, podrás seleccionar tus preferencias rápidamente.",
    flowCareSleepQ: "¿Cuál es tu horario de sueño?",
    flowCareDietQ: "¿Cuáles son tus preferencias dietéticas?",
    flowCareComfortQ: "¿Cuáles son tus preferencias de confort?",
    flowCareServiceQ: "¿Qué estilo de servicio prefieres?",
    flowCareConfirmQ: "Confirmar tus preferencias",

    flowSleepEarly: "Me acuesto temprano",
    flowSleepEarlyHint: "Antes de las 22:00",
    flowSleepNormal: "Normal",
    flowSleepNormalHint: "Entre 23:00 – 01:00",
    flowSleepLate: "Me acuesto tarde",
    flowSleepLateHint: "Después de la 01:00",

    flowDietNormal: "Normal",
    flowDietNormalHint: "Todo",
    flowDietVeg: "Vegetariano",
    flowDietVegHint: "Sin carne",
    flowDietVegan: "Vegano",
    flowDietVeganHint: "Sin productos animales",
    flowDietGluten: "Sin gluten",
    flowDietGlutenHint: "Sin gluten",
    flowDietHalal: "Halal",
    flowDietHalalHint: "Comida halal",

    flowComfortStd: "Estándar",
    flowComfortStdHint: "Configuración de confort normal",
    flowComfortPillow: "Almohada extra",
    flowComfortPillowHint: "Almohada adicional",
    flowComfortBlanket: "Manta extra",
    flowComfortBlanketHint: "Manta adicional",
    flowComfortCool: "Habitación fresca",
    flowComfortCoolHint: "Mantener el aire fresco",
    flowComfortWarm: "Habitación cálida",
    flowComfortWarmHint: "Mantener la calefacción alta",

    flowServiceFull: "Servicio completo",
    flowServiceFullHint: "Revisiones frecuentes, ayuda siempre disponible",
    flowServiceMin: "Mínima perturbación",
    flowServiceMinHint: "Prefiero privacidad",

    flowSumFood: "Comida",
    flowSumPortions: "Porciones",
    flowSumKitchenNote: "Nota de cocina",
    flowSumTopic: "Tema",
    flowSumPriority: "Prioridad",
    flowSumDetail: "Detalle",
    flowSumNote: "Tu nota",
    flowSumSleep: "Sueño",
    flowSumDiet: "Dieta",
    flowSumComfort: "Confort",
    flowSumService: "Servicio",

    quickActionFoodTitle: "Tengo hambre",
    quickActionFoodSubtitle: "Servicio a la habitación",
    quickActionSupportTitle: "Solicitud de soporte",
    quickActionSupportSubtitle: "¿Hay algún problema?",
    quickActionCareTitle: "Cuídame",
    quickActionCareSubtitle: "Tus preferencias",

    myRequestsTitle: "Mis solicitudes",
    myRequestsSubtitle: "Sigue tus solicitudes de servicio",
    myRequestsEmpty: "Sin solicitudes aún",
    reqStatusOpen: "Abierto",
    reqStatusInProgress: "En progreso",
    reqStatusResolved: "Completado",
  },
};

/**
 * Get the translation dictionary for the given UI locale.
 * Gracefully falls back to English for unsupported locales.
 */
export function getTranslations(uiLocale: string): GuestTranslations {
  const locale = uiLocale?.toLowerCase() as SupportedLocale;
  return translations[locale] ?? translations.en;
}

/** Inline template substitution: replace {key} placeholders in a string. */
export function tFmt(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replaceAll(`{${k}}`, v),
    template
  );
}
