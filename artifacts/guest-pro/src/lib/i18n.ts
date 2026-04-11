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

  // ── Guided Flow ─────────────────────────────────────────────────────────────
  flowConfirm: string;
  flowEditContinue: string;
  flowSkip: string;
  flowNext: string;
  flowBack: string;
  flowCustomPlaceholder: string;
  flowSuccessReturn: string;
  flowRequestReceived: string;

  // ── My Requests ──────────────────────────────────────────────────────────────
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
