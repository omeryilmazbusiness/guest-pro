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
  navMenuTitle: string;
  navMenuOpen: string;
  languageMenuLabel: string;
  languageSheetTitle: string;
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
  voiceSendToChat: string;

  askSomethingLabel: string;
  askSomethingTitle: string;
  askSomethingSubtitle: string;

  staySection: string;
  stayAboutTitle: string;
  guestKeyLabel: string;
  stayWifiTitle: string;
  stayWifiFloor: string;
  stayWifiNetwork: string;
  stayWifiPasswordLabel: string;
  stayWifiCopy: string;
  stayWifiCopied: string;
  copyKey: string;
  keyCopied: string;
  noActiveKey: string;
  stayActive: string;
  chatLink: string;
  nearbyTapHint: string;
  nearbySearchPlaceholder: string;
  nearbyFilterAll: string;
  nearbyViewAll: string; // {count}
  nearbyNoResults: string;
  nearbyBackToList: string;
  nearbyNearestTitle: string;
  nearbyMapLoading: string;
  nearbyMapUnavailable: string;
  nearbyLocationHint: string;
  nearbyEmptyPlaces: string;
  nearbyHotelLabel: string;
  nearbyLoadFailed: string;
  nearbyRetry: string;
  nearbySection: string;

  quickActionsSection: string;
  quickActionsOthersSection: string;
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
  aiCapacityTitle: string;
  aiCapacityHint: string;

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
  iosStep2Title: string;
  iosStep2Hint: string;
  iosStep3Title: string;
  iosStep3Hint: string;
  iosStep4Title: string;
  iosStep4Hint: string;

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
  flowMenuLoading: string;
  flowMenuEmpty: string;
  flowFoodAllTab: string;
  flowFoodSelectHint: string;
  flowFoodQty: string;
  flowFoodItemNote: string;
  flowFoodItemNotePlaceholder: string;
  flowFoodPlaceOrder: string;
  flowFoodItemsSelected: string;
  flowFoodLinesSelected: string;
  flowFoodNoItems: string;
  flowConfirmCategoryLabel: string;

  // ── Flow — Food categories ───────────────────────────────────────────────
  flowCatBreakfast: string;
  flowCatBreakfastHint: string;
  flowCatSoup: string;
  flowCatSoupHint: string;
  flowCatSalad: string;
  flowCatSaladHint: string;
  flowCatAppetizer: string;
  flowCatAppetizerHint: string;
  flowCatLight: string;
  flowCatLightHint: string;
  flowCatMain: string;
  flowCatMainHint: string;
  flowCatDessert: string;
  flowCatDessertHint: string;
  flowCatSnack: string;
  flowCatSnackHint: string;
  flowCatDrinks: string;
  flowCatDrinksHint: string;
  flowCatOther: string;
  flowCatOtherHint: string;

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
  flowCareContinue: string;
  flowCareConfirmDesc: string;
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

  conciergeLaundry: string;
  conciergeSpa: string;
  conciergeTaxi: string;
  conciergeSalon: string;
  conciergeSheetTitle: string;
  conciergeSheetSubtitle: string;
  conciergeWhenLabel: string;
  conciergeWhenAsap: string;
  conciergeWhenMorning: string;
  conciergeWhenAfternoon: string;
  conciergeWhenEvening: string;
  conciergeWhenTomorrow: string;
  conciergeNotesLabel: string;
  conciergeNotesPlaceholder: string;
  conciergeSubmit: string;
  conciergeSuccessToast: string;
  conciergeSummary: string;

  hotelConnectSection: string;
  receptionLiveTitle: string;
  receptionLiveSubtitle: string;
  receptionLiveBadge: string;
  receptionLiveCta: string;
  morePlusTitle: string;
  morePlusSubtitle: string;
  comingSoonTitle: string;
  comingSoonBody: string;
  comingSoonClose: string;

  atYourServiceHotelAbout: string;
  atYourServiceGuestProAbout: string;
  atYourServiceGuestProDesc: string;
  atYourServiceWifi: string;
  atYourServiceEmergency: string;
  feedbackSectionTitle: string;
  feedbackRatingLabel: string;
  feedbackCommentPlaceholder: string;
  feedbackSubmit: string;
  complaintSectionTitle: string;
  complaintPlaceholder: string;
  complaintSubmit: string;
  feedbackSuccessToast: string;
  complaintSuccessToast: string;
  feedbackSubmitting: string;

  // ── My Requests ───────────────────────────────────────────────────────────
  myRequestsTitle: string;
  myRequestsSubtitle: string;
  myRequestsEmpty: string;
  reqTypeGeneral: string;
  reqDetailCategory: string;
  reqStatusOpen: string;
  reqStatusInProgress: string;
  reqStatusResolved: string;
  myRequestsTabOpen: string;
  myRequestsTabPreparing: string;
  myRequestsTabCompleted: string;
  myRequestsActiveHint: string;
  myRequestsTapToView: string;
  fulfillmentStepReceived: string;
  fulfillmentStepKitchen: string;
  fulfillmentStepEnRoute: string;
  fulfillmentStepDone: string;
  fulfillmentEtaMinutes: string;
  reqDeleteLabel: string;
  reqDeleteConfirm: string;
  reqDeletedToast: string;

  // ── Daily bill (folio) ────────────────────────────────────────────────────
  billSection: string;
  billCardTitle: string;
  billCardSubtitleToday: string;
  billCardSubtitleAmount: string; // {amount}
  billSheetTitle: string;
  billRoomLabel: string; // {room}
  billSubtotal: string;
  billRoomChargeNote: string;
  billEmptyTitle: string;
  billEmptySubtitle: string;
  billToday: string;
  billYesterday: string;
  billClose: string;

  // ── AI Chat assistant ─────────────────────────────────────────────────────
  chatQuickFood: string;
  chatQuickSupport: string;
  chatQuickInfo: string;
  chatQuickActivity: string;
  chatModeIntroFood: string;
  chatModeIntroSupport: string;
  chatModeIntroCare: string;
  chatSummaryPrefixFood: string;
  chatSummaryPrefixSupport: string;
  chatSummaryPrefixCare: string;
  chatSummaryFallback: string;
  chatCreateRequestCta: string;
  chatCreateRequestError: string;
  chatActionTitle: string;
  chatActionConfirm: string;
  chatActionDismiss: string;
  chatRequestCreated: string;
  receptionChatPrompt: string;
  voiceStarting: string;
  voiceListening: string;
  voiceThinking: string;
  voiceSpeaking: string;
  voiceTapInterrupt: string;
  voiceTapRetry: string;
}

type SupportedLocale = "en" | "tr" | "ar" | "ru" | "de" | "fr" | "es";

const translations: Record<SupportedLocale, GuestTranslations> = {
  // ── English ──────────────────────────────────────────────────────────────
  en: {
    cancel: "Cancel",
    navMenuTitle: "Menu",
    navMenuOpen: "Open menu",
    languageMenuLabel: "Language",
    languageSheetTitle: "Choose language",
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
    voiceSendToChat: "Send to chat",

    askSomethingLabel: "Ask by Text",
    askSomethingTitle: "Ask Something",
    askSomethingSubtitle: "Anything about your stay",

    staySection: "Your Stay",
    stayAboutTitle: "About your stay",
    guestKeyLabel: "Guest key",
    stayWifiTitle: "Wi-Fi",
    stayWifiFloor: "Floor {floor}",
    stayWifiNetwork: "Network",
    stayWifiPasswordLabel: "Password",
    stayWifiCopy: "Copy",
    stayWifiCopied: "Copied",
    copyKey: "Copy",
    keyCopied: "Copied",
    noActiveKey: "No active key on file",
    stayActive: "Stay active",
    chatLink: "Chat",
    nearbyTapHint: "Tap a place for details and directions",
    nearbySearchPlaceholder: "Search places…",
    nearbyFilterAll: "All",
    nearbyViewAll: "View all {count} places",
    nearbyNoResults: "No places match your search",
    nearbyBackToList: "All places",
    nearbyNearestTitle: "Find nearest",
    nearbyMapLoading: "Loading map…",
    nearbyMapUnavailable: "Map preview unavailable",
    nearbyLocationHint: "Enable location to see distances from you",
    nearbyEmptyPlaces: "No nearby places configured yet",
    nearbyHotelLabel: "Hotel",
    nearbyLoadFailed: "Could not load nearby places",
    nearbyRetry: "Try again",
    nearbySection: "Nearby",

    quickActionsSection: "Quick Actions",
    quickActionsOthersSection: "Others",
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
    aiCapacityTitle: "AI chat is at capacity for today",
    aiCapacityHint: "Choose a quick action below — our team will help you right away.",

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
    iosStep1Title: "Tap the ⋯ menu",
    iosStep1Hint: "Bottom of Safari (three dots)",
    iosStep2Title: "Tap Share",
    iosStep2Hint: "In the menu that opens",
    iosStep3Title: "Tap View More",
    iosStep3Hint: "Scroll down in the share sheet if needed",
    iosStep4Title: "Tap Add to Home Screen",
    iosStep4Hint: "Then tap Add to confirm",

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
    flowMenuLoading: "Loading…",
    flowMenuEmpty: "No items on the menu",
    flowFoodAllTab: "All",
    flowFoodSelectHint: "Tap items to build your order",
    flowFoodQty: "Quantity",
    flowFoodItemNote: "Note",
    flowFoodItemNotePlaceholder: "Allergies, cooking preference…",
    flowFoodPlaceOrder: "Send order",
    flowFoodItemsSelected: "{count} servings",
    flowFoodLinesSelected: "{count} dishes selected",
    flowFoodNoItems: "Select at least one item",
    flowConfirmCategoryLabel: "Category",

    flowCatBreakfast: "Breakfast",
    flowCatBreakfastHint: "Spreads, omelettes, toast",
    flowCatSoup: "Soup",
    flowCatSoupHint: "Soups and warm starters",
    flowCatSalad: "Salad",
    flowCatSaladHint: "Fresh salads",
    flowCatAppetizer: "Appetizers",
    flowCatAppetizerHint: "Starters and small plates",
    flowCatLight: "Light Meals",
    flowCatLightHint: "Sandwiches, soup, salads",
    flowCatMain: "Main Dishes",
    flowCatMainHint: "Chicken, fish, pasta",
    flowCatDessert: "Dessert",
    flowCatDessertHint: "Sweets and treats",
    flowCatSnack: "Snacks",
    flowCatSnackHint: "Quick bites",
    flowCatDrinks: "Beverages",
    flowCatDrinksHint: "Tea, coffee, juice",
    flowCatOther: "Other",
    flowCatOtherHint: "More options",

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
    flowCareContinue: "Continue exploring options",
    flowCareConfirmDesc: "Confirm with my description",
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

    conciergeLaundry: "Laundry",
    conciergeSpa: "Spa & Wellness",
    conciergeTaxi: "Taxi",
    conciergeSalon: "Salon",
    conciergeSheetTitle: "{service} booking",
    conciergeSheetSubtitle: "Reception will confirm your reservation.",
    conciergeWhenLabel: "When",
    conciergeWhenAsap: "ASAP",
    conciergeWhenMorning: "This morning",
    conciergeWhenAfternoon: "This afternoon",
    conciergeWhenEvening: "This evening",
    conciergeWhenTomorrow: "Tomorrow",
    conciergeNotesLabel: "Notes (optional)",
    conciergeNotesPlaceholder: "e.g. pick-up time, treatment preference…",
    conciergeSubmit: "Send to reception",
    conciergeSuccessToast: "Request sent — reception will confirm shortly.",
    conciergeSummary: "{service} · {when}",

    hotelConnectSection: "Hotel",
    receptionLiveTitle: "Reception",
    receptionLiveSubtitle: "Chat live with our front desk team",
    receptionLiveBadge: "Live",
    receptionLiveCta: "Open chat",
    morePlusTitle: "More+",
    morePlusSubtitle: "Activities & hotel extras",
    comingSoonTitle: "Coming soon",
    comingSoonBody: "We're preparing new experiences for you. Check back shortly.",
    comingSoonClose: "Got it",

    atYourServiceHotelAbout: "Your hotel",
    atYourServiceGuestProAbout: "Guest Pro",
    atYourServiceGuestProDesc: "AI concierge for your stay — ask anything, anytime.",
    atYourServiceWifi: "Wi‑Fi",
    atYourServiceEmergency: "Emergency",
    feedbackSectionTitle: "Share your experience",
    feedbackRatingLabel: "Rate your stay",
    feedbackCommentPlaceholder: "Tell us what you enjoyed…",
    feedbackSubmit: "Send feedback",
    complaintSectionTitle: "Complaints & suggestions",
    complaintPlaceholder: "How can we improve your stay?",
    complaintSubmit: "Send message",
    feedbackSuccessToast: "Thank you — your feedback was sent.",
    complaintSuccessToast: "Thank you — we received your message.",
    feedbackSubmitting: "Sending…",

    myRequestsTitle: "My Requests",
    myRequestsSubtitle: "Track your service requests",
    myRequestsEmpty: "No requests yet",
    reqTypeGeneral: "General request",
    reqDetailCategory: "Category",
    reqStatusOpen: "Open",
    reqStatusInProgress: "In Progress",
    reqStatusResolved: "Completed",
    myRequestsTabOpen: "Open",
    myRequestsTabPreparing: "Preparing",
    myRequestsTabCompleted: "Done",
    myRequestsActiveHint: "{n} active request(s)",
    myRequestsTapToView: "Tap to view your requests",
    fulfillmentStepReceived: "Received",
    fulfillmentStepKitchen: "Kitchen",
    fulfillmentStepEnRoute: "On the way",
    fulfillmentStepDone: "Delivered",
    fulfillmentEtaMinutes: "Est. ~{n} min",
    reqDeleteLabel: "Remove",
    reqDeleteConfirm: "Delete?",
    reqDeletedToast: "Request removed",

    billSection: "Your stay",
    billCardTitle: "Today's bill",
    billCardSubtitleToday: "Tap to view charges for today",
    billCardSubtitleAmount: "Today · {amount}",
    billSheetTitle: "Daily bill",
    billRoomLabel: "Room {room}",
    billSubtotal: "Total",
    billRoomChargeNote: "Charges are added to your room account. Final invoice at checkout.",
    billEmptyTitle: "No charges yet",
    billEmptySubtitle: "Food orders and minibar services with a listed price will appear here.",
    billToday: "Today",
    billYesterday: "Yesterday",
    billClose: "Close",

    chatQuickFood: "I'm hungry",
    chatQuickSupport: "I need help",
    chatQuickInfo: "Hotel info",
    chatQuickActivity: "I'm bored",
    chatModeIntroFood: "I'm hungry and would like to order something.",
    chatModeIntroSupport: "I have a support request — can you help?",
    chatModeIntroCare: "I'd like to share my stay preferences.",
    chatSummaryPrefixFood: "Food order: ",
    chatSummaryPrefixSupport: "Support request: ",
    chatSummaryPrefixCare: "Guest preferences: ",
    chatSummaryFallback: "Guided chat completed.",
    chatCreateRequestCta: "Create request & notify staff",
    chatCreateRequestError: "Could not create the request. Please try again.",
    chatActionTitle: "Confirm request",
    chatActionConfirm: "Send to staff",
    chatActionDismiss: "Not now",
    chatRequestCreated: "Request sent — our team will assist you shortly.",
    receptionChatPrompt: "I'd like to speak with reception",
    voiceStarting: "Starting",
    voiceListening: "Listening",
    voiceThinking: "Thinking",
    voiceSpeaking: "Speaking",
    voiceTapInterrupt: "Tap to interrupt",
    voiceTapRetry: "Tap to retry",
  },

  // ── Turkish ───────────────────────────────────────────────────────────────
  tr: {
    cancel: "İptal",
    navMenuTitle: "Menü",
    navMenuOpen: "Menüyü aç",
    languageMenuLabel: "Dil",
    languageSheetTitle: "Dil seçin",
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
    voiceSendToChat: "Sohbete gönder",

    askSomethingLabel: "Yazarak Sor",
    askSomethingTitle: "Bir Şey Sor",
    askSomethingSubtitle: "Konaklamanız hakkında her şey",

    staySection: "Konaklamanız",
    stayAboutTitle: "Konaklamanız hakkında",
    guestKeyLabel: "Misafir anahtarı",
    stayWifiTitle: "Wi-Fi",
    stayWifiFloor: "{floor}. kat",
    stayWifiNetwork: "Ağ adı",
    stayWifiPasswordLabel: "Şifre",
    stayWifiCopy: "Kopyala",
    stayWifiCopied: "Kopyalandı",
    copyKey: "Kopyala",
    keyCopied: "Kopyalandı",
    noActiveKey: "Aktif anahtar bulunamadı",
    stayActive: "Konaklama aktif",
    chatLink: "Chat",
    nearbyTapHint: "Detay ve yol tarifi için yere dokunun",
    nearbySearchPlaceholder: "Yer ara…",
    nearbyFilterAll: "Tümü",
    nearbyViewAll: "Tüm yerler ({count})",
    nearbyNoResults: "Aramanızla eşleşen yer yok",
    nearbyBackToList: "Tüm yerlere dön",
    nearbyNearestTitle: "En yakın bul",
    nearbyMapLoading: "Harita yükleniyor…",
    nearbyMapUnavailable: "Harita önizlemesi kullanılamıyor",
    nearbyLocationHint: "Mesafeleri görmek için konum izni verin",
    nearbyEmptyPlaces: "Henüz yakın yer tanımlanmadı",
    nearbyHotelLabel: "Otel",
    nearbyLoadFailed: "Yakın yerler yüklenemedi",
    nearbyRetry: "Tekrar dene",
    nearbySection: "Yakında",

    quickActionsSection: "Hızlı İstekler",
    quickActionsOthersSection: "Diğer",
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
    aiCapacityTitle: "Bugünkü AI sohbet kotası doldu",
    aiCapacityHint: "Hemen yardım için aşağıdaki hızlı işlemlerden birini seçin.",

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
    iosStep1Title: "⋯ menüsüne dokunun",
    iosStep1Hint: "Safari'nin alt kısmındaki üç nokta",
    iosStep2Title: "Paylaş'a dokunun",
    iosStep2Hint: "Açılan menüden",
    iosStep3Title: "View More'a dokunun",
    iosStep3Hint: "Gerekirse paylaşım sayfasında aşağı kaydırın",
    iosStep4Title: "Ana Ekrana Ekle'ye dokunun",
    iosStep4Hint: "Ardından Ekle ile onaylayın",

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
    flowMenuLoading: "Yükleniyor…",
    flowMenuEmpty: "Menüde ürün yok",
    flowFoodAllTab: "Tümü",
    flowFoodSelectHint: "Siparişe eklemek için ürünlere dokunun",
    flowFoodQty: "Adet",
    flowFoodItemNote: "Not",
    flowFoodItemNotePlaceholder: "Alerji, pişirme tercihi…",
    flowFoodPlaceOrder: "Siparişi gönder",
    flowFoodItemsSelected: "{count} porsiyon",
    flowFoodLinesSelected: "{count} ürün seçildi",
    flowFoodNoItems: "En az bir ürün seçin",
    flowConfirmCategoryLabel: "Kategori",

    flowCatBreakfast: "Kahvaltı",
    flowCatBreakfastHint: "Serpme, omlet, tost",
    flowCatSoup: "Çorba",
    flowCatSoupHint: "Sıcak başlangıçlar",
    flowCatSalad: "Salata",
    flowCatSaladHint: "Taze salatalar",
    flowCatAppetizer: "Başlangıç",
    flowCatAppetizerHint: "Atıştırmalık başlangıçlar",
    flowCatLight: "Hafif Yemekler",
    flowCatLightHint: "Sandviç, çorba, salata",
    flowCatMain: "Ana Yemekler",
    flowCatMainHint: "Tavuk, balık, makarna",
    flowCatDessert: "Tatlı",
    flowCatDessertHint: "Tatlı seçenekler",
    flowCatSnack: "Atıştırmalık",
    flowCatSnackHint: "Hızlı atıştırmalıklar",
    flowCatDrinks: "İçecekler",
    flowCatDrinksHint: "Çay, kahve, meyve suyu",
    flowCatOther: "Diğer",
    flowCatOtherHint: "Diğer seçenekler",

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
    flowCareContinue: "Seçenekleri keşfet",
    flowCareConfirmDesc: "Açıklamamla onayla",
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

    conciergeLaundry: "Çamaşırhane",
    conciergeSpa: "Spa & Wellness",
    conciergeTaxi: "Taksi",
    conciergeSalon: "Salon",
    conciergeSheetTitle: "{service} rezervasyonu",
    conciergeSheetSubtitle: "Resepsiyon rezervasyonunuzu onaylayacak.",
    conciergeWhenLabel: "Ne zaman",
    conciergeWhenAsap: "En kısa sürede",
    conciergeWhenMorning: "Bu sabah",
    conciergeWhenAfternoon: "Bu öğleden sonra",
    conciergeWhenEvening: "Bu akşam",
    conciergeWhenTomorrow: "Yarın",
    conciergeNotesLabel: "Not (isteğe bağlı)",
    conciergeNotesPlaceholder: "ör. alım saati, tercih…",
    conciergeSubmit: "Resepsiyona gönder",
    conciergeSuccessToast: "Talebiniz gönderildi — resepsiyon kısa sürede onaylayacak.",
    conciergeSummary: "{service} · {when}",

    hotelConnectSection: "Otel",
    receptionLiveTitle: "Resepsiyon",
    receptionLiveSubtitle: "Resepsiyon ekibiyle canlı sohbet",
    receptionLiveBadge: "Canlı",
    receptionLiveCta: "Sohbeti aç",
    morePlusTitle: "More+",
    morePlusSubtitle: "Aktiviteler ve otel ekstraları",
    comingSoonTitle: "Çok yakında",
    comingSoonBody: "Sizin için yeni deneyimler hazırlıyoruz. Kısa süre içinde tekrar bakın.",
    comingSoonClose: "Tamam",

    atYourServiceHotelAbout: "Oteliniz",
    atYourServiceGuestProAbout: "Guest Pro",
    atYourServiceGuestProDesc: "Konaklamanız için AI concierge — istediğiniz zaman sorun.",
    atYourServiceWifi: "Wi‑Fi",
    atYourServiceEmergency: "Acil",
    feedbackSectionTitle: "Deneyiminizi paylaşın",
    feedbackRatingLabel: "Konaklamanızı değerlendirin",
    feedbackCommentPlaceholder: "Nelerden memnun kaldınız?",
    feedbackSubmit: "Geri bildirim gönder",
    complaintSectionTitle: "Şikayet ve öneriler",
    complaintPlaceholder: "Konaklamanızı nasıl iyileştirebiliriz?",
    complaintSubmit: "Mesaj gönder",
    feedbackSuccessToast: "Teşekkürler — geri bildiriminiz iletildi.",
    complaintSuccessToast: "Teşekkürler — mesajınız alındı.",
    feedbackSubmitting: "Gönderiliyor…",

    myRequestsTitle: "Taleplerim",
    myRequestsSubtitle: "Taleplerinizi takip edin",
    myRequestsEmpty: "Henüz talep yok",
    reqTypeGeneral: "Genel talep",
    reqDetailCategory: "Kategori",
    reqStatusOpen: "Açık",
    reqStatusInProgress: "İşlemde",
    reqStatusResolved: "Tamamlandı",
    myRequestsTabOpen: "Açık",
    myRequestsTabPreparing: "Hazırlanıyor",
    myRequestsTabCompleted: "Tamam",
    myRequestsActiveHint: "{n} aktif talep",
    myRequestsTapToView: "Taleplerinizi görmek için dokunun",
    fulfillmentStepReceived: "Alındı",
    fulfillmentStepKitchen: "Mutfakta",
    fulfillmentStepEnRoute: "Yolda",
    fulfillmentStepDone: "Teslim",
    fulfillmentEtaMinutes: "Tahmini ~{n} dk",
    reqDeleteLabel: "Kaldır",
    reqDeleteConfirm: "Sil?",
    reqDeletedToast: "Talep kaldırıldı",

    billSection: "Konaklamanız",
    billCardTitle: "Günün hesabı",
    billCardSubtitleToday: "Bugünkü harcamalarınızı görüntüleyin",
    billCardSubtitleAmount: "Bugün · {amount}",
    billSheetTitle: "Günlük hesap",
    billRoomLabel: "Oda {room}",
    billSubtotal: "Toplam",
    billRoomChargeNote: "Ücretler oda hesabınıza işlenir. Kesin fatura çıkışta verilir.",
    billEmptyTitle: "Henüz harcama yok",
    billEmptySubtitle: "Fiyatı tanımlı yemek siparişleri ve minibar hizmetleri burada listelenir.",
    billToday: "Bugün",
    billYesterday: "Dün",
    billClose: "Kapat",

    chatQuickFood: "Acıktım",
    chatQuickSupport: "Yardım lazım",
    chatQuickInfo: "Otel bilgisi",
    chatQuickActivity: "Sıkıldım",
    chatModeIntroFood: "Acıktım, bir şeyler sipariş etmek istiyorum.",
    chatModeIntroSupport: "Destek talebim var, yardımcı olur musunuz?",
    chatModeIntroCare: "Hizmet tercihlerimi paylaşmak istiyorum.",
    chatSummaryPrefixFood: "Yemek siparişi: ",
    chatSummaryPrefixSupport: "Destek talebi: ",
    chatSummaryPrefixCare: "Misafir tercihleri: ",
    chatSummaryFallback: "Rehberli sohbet tamamlandı.",
    chatCreateRequestCta: "Talebi oluştur ve personeli bildir",
    chatCreateRequestError: "Talep oluşturulurken bir hata oluştu.",
    chatActionTitle: "Talebi onayla",
    chatActionConfirm: "Personele ilet",
    chatActionDismiss: "Şimdi değil",
    chatRequestCreated: "Talebiniz iletildi — ekibimiz kısa sürede ilgilenecek.",
    receptionChatPrompt: "Resepsiyon ile görüşmek istiyorum",
    voiceStarting: "Başlatılıyor",
    voiceListening: "Dinliyorum",
    voiceThinking: "Düşünüyorum",
    voiceSpeaking: "Konuşuyorum",
    voiceTapInterrupt: "Durmak için dokun",
    voiceTapRetry: "Tekrar dene",
  },

  // ── Arabic ────────────────────────────────────────────────────────────────
  ar: {
    cancel: "إلغاء",
    navMenuTitle: "القائمة",
    navMenuOpen: "فتح القائمة",
    languageMenuLabel: "اللغة",
    languageSheetTitle: "اختر اللغة",
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
    voiceSendToChat: "إرسال إلى المحادثة",

    askSomethingLabel: "اسأل كتابةً",
    askSomethingTitle: "اسأل عن أي شيء",
    askSomethingSubtitle: "كل شيء عن إقامتك",

    staySection: "إقامتك",
    stayAboutTitle: "حول إقامتك",
    guestKeyLabel: "مفتاح الضيف",
    stayWifiTitle: "Wi-Fi",
    stayWifiFloor: "الطابق {floor}",
    stayWifiNetwork: "الشبكة",
    stayWifiPasswordLabel: "كلمة المرور",
    stayWifiCopy: "نسخ",
    stayWifiCopied: "تم النسخ",
    copyKey: "نسخ",
    keyCopied: "تم النسخ",
    noActiveKey: "لا يوجد مفتاح نشط",
    stayActive: "الإقامة نشطة",
    chatLink: "محادثة",
    nearbyTapHint: "اضغط للتفاصيل واتجاهات المشي",
    nearbySearchPlaceholder: "ابحث عن أماكن…",
    nearbyFilterAll: "الكل",
    nearbyViewAll: "عرض كل الأماكن ({count})",
    nearbyNoResults: "لا توجد نتائج",
    nearbyBackToList: "جميع الأماكن",
    nearbyNearestTitle: "أقرب الأماكن",
    nearbyMapLoading: "جاري تحميل الخريطة…",
    nearbyMapUnavailable: "معاينة الخريطة غير متاحة",
    nearbyLocationHint: "فعّل الموقع لرؤية المسافات منك",
    nearbyEmptyPlaces: "لم يتم تعريف أماكن قريبة بعد",
    nearbyHotelLabel: "الفندق",
    nearbyLoadFailed: "تعذّر تحميل الأماكن القريبة",
    nearbyRetry: "إعادة المحاولة",
    nearbySection: "بالقرب",

    quickActionsSection: "الإجراءات السريعة",
    quickActionsOthersSection: "أخرى",
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
    aiCapacityTitle: "سعة الدردشة الذكية ممتلئة اليوم",
    aiCapacityHint: "اختر إجراءً سريعاً أدناه — سيساعدك فريقنا فوراً.",

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
    iosStep1Title: "اضغط على ⋯",
    iosStep1Hint: "أسفل Safari (ثلاث نقاط)",
    iosStep2Title: "اضغط مشاركة",
    iosStep2Hint: "من القائمة",
    iosStep3Title: "اضغط عرض المزيد",
    iosStep3Hint: "مرر للأسفل إن لزم",
    iosStep4Title: "اضغط إضافة إلى الشاشة الرئيسية",
    iosStep4Hint: "ثم اضغط إضافة للتأكيد",

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
    flowMenuLoading: "جارٍ التحميل…",
    flowMenuEmpty: "لا توجد أصناف في القائمة",
    flowFoodAllTab: "الكل",
    flowFoodSelectHint: "اضغط على الأصناف لإضافتها",
    flowFoodQty: "الكمية",
    flowFoodItemNote: "ملاحظة",
    flowFoodItemNotePlaceholder: "حساسية، تفضيلات…",
    flowFoodPlaceOrder: "إرسال الطلب",
    flowFoodItemsSelected: "{count} حصص",
    flowFoodLinesSelected: "{count} أطباق",
    flowFoodNoItems: "اختر صنفاً واحداً على الأقل",
    flowConfirmCategoryLabel: "الفئة",

    flowCatBreakfast: "فطور",
    flowCatBreakfastHint: "مشكل، أومليت، توست",
    flowCatSoup: "شوربة",
    flowCatSoupHint: "شوربات وبدايات دافئة",
    flowCatSalad: "سلطة",
    flowCatSaladHint: "سلطات طازجة",
    flowCatAppetizer: "مقبلات",
    flowCatAppetizerHint: "بدايات وأطباق صغيرة",
    flowCatLight: "وجبات خفيفة",
    flowCatLightHint: "ساندويش، حساء، سلطة",
    flowCatMain: "الأطباق الرئيسية",
    flowCatMainHint: "دجاج، سمك، معكرونة",
    flowCatDessert: "حلويات",
    flowCatDessertHint: "حلويات ومقبلات حلوة",
    flowCatSnack: "وجبات خفيفة",
    flowCatSnackHint: "لقيمات سريعة",
    flowCatDrinks: "مشروبات",
    flowCatDrinksHint: "شاي، قهوة، عصير",
    flowCatOther: "أخرى",
    flowCatOtherHint: "خيارات أخرى",

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
    flowCareContinue: "تابع استكشاف الخيارات",
    flowCareConfirmDesc: "تأكيد بوصفي",
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

    conciergeLaundry: "غسيل",
    conciergeSpa: "سبا وعافية",
    conciergeTaxi: "تاكسي",
    conciergeSalon: "صالون",
    conciergeSheetTitle: "حجز {service}",
    conciergeSheetSubtitle: "سيؤكد الاستقبال حجزك.",
    conciergeWhenLabel: "متى",
    conciergeWhenAsap: "في أقرب وقت",
    conciergeWhenMorning: "هذا الصباح",
    conciergeWhenAfternoon: "بعد الظهر",
    conciergeWhenEvening: "هذا المساء",
    conciergeWhenTomorrow: "غداً",
    conciergeNotesLabel: "ملاحظات (اختياري)",
    conciergeNotesPlaceholder: "مثلاً وقت الاستلام…",
    conciergeSubmit: "إرسال للاستقبال",
    conciergeSuccessToast: "تم إرسال الطلب — سيؤكد الاستقبال قريباً.",
    conciergeSummary: "{service} · {when}",

    hotelConnectSection: "الفندق",
    receptionLiveTitle: "الاستقبال",
    receptionLiveSubtitle: "تحدث مباشرة مع فريق الاستقبال",
    receptionLiveBadge: "مباشر",
    receptionLiveCta: "فتح المحادثة",
    morePlusTitle: "More+",
    morePlusSubtitle: "الأنشطة وخدمات إضافية",
    comingSoonTitle: "قريباً",
    comingSoonBody: "نُعد تجارب جديدة لك. عد قريباً.",
    comingSoonClose: "حسناً",

    atYourServiceHotelAbout: "فندقك",
    atYourServiceGuestProAbout: "Guest Pro",
    atYourServiceGuestProDesc: "كونسيرج ذكي لإقامتك — اسأل في أي وقت.",
    atYourServiceWifi: "واي فاي",
    atYourServiceEmergency: "طوارئ",
    feedbackSectionTitle: "شارك تجربتك",
    feedbackRatingLabel: "قيّم إقامتك",
    feedbackCommentPlaceholder: "أخبرنا بما أعجبك…",
    feedbackSubmit: "إرسال التقييم",
    complaintSectionTitle: "شكاوى واقتراحات",
    complaintPlaceholder: "كيف نُحسّن إقامتك؟",
    complaintSubmit: "إرسال الرسالة",
    feedbackSuccessToast: "شكراً — تم إرسال ملاحظاتك.",
    complaintSuccessToast: "شكراً — استلمنا رسالتك.",
    feedbackSubmitting: "جارٍ الإرسال…",

    myRequestsTitle: "طلباتي",
    myRequestsSubtitle: "تتبع طلبات الخدمة",
    myRequestsEmpty: "لا توجد طلبات بعد",
    reqTypeGeneral: "طلب عام",
    reqDetailCategory: "الفئة",
    reqStatusOpen: "مفتوح",
    reqStatusInProgress: "قيد التنفيذ",
    reqStatusResolved: "مكتمل",
    myRequestsTabOpen: "مفتوح",
    myRequestsTabPreparing: "قيد التحضير",
    myRequestsTabCompleted: "منتهي",
    myRequestsActiveHint: "{n} طلب نشط",
    myRequestsTapToView: "اضغط لعرض طلباتك",
    fulfillmentStepReceived: "تم الاستلام",
    fulfillmentStepKitchen: "في المطبخ",
    fulfillmentStepEnRoute: "في الطريق",
    fulfillmentStepDone: "تم التسليم",
    fulfillmentEtaMinutes: "تقريباً ~{n} د",
    reqDeleteLabel: "إزالة",
    reqDeleteConfirm: "حذف؟",
    reqDeletedToast: "تمت إزالة الطلب",

    billSection: "إقامتك",
    billCardTitle: "فاتورة اليوم",
    billCardSubtitleToday: "اضغط لعرض مصروفات اليوم",
    billCardSubtitleAmount: "اليوم · {amount}",
    billSheetTitle: "الفاتورة اليومية",
    billRoomLabel: "غرفة {room}",
    billSubtotal: "المجموع",
    billRoomChargeNote: "تُضاف الرسوم إلى حساب غرفتك. الفاتورة النهائية عند المغادرة.",
    billEmptyTitle: "لا مصروفات بعد",
    billEmptySubtitle: "ستظهر هنا طلبات الطعام وخدمات الميني بار ذات السعر المحدد.",
    billToday: "اليوم",
    billYesterday: "أمس",
    billClose: "إغلاق",

    chatQuickFood: "أنا جائع",
    chatQuickSupport: "أحتاج مساعدة",
    chatQuickInfo: "معلومات الفندق",
    chatQuickActivity: "أشعر بالملل",
    chatModeIntroFood: "أنا جائع وأريد طلب شيء للأكل.",
    chatModeIntroSupport: "لدي طلب دعم — هل يمكنك المساعدة؟",
    chatModeIntroCare: "أود مشاركة تفضيلات إقامتي.",
    chatSummaryPrefixFood: "طلب طعام: ",
    chatSummaryPrefixSupport: "طلب دعم: ",
    chatSummaryPrefixCare: "تفضيلات الضيف: ",
    chatSummaryFallback: "اكتملت المحادثة الموجهة.",
    chatCreateRequestCta: "إنشاء الطلب وإبلاغ الفريق",
    chatCreateRequestError: "تعذر إنشاء الطلب. يرجى المحاولة مرة أخرى.",
    chatActionTitle: "تأكيد الطلب",
    chatActionConfirm: "إرسال للطاقم",
    chatActionDismiss: "ليس الآن",
    chatRequestCreated: "تم إرسال طلبك — سيتولى الفريق الأمر قريبًا.",
    receptionChatPrompt: "أود التحدث مع الاستقبال",
    voiceStarting: "جاري البدء",
    voiceListening: "أستمع",
    voiceThinking: "أفكر",
    voiceSpeaking: "أتحدث",
    voiceTapInterrupt: "اضغط للمقاطعة",
    voiceTapRetry: "اضغط للمحاولة",
  },

  // ── Russian ───────────────────────────────────────────────────────────────
  ru: {
    cancel: "Отмена",
    navMenuTitle: "Меню",
    navMenuOpen: "Открыть меню",
    languageMenuLabel: "Язык",
    languageSheetTitle: "Выберите язык",
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
    voiceSendToChat: "Отправить в чат",

    askSomethingLabel: "Спросить текстом",
    askSomethingTitle: "Задать вопрос",
    askSomethingSubtitle: "Всё о вашем пребывании",

    staySection: "Ваше пребывание",
    stayAboutTitle: "О вашем проживании",
    guestKeyLabel: "Ключ гостя",
    stayWifiTitle: "Wi-Fi",
    stayWifiFloor: "Этаж {floor}",
    stayWifiNetwork: "Сеть",
    stayWifiPasswordLabel: "Пароль",
    stayWifiCopy: "Копировать",
    stayWifiCopied: "Скопировано",
    copyKey: "Копировать",
    keyCopied: "Скопировано",
    noActiveKey: "Активный ключ не найден",
    stayActive: "Проживание активно",
    chatLink: "Чат",
    nearbyTapHint: "Нажмите для деталей и маршрута",
    nearbySearchPlaceholder: "Поиск мест…",
    nearbyFilterAll: "Все",
    nearbyViewAll: "Все места ({count})",
    nearbyNoResults: "Ничего не найдено",
    nearbyBackToList: "Все места",
    nearbyNearestTitle: "Ближайшие",
    nearbyMapLoading: "Загрузка карты…",
    nearbyMapUnavailable: "Карта недоступна",
    nearbyLocationHint: "Разрешите геолокацию для расстояний",
    nearbyEmptyPlaces: "Ближайшие места ещё не настроены",
    nearbyHotelLabel: "Отель",
    nearbyLoadFailed: "Не удалось загрузить места рядом",
    nearbyRetry: "Повторить",
    nearbySection: "Рядом",

    quickActionsSection: "Быстрые действия",
    quickActionsOthersSection: "Другое",
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
    aiCapacityTitle: "Лимит ИИ-чата на сегодня исчерпан",
    aiCapacityHint: "Выберите быстрое действие ниже — команда поможет сразу.",

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
    iosStep1Title: "Нажмите ⋯",
    iosStep1Hint: "Внизу Safari (три точки)",
    iosStep2Title: "Нажмите «Поделиться»",
    iosStep2Hint: "В открывшемся меню",
    iosStep3Title: "Нажмите «Ещё»",
    iosStep3Hint: "Прокрутите вниз при необходимости",
    iosStep4Title: "«На экран Домой»",
    iosStep4Hint: "Затем нажмите «Добавить»",

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
    flowMenuLoading: "Загрузка…",
    flowMenuEmpty: "В меню нет блюд",
    flowFoodAllTab: "Все",
    flowFoodSelectHint: "Нажмите на блюда для заказа",
    flowFoodQty: "Кол-во",
    flowFoodItemNote: "Примечание",
    flowFoodItemNotePlaceholder: "Аллергии, пожелания…",
    flowFoodPlaceOrder: "Отправить заказ",
    flowFoodItemsSelected: "{count} порций",
    flowFoodLinesSelected: "{count} блюд",
    flowFoodNoItems: "Выберите хотя бы одно блюдо",
    flowConfirmCategoryLabel: "Категория",

    flowCatBreakfast: "Завтрак",
    flowCatBreakfastHint: "Ассорти, омлет, тост",
    flowCatSoup: "Супы",
    flowCatSoupHint: "Супы и горячие закуски",
    flowCatSalad: "Салаты",
    flowCatSaladHint: "Свежие салаты",
    flowCatAppetizer: "Закуски",
    flowCatAppetizerHint: "Стартеры и маленькие блюда",
    flowCatLight: "Лёгкие блюда",
    flowCatLightHint: "Сэндвичи, суп, салаты",
    flowCatMain: "Основные блюда",
    flowCatMainHint: "Курица, рыба, паста",
    flowCatDessert: "Десерты",
    flowCatDessertHint: "Сладкое",
    flowCatSnack: "Перекусы",
    flowCatSnackHint: "Быстрые закуски",
    flowCatDrinks: "Напитки",
    flowCatDrinksHint: "Чай, кофе, сок",
    flowCatOther: "Другое",
    flowCatOtherHint: "Другие варианты",

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
    flowCareContinue: "Продолжить выбор",
    flowCareConfirmDesc: "Подтвердить моим описанием",
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

    conciergeLaundry: "Прачечная",
    conciergeSpa: "Спа и wellness",
    conciergeTaxi: "Такси",
    conciergeSalon: "Салон",
    conciergeSheetTitle: "Бронирование: {service}",
    conciergeSheetSubtitle: "Ресепшен подтвердит бронь.",
    conciergeWhenLabel: "Когда",
    conciergeWhenAsap: "Как можно скорее",
    conciergeWhenMorning: "Сегодня утром",
    conciergeWhenAfternoon: "Сегодня днём",
    conciergeWhenEvening: "Сегодня вечером",
    conciergeWhenTomorrow: "Завтра",
    conciergeNotesLabel: "Заметки (необяз.)",
    conciergeNotesPlaceholder: "напр. время, пожелания…",
    conciergeSubmit: "Отправить на ресепшен",
    conciergeSuccessToast: "Запрос отправлен — ресепшен скоро подтвердит.",
    conciergeSummary: "{service} · {when}",

    hotelConnectSection: "Отель",
    receptionLiveTitle: "Ресепшн",
    receptionLiveSubtitle: "Живой чат с командой ресепшн",
    receptionLiveBadge: "Онлайн",
    receptionLiveCta: "Открыть чат",
    morePlusTitle: "More+",
    morePlusSubtitle: "Активности и доп. услуги",
    comingSoonTitle: "Скоро",
    comingSoonBody: "Мы готовим новые возможности. Загляните позже.",
    comingSoonClose: "Понятно",

    atYourServiceHotelAbout: "Ваш отель",
    atYourServiceGuestProAbout: "Guest Pro",
    atYourServiceGuestProDesc: "AI-консьерж для проживания — спрашивайте в любое время.",
    atYourServiceWifi: "Wi‑Fi",
    atYourServiceEmergency: "Экстренно",
    feedbackSectionTitle: "Поделитесь впечатлениями",
    feedbackRatingLabel: "Оцените проживание",
    feedbackCommentPlaceholder: "Что вам понравилось…",
    feedbackSubmit: "Отправить отзыв",
    complaintSectionTitle: "Жалобы и предложения",
    complaintPlaceholder: "Как улучшить ваше пребывание?",
    complaintSubmit: "Отправить",
    feedbackSuccessToast: "Спасибо — отзыв отправлен.",
    complaintSuccessToast: "Спасибо — сообщение получено.",
    feedbackSubmitting: "Отправка…",

    myRequestsTitle: "Мои запросы",
    myRequestsSubtitle: "Отслеживайте свои запросы",
    myRequestsEmpty: "Запросов пока нет",
    reqTypeGeneral: "Общий запрос",
    reqDetailCategory: "Категория",
    reqStatusOpen: "Открыт",
    reqStatusInProgress: "В работе",
    reqStatusResolved: "Выполнен",
    myRequestsTabOpen: "Открыт",
    myRequestsTabPreparing: "Готовится",
    myRequestsTabCompleted: "Готово",
    myRequestsActiveHint: "{n} активных",
    myRequestsTapToView: "Нажмите, чтобы открыть",
    fulfillmentStepReceived: "Принят",
    fulfillmentStepKitchen: "На кухне",
    fulfillmentStepEnRoute: "В пути",
    fulfillmentStepDone: "Доставлен",
    fulfillmentEtaMinutes: "Около ~{n} мин",
    reqDeleteLabel: "Удалить",
    reqDeleteConfirm: "Удалить?",
    reqDeletedToast: "Запрос удалён",

    billSection: "Ваше пребывание",
    billCardTitle: "Счёт за сегодня",
    billCardSubtitleToday: "Нажмите, чтобы увидеть расходы за день",
    billCardSubtitleAmount: "Сегодня · {amount}",
    billSheetTitle: "Дневной счёт",
    billRoomLabel: "Номер {room}",
    billSubtotal: "Итого",
    billRoomChargeNote: "Списания идут на счёт номера. Окончательный счёт при выезде.",
    billEmptyTitle: "Расходов пока нет",
    billEmptySubtitle: "Здесь появятся заказы еды и мини-бар с указанной ценой.",
    billToday: "Сегодня",
    billYesterday: "Вчера",
    billClose: "Закрыть",

    chatQuickFood: "Я голоден",
    chatQuickSupport: "Нужна помощь",
    chatQuickInfo: "Информация об отеле",
    chatQuickActivity: "Мне скучно",
    chatModeIntroFood: "Я голоден и хочу что-нибудь заказать.",
    chatModeIntroSupport: "У меня запрос в поддержку — можете помочь?",
    chatModeIntroCare: "Хочу поделиться предпочтениями по проживанию.",
    chatSummaryPrefixFood: "Заказ еды: ",
    chatSummaryPrefixSupport: "Запрос в поддержку: ",
    chatSummaryPrefixCare: "Предпочтения гостя: ",
    chatSummaryFallback: "Направленный чат завершён.",
    chatCreateRequestCta: "Создать запрос и уведомить персонал",
    chatCreateRequestError: "Не удалось создать запрос. Попробуйте снова.",
    chatActionTitle: "Подтвердить запрос",
    chatActionConfirm: "Отправить персоналу",
    chatActionDismiss: "Не сейчас",
    chatRequestCreated: "Запрос отправлен — команда скоро поможет.",
    receptionChatPrompt: "Хочу связаться с ресепшеном",
    voiceStarting: "Запуск",
    voiceListening: "Слушаю",
    voiceThinking: "Думаю",
    voiceSpeaking: "Говорю",
    voiceTapInterrupt: "Нажмите, чтобы прервать",
    voiceTapRetry: "Повторить",
  },

  // ── German ────────────────────────────────────────────────────────────────
  de: {
    cancel: "Abbrechen",
    navMenuTitle: "Menü",
    navMenuOpen: "Menü öffnen",
    languageMenuLabel: "Sprache",
    languageSheetTitle: "Sprache wählen",
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
    voiceSendToChat: "An Chat senden",

    askSomethingLabel: "Per Text fragen",
    askSomethingTitle: "Etwas fragen",
    askSomethingSubtitle: "Alles über Ihren Aufenthalt",

    staySection: "Ihr Aufenthalt",
    stayAboutTitle: "Über Ihren Aufenthalt",
    guestKeyLabel: "Gastschlüssel",
    stayWifiTitle: "Wi-Fi",
    stayWifiFloor: "Etage {floor}",
    stayWifiNetwork: "Netzwerk",
    stayWifiPasswordLabel: "Passwort",
    stayWifiCopy: "Kopieren",
    stayWifiCopied: "Kopiert",
    copyKey: "Kopieren",
    keyCopied: "Kopiert",
    noActiveKey: "Kein aktiver Schlüssel",
    stayActive: "Aufenthalt aktiv",
    chatLink: "Chat",
    nearbyTapHint: "Tippen für Details und Wegbeschreibung",
    nearbySearchPlaceholder: "Orte suchen…",
    nearbyFilterAll: "Alle",
    nearbyViewAll: "Alle {count} Orte",
    nearbyNoResults: "Keine Treffer",
    nearbyBackToList: "Alle Orte",
    nearbyNearestTitle: "In der Nähe finden",
    nearbyMapLoading: "Karte wird geladen…",
    nearbyMapUnavailable: "Kartenvorschau nicht verfügbar",
    nearbyLocationHint: "Standort aktivieren für Entfernungen",
    nearbyEmptyPlaces: "Noch keine Orte in der Nähe hinterlegt",
    nearbyHotelLabel: "Hotel",
    nearbyLoadFailed: "Orte in der Nähe konnten nicht geladen werden",
    nearbyRetry: "Erneut versuchen",
    nearbySection: "In der Nähe",

    quickActionsSection: "Schnellaktionen",
    quickActionsOthersSection: "Sonstiges",
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
    aiCapacityTitle: "KI-Chat-Kapazität für heute erschöpft",
    aiCapacityHint: "Wählen Sie unten eine Schnellaktion — unser Team hilft sofort.",

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
    iosStep1Title: "Tippen Sie auf ⋯",
    iosStep1Hint: "Unten in Safari (drei Punkte)",
    iosStep2Title: "Tippen Sie auf Teilen",
    iosStep2Hint: "Im geöffneten Menü",
    iosStep3Title: "Tippen Sie auf Mehr anzeigen",
    iosStep3Hint: "Ggf. im Teilen-Blatt nach unten scrollen",
    iosStep4Title: "Zum Home-Bildschirm",
    iosStep4Hint: "Dann auf Hinzufügen tippen",

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
    flowMenuLoading: "Wird geladen…",
    flowMenuEmpty: "Keine Gerichte auf der Karte",
    flowFoodAllTab: "Alle",
    flowFoodSelectHint: "Tippen Sie auf Gerichte zum Bestellen",
    flowFoodQty: "Menge",
    flowFoodItemNote: "Notiz",
    flowFoodItemNotePlaceholder: "Allergien, Wünsche…",
    flowFoodPlaceOrder: "Bestellung senden",
    flowFoodItemsSelected: "{count} Portionen",
    flowFoodLinesSelected: "{count} Gerichte",
    flowFoodNoItems: "Mindestens ein Gericht wählen",
    flowConfirmCategoryLabel: "Kategorie",

    flowCatBreakfast: "Frühstück",
    flowCatBreakfastHint: "Büfett, Omelett, Toast",
    flowCatSoup: "Suppe",
    flowCatSoupHint: "Suppen und warme Vorspeisen",
    flowCatSalad: "Salat",
    flowCatSaladHint: "Frische Salate",
    flowCatAppetizer: "Vorspeisen",
    flowCatAppetizerHint: "Starter und kleine Teller",
    flowCatLight: "Leichte Mahlzeiten",
    flowCatLightHint: "Sandwiches, Suppe, Salate",
    flowCatMain: "Hauptgerichte",
    flowCatMainHint: "Hähnchen, Fisch, Pasta",
    flowCatDessert: "Dessert",
    flowCatDessertHint: "Süßes",
    flowCatSnack: "Snacks",
    flowCatSnackHint: "Kleine Happen",
    flowCatDrinks: "Getränke",
    flowCatDrinksHint: "Tee, Kaffee, Saft",
    flowCatOther: "Sonstiges",
    flowCatOtherHint: "Weitere Optionen",

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
    flowCareContinue: "Optionen erkunden",
    flowCareConfirmDesc: "Mit meiner Beschreibung bestätigen",
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

    conciergeLaundry: "Wäscherei",
    conciergeSpa: "Spa & Wellness",
    conciergeTaxi: "Taxi",
    conciergeSalon: "Salon",
    conciergeSheetTitle: "{service} Buchung",
    conciergeSheetSubtitle: "Die Rezeption bestätigt Ihre Reservierung.",
    conciergeWhenLabel: "Wann",
    conciergeWhenAsap: "So schnell wie möglich",
    conciergeWhenMorning: "Heute Morgen",
    conciergeWhenAfternoon: "Heute Nachmittag",
    conciergeWhenEvening: "Heute Abend",
    conciergeWhenTomorrow: "Morgen",
    conciergeNotesLabel: "Notizen (optional)",
    conciergeNotesPlaceholder: "z. B. Abholzeit…",
    conciergeSubmit: "An Rezeption senden",
    conciergeSuccessToast: "Anfrage gesendet — die Rezeption bestätigt in Kürze.",
    conciergeSummary: "{service} · {when}",

    hotelConnectSection: "Hotel",
    receptionLiveTitle: "Rezeption",
    receptionLiveSubtitle: "Live-Chat mit unserem Rezeptionsteam",
    receptionLiveBadge: "Live",
    receptionLiveCta: "Chat öffnen",
    morePlusTitle: "More+",
    morePlusSubtitle: "Aktivitäten & Extras",
    comingSoonTitle: "Demnächst",
    comingSoonBody: "Neue Erlebnisse sind in Vorbereitung. Schauen Sie bald wieder vorbei.",
    comingSoonClose: "Verstanden",

    atYourServiceHotelAbout: "Ihr Hotel",
    atYourServiceGuestProAbout: "Guest Pro",
    atYourServiceGuestProDesc: "KI-Concierge für Ihren Aufenthalt — jederzeit fragen.",
    atYourServiceWifi: "WLAN",
    atYourServiceEmergency: "Notfall",
    feedbackSectionTitle: "Teilen Sie Ihre Erfahrung",
    feedbackRatingLabel: "Aufenthalt bewerten",
    feedbackCommentPlaceholder: "Was hat Ihnen gefallen…",
    feedbackSubmit: "Feedback senden",
    complaintSectionTitle: "Beschwerden & Vorschläge",
    complaintPlaceholder: "Wie können wir verbessern?",
    complaintSubmit: "Nachricht senden",
    feedbackSuccessToast: "Danke — Feedback gesendet.",
    complaintSuccessToast: "Danke — Nachricht erhalten.",
    feedbackSubmitting: "Wird gesendet…",

    myRequestsTitle: "Meine Anfragen",
    myRequestsSubtitle: "Ihre Serviceanfragen verfolgen",
    myRequestsEmpty: "Noch keine Anfragen",
    reqTypeGeneral: "Allgemeine Anfrage",
    reqDetailCategory: "Kategorie",
    reqStatusOpen: "Offen",
    reqStatusInProgress: "In Bearbeitung",
    reqStatusResolved: "Abgeschlossen",
    myRequestsTabOpen: "Offen",
    myRequestsTabPreparing: "In Arbeit",
    myRequestsTabCompleted: "Fertig",
    myRequestsActiveHint: "{n} aktiv",
    myRequestsTapToView: "Tippen zum Anzeigen",
    fulfillmentStepReceived: "Eingegangen",
    fulfillmentStepKitchen: "Küche",
    fulfillmentStepEnRoute: "Unterwegs",
    fulfillmentStepDone: "Geliefert",
    fulfillmentEtaMinutes: "Ca. ~{n} Min",
    reqDeleteLabel: "Entfernen",
    reqDeleteConfirm: "Löschen?",
    reqDeletedToast: "Anfrage entfernt",

    billSection: "Ihr Aufenthalt",
    billCardTitle: "Tagesrechnung",
    billCardSubtitleToday: "Tippen für die heutigen Kosten",
    billCardSubtitleAmount: "Heute · {amount}",
    billSheetTitle: "Tagesrechnung",
    billRoomLabel: "Zimmer {room}",
    billSubtotal: "Gesamt",
    billRoomChargeNote: "Gebühren werden dem Zimmerkonto belastet. Endrechnung bei Abreise.",
    billEmptyTitle: "Noch keine Kosten",
    billEmptySubtitle: "Essensbestellungen und Minibar mit Preis erscheinen hier.",
    billToday: "Heute",
    billYesterday: "Gestern",
    billClose: "Schließen",

    chatQuickFood: "Ich habe Hunger",
    chatQuickSupport: "Ich brauche Hilfe",
    chatQuickInfo: "Hotelinfo",
    chatQuickActivity: "Mir ist langweilig",
    chatModeIntroFood: "Ich habe Hunger und möchte etwas bestellen.",
    chatModeIntroSupport: "Ich habe eine Support-Anfrage — können Sie helfen?",
    chatModeIntroCare: "Ich möchte meine Aufenthaltspräferenzen mitteilen.",
    chatSummaryPrefixFood: "Essensbestellung: ",
    chatSummaryPrefixSupport: "Support-Anfrage: ",
    chatSummaryPrefixCare: "Gastpräferenzen: ",
    chatSummaryFallback: "Geführtes Gespräch abgeschlossen.",
    chatCreateRequestCta: "Anfrage erstellen & Team benachrichtigen",
    chatCreateRequestError: "Anfrage konnte nicht erstellt werden. Bitte erneut versuchen.",
    chatActionTitle: "Anfrage bestätigen",
    chatActionConfirm: "An Team senden",
    chatActionDismiss: "Nicht jetzt",
    chatRequestCreated: "Anfrage gesendet — unser Team kümmert sich bald.",
    receptionChatPrompt: "Ich möchte mit der Rezeption sprechen",
    voiceStarting: "Start",
    voiceListening: "Höre zu",
    voiceThinking: "Denke nach",
    voiceSpeaking: "Spreche",
    voiceTapInterrupt: "Tippen zum Unterbrechen",
    voiceTapRetry: "Erneut versuchen",
  },

  // ── French ────────────────────────────────────────────────────────────────
  fr: {
    cancel: "Annuler",
    navMenuTitle: "Menu",
    navMenuOpen: "Ouvrir le menu",
    languageMenuLabel: "Langue",
    languageSheetTitle: "Choisir la langue",
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
    voiceSendToChat: "Envoyer au chat",

    askSomethingLabel: "Demander par écrit",
    askSomethingTitle: "Poser une question",
    askSomethingSubtitle: "Tout sur votre séjour",

    staySection: "Votre séjour",
    stayAboutTitle: "À propos de votre séjour",
    guestKeyLabel: "Clé invité",
    stayWifiTitle: "Wi-Fi",
    stayWifiFloor: "Étage {floor}",
    stayWifiNetwork: "Réseau",
    stayWifiPasswordLabel: "Mot de passe",
    stayWifiCopy: "Copier",
    stayWifiCopied: "Copié",
    copyKey: "Copier",
    keyCopied: "Copié",
    noActiveKey: "Aucune clé active",
    stayActive: "Séjour actif",
    chatLink: "Chat",
    nearbyTapHint: "Appuyez pour les détails et l'itinéraire",
    nearbySearchPlaceholder: "Rechercher…",
    nearbyFilterAll: "Tout",
    nearbyViewAll: "Voir les {count} lieux",
    nearbyNoResults: "Aucun résultat",
    nearbyBackToList: "Tous les lieux",
    nearbyNearestTitle: "Trouver le plus proche",
    nearbyMapLoading: "Chargement de la carte…",
    nearbyMapUnavailable: "Aperçu carte indisponible",
    nearbyLocationHint: "Activez la localisation pour les distances",
    nearbyEmptyPlaces: "Aucun lieu à proximité configuré",
    nearbyHotelLabel: "Hôtel",
    nearbyLoadFailed: "Impossible de charger les lieux à proximité",
    nearbyRetry: "Réessayer",
    nearbySection: "À proximité",

    quickActionsSection: "Actions rapides",
    quickActionsOthersSection: "Autres",
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
    aiCapacityTitle: "Capacité du chat IA atteinte pour aujourd'hui",
    aiCapacityHint: "Choisissez une action rapide ci-dessous — notre équipe vous aide tout de suite.",

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
    iosStep1Title: "Appuyez sur ⋯",
    iosStep1Hint: "En bas de Safari (trois points)",
    iosStep2Title: "Appuyez sur Partager",
    iosStep2Hint: "Dans le menu",
    iosStep3Title: "Appuyez sur Voir plus",
    iosStep3Hint: "Faites défiler si besoin",
    iosStep4Title: "Sur l'écran d'accueil",
    iosStep4Hint: "Puis appuyez sur Ajouter",

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
    flowMenuLoading: "Chargement…",
    flowMenuEmpty: "Aucun plat au menu",
    flowFoodAllTab: "Tout",
    flowFoodSelectHint: "Appuyez sur les plats à commander",
    flowFoodQty: "Quantité",
    flowFoodItemNote: "Note",
    flowFoodItemNotePlaceholder: "Allergies, préférences…",
    flowFoodPlaceOrder: "Envoyer la commande",
    flowFoodItemsSelected: "{count} portions",
    flowFoodLinesSelected: "{count} plats",
    flowFoodNoItems: "Sélectionnez au moins un plat",
    flowConfirmCategoryLabel: "Catégorie",

    flowCatBreakfast: "Petit-déjeuner",
    flowCatBreakfastHint: "Buffet, omelette, toast",
    flowCatSoup: "Soupe",
    flowCatSoupHint: "Soupes et entrées chaudes",
    flowCatSalad: "Salade",
    flowCatSaladHint: "Salades fraîches",
    flowCatAppetizer: "Entrées",
    flowCatAppetizerHint: "Petites assiettes",
    flowCatLight: "Plats légers",
    flowCatLightHint: "Sandwichs, soupe, salades",
    flowCatMain: "Plats principaux",
    flowCatMainHint: "Poulet, poisson, pâtes",
    flowCatDessert: "Dessert",
    flowCatDessertHint: "Douceurs",
    flowCatSnack: "Snacks",
    flowCatSnackHint: "Petites bouchées",
    flowCatDrinks: "Boissons",
    flowCatDrinksHint: "Thé, café, jus",
    flowCatOther: "Autres",
    flowCatOtherHint: "Plus d'options",

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
    flowCareContinue: "Explorer les options",
    flowCareConfirmDesc: "Confirmer avec ma description",
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

    conciergeLaundry: "Blanchisserie",
    conciergeSpa: "Spa & bien-être",
    conciergeTaxi: "Taxi",
    conciergeSalon: "Salon",
    conciergeSheetTitle: "Réservation {service}",
    conciergeSheetSubtitle: "La réception confirmera votre réservation.",
    conciergeWhenLabel: "Quand",
    conciergeWhenAsap: "Dès que possible",
    conciergeWhenMorning: "Ce matin",
    conciergeWhenAfternoon: "Cet après-midi",
    conciergeWhenEvening: "Ce soir",
    conciergeWhenTomorrow: "Demain",
    conciergeNotesLabel: "Notes (optionnel)",
    conciergeNotesPlaceholder: "ex. heure de prise en charge…",
    conciergeSubmit: "Envoyer à la réception",
    conciergeSuccessToast: "Demande envoyée — la réception confirmera bientôt.",
    conciergeSummary: "{service} · {when}",

    hotelConnectSection: "Hôtel",
    receptionLiveTitle: "Réception",
    receptionLiveSubtitle: "Chat en direct avec la réception",
    receptionLiveBadge: "En direct",
    receptionLiveCta: "Ouvrir le chat",
    morePlusTitle: "More+",
    morePlusSubtitle: "Activités et extras",
    comingSoonTitle: "Bientôt",
    comingSoonBody: "De nouvelles expériences arrivent. Revenez bientôt.",
    comingSoonClose: "Compris",

    atYourServiceHotelAbout: "Votre hôtel",
    atYourServiceGuestProAbout: "Guest Pro",
    atYourServiceGuestProDesc: "Concierge IA pour votre séjour — demandez à tout moment.",
    atYourServiceWifi: "Wi‑Fi",
    atYourServiceEmergency: "Urgence",
    feedbackSectionTitle: "Partagez votre expérience",
    feedbackRatingLabel: "Notez votre séjour",
    feedbackCommentPlaceholder: "Ce que vous avez apprécié…",
    feedbackSubmit: "Envoyer l'avis",
    complaintSectionTitle: "Réclamations et suggestions",
    complaintPlaceholder: "Comment améiorer votre séjour ?",
    complaintSubmit: "Envoyer",
    feedbackSuccessToast: "Merci — avis envoyé.",
    complaintSuccessToast: "Merci — message reçu.",
    feedbackSubmitting: "Envoi…",

    myRequestsTitle: "Mes demandes",
    myRequestsSubtitle: "Suivez vos demandes de service",
    myRequestsEmpty: "Aucune demande pour l'instant",
    reqTypeGeneral: "Demande générale",
    reqDetailCategory: "Catégorie",
    reqStatusOpen: "Ouvert",
    reqStatusInProgress: "En cours",
    reqStatusResolved: "Terminé",
    myRequestsTabOpen: "Ouvert",
    myRequestsTabPreparing: "En préparation",
    myRequestsTabCompleted: "Terminé",
    myRequestsActiveHint: "{n} actif(s)",
    myRequestsTapToView: "Appuyez pour voir",
    fulfillmentStepReceived: "Reçu",
    fulfillmentStepKitchen: "Cuisine",
    fulfillmentStepEnRoute: "En route",
    fulfillmentStepDone: "Livré",
    fulfillmentEtaMinutes: "Env. ~{n} min",
    reqDeleteLabel: "Supprimer",
    reqDeleteConfirm: "Supprimer ?",
    reqDeletedToast: "Demande supprimée",

    billSection: "Votre séjour",
    billCardTitle: "Note du jour",
    billCardSubtitleToday: "Voir les dépenses du jour",
    billCardSubtitleAmount: "Aujourd'hui · {amount}",
    billSheetTitle: "Note quotidienne",
    billRoomLabel: "Chambre {room}",
    billSubtotal: "Total",
    billRoomChargeNote: "Les frais sont portés au compte chambre. Facture finale au départ.",
    billEmptyTitle: "Aucune dépense",
    billEmptySubtitle: "Les commandes et le minibar tarifés apparaîtront ici.",
    billToday: "Aujourd'hui",
    billYesterday: "Hier",
    billClose: "Fermer",

    chatQuickFood: "J'ai faim",
    chatQuickSupport: "J'ai besoin d'aide",
    chatQuickInfo: "Infos hôtel",
    chatQuickActivity: "Je m'ennuie",
    chatModeIntroFood: "J'ai faim et je voudrais commander quelque chose.",
    chatModeIntroSupport: "J'ai une demande d'assistance — pouvez-vous m'aider ?",
    chatModeIntroCare: "Je souhaite partager mes préférences de séjour.",
    chatSummaryPrefixFood: "Commande repas : ",
    chatSummaryPrefixSupport: "Demande d'assistance : ",
    chatSummaryPrefixCare: "Préférences du client : ",
    chatSummaryFallback: "Conversation guidée terminée.",
    chatCreateRequestCta: "Créer la demande et alerter l'équipe",
    chatCreateRequestError: "Impossible de créer la demande. Réessayez.",
    chatActionTitle: "Confirmer la demande",
    chatActionConfirm: "Envoyer à l'équipe",
    chatActionDismiss: "Pas maintenant",
    chatRequestCreated: "Demande envoyée — notre équipe s'en occupe.",
    receptionChatPrompt: "Je souhaite parler à la réception",
    voiceStarting: "Démarrage",
    voiceListening: "J'écoute",
    voiceThinking: "Réflexion",
    voiceSpeaking: "Je parle",
    voiceTapInterrupt: "Appuyez pour interrompre",
    voiceTapRetry: "Réessayer",
  },

  // ── Spanish ───────────────────────────────────────────────────────────────
  es: {
    cancel: "Cancelar",
    navMenuTitle: "Menú",
    navMenuOpen: "Abrir menú",
    languageMenuLabel: "Idioma",
    languageSheetTitle: "Elegir idioma",
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
    voiceSendToChat: "Enviar al chat",

    askSomethingLabel: "Preguntar por texto",
    askSomethingTitle: "Preguntar algo",
    askSomethingSubtitle: "Todo sobre tu estancia",

    staySection: "Tu estancia",
    stayAboutTitle: "Sobre tu estancia",
    guestKeyLabel: "Clave de huésped",
    stayWifiTitle: "Wi-Fi",
    stayWifiFloor: "Planta {floor}",
    stayWifiNetwork: "Red",
    stayWifiPasswordLabel: "Contraseña",
    stayWifiCopy: "Copiar",
    stayWifiCopied: "Copiado",
    copyKey: "Copiar",
    keyCopied: "Copiado",
    noActiveKey: "Sin clave activa",
    stayActive: "Estancia activa",
    chatLink: "Chat",
    nearbyTapHint: "Toca para detalles e indicaciones",
    nearbySearchPlaceholder: "Buscar lugares…",
    nearbyFilterAll: "Todos",
    nearbyViewAll: "Ver los {count} lugares",
    nearbyNoResults: "Sin resultados",
    nearbyBackToList: "Todos los lugares",
    nearbyNearestTitle: "Encuentra el más cercano",
    nearbyMapLoading: "Cargando mapa…",
    nearbyMapUnavailable: "Vista previa no disponible",
    nearbyLocationHint: "Activa la ubicación para ver distancias",
    nearbyEmptyPlaces: "Aún no hay lugares cercanos configurados",
    nearbyHotelLabel: "Hotel",
    nearbyLoadFailed: "No se pudieron cargar los lugares cercanos",
    nearbyRetry: "Reintentar",
    nearbySection: "Cerca",

    quickActionsSection: "Acciones rápidas",
    quickActionsOthersSection: "Otros",
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
    aiCapacityTitle: "Capacidad del chat IA agotada por hoy",
    aiCapacityHint: "Elige una acción rápida abajo — nuestro equipo te ayudará al instante.",

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
    iosStep1Title: "Toca ⋯",
    iosStep1Hint: "Abajo en Safari (tres puntos)",
    iosStep2Title: "Toca Compartir",
    iosStep2Hint: "En el menú",
    iosStep3Title: "Toca Ver más",
    iosStep3Hint: "Desplázate si hace falta",
    iosStep4Title: "Añadir a pantalla de inicio",
    iosStep4Hint: "Luego toca Añadir",

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
    flowMenuLoading: "Cargando…",
    flowMenuEmpty: "No hay platos en el menú",
    flowFoodAllTab: "Todo",
    flowFoodSelectHint: "Toque los platos para pedir",
    flowFoodQty: "Cantidad",
    flowFoodItemNote: "Nota",
    flowFoodItemNotePlaceholder: "Alergias, preferencias…",
    flowFoodPlaceOrder: "Enviar pedido",
    flowFoodItemsSelected: "{count} raciones",
    flowFoodLinesSelected: "{count} platos",
    flowFoodNoItems: "Seleccione al menos un plato",
    flowConfirmCategoryLabel: "Categoría",

    flowCatBreakfast: "Desayuno",
    flowCatBreakfastHint: "Bufé, tortilla, tostadas",
    flowCatSoup: "Sopa",
    flowCatSoupHint: "Sopas y entrantes calientes",
    flowCatSalad: "Ensalada",
    flowCatSaladHint: "Ensaladas frescas",
    flowCatAppetizer: "Entrantes",
    flowCatAppetizerHint: "Platos pequeños",
    flowCatLight: "Platos ligeros",
    flowCatLightHint: "Sándwiches, sopa, ensaladas",
    flowCatMain: "Platos principales",
    flowCatMainHint: "Pollo, pescado, pasta",
    flowCatDessert: "Postres",
    flowCatDessertHint: "Dulces",
    flowCatSnack: "Snacks",
    flowCatSnackHint: "Bocados rápidos",
    flowCatDrinks: "Bebidas",
    flowCatDrinksHint: "Té, café, zumo",
    flowCatOther: "Otros",
    flowCatOtherHint: "Más opciones",

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
    flowCareContinue: "Explorar opciones",
    flowCareConfirmDesc: "Confirmar con mi descripción",
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

    conciergeLaundry: "Lavandería",
    conciergeSpa: "Spa y bienestar",
    conciergeTaxi: "Taxi",
    conciergeSalon: "Salón",
    conciergeSheetTitle: "Reserva de {service}",
    conciergeSheetSubtitle: "Recepción confirmará su reserva.",
    conciergeWhenLabel: "Cuándo",
    conciergeWhenAsap: "Lo antes posible",
    conciergeWhenMorning: "Esta mañana",
    conciergeWhenAfternoon: "Esta tarde",
    conciergeWhenEvening: "Esta noche",
    conciergeWhenTomorrow: "Mañana",
    conciergeNotesLabel: "Notas (opcional)",
    conciergeNotesPlaceholder: "ej. hora de recogida…",
    conciergeSubmit: "Enviar a recepción",
    conciergeSuccessToast: "Solicitud enviada — recepción confirmará pronto.",
    conciergeSummary: "{service} · {when}",

    hotelConnectSection: "Hotel",
    receptionLiveTitle: "Recepción",
    receptionLiveSubtitle: "Chat en vivo con recepción",
    receptionLiveBadge: "En vivo",
    receptionLiveCta: "Abrir chat",
    morePlusTitle: "More+",
    morePlusSubtitle: "Actividades y extras",
    comingSoonTitle: "Próximamente",
    comingSoonBody: "Preparamos nuevas experiencias. Vuelve pronto.",
    comingSoonClose: "Entendido",

    atYourServiceHotelAbout: "Tu hotel",
    atYourServiceGuestProAbout: "Guest Pro",
    atYourServiceGuestProDesc: "Conserje IA para tu estancia — pregunta cuando quieras.",
    atYourServiceWifi: "Wi‑Fi",
    atYourServiceEmergency: "Emergencia",
    feedbackSectionTitle: "Comparte tu experiencia",
    feedbackRatingLabel: "Valora tu estancia",
    feedbackCommentPlaceholder: "Cuéntanos qué disfrutaste…",
    feedbackSubmit: "Enviar opinión",
    complaintSectionTitle: "Quejas y sugerencias",
    complaintPlaceholder: "¿Cómo mejorar tu estancia?",
    complaintSubmit: "Enviar mensaje",
    feedbackSuccessToast: "Gracias — opinión enviada.",
    complaintSuccessToast: "Gracias — mensaje recibido.",
    feedbackSubmitting: "Enviando…",

    myRequestsTitle: "Mis solicitudes",
    myRequestsSubtitle: "Sigue tus solicitudes de servicio",
    myRequestsEmpty: "Sin solicitudes aún",
    reqTypeGeneral: "Solicitud general",
    reqDetailCategory: "Categoría",
    reqStatusOpen: "Abierto",
    reqStatusInProgress: "En progreso",
    reqStatusResolved: "Completado",
    myRequestsTabOpen: "Abierto",
    myRequestsTabPreparing: "Preparando",
    myRequestsTabCompleted: "Hecho",
    myRequestsActiveHint: "{n} activo(s)",
    myRequestsTapToView: "Toca para ver",
    fulfillmentStepReceived: "Recibido",
    fulfillmentStepKitchen: "Cocina",
    fulfillmentStepEnRoute: "En camino",
    fulfillmentStepDone: "Entregado",
    fulfillmentEtaMinutes: "Aprox. ~{n} min",
    reqDeleteLabel: "Eliminar",
    reqDeleteConfirm: "¿Eliminar?",
    reqDeletedToast: "Solicitud eliminada",

    billSection: "Tu estancia",
    billCardTitle: "Cuenta del día",
    billCardSubtitleToday: "Toca para ver los gastos de hoy",
    billCardSubtitleAmount: "Hoy · {amount}",
    billSheetTitle: "Cuenta diaria",
    billRoomLabel: "Habitación {room}",
    billSubtotal: "Total",
    billRoomChargeNote: "Los cargos se añaden a la cuenta de la habitación. Factura final al salir.",
    billEmptyTitle: "Sin gastos aún",
    billEmptySubtitle: "Los pedidos de comida y minibar con precio aparecerán aquí.",
    billToday: "Hoy",
    billYesterday: "Ayer",
    billClose: "Cerrar",

    chatQuickFood: "Tengo hambre",
    chatQuickSupport: "Necesito ayuda",
    chatQuickInfo: "Info del hotel",
    chatQuickActivity: "Me aburro",
    chatModeIntroFood: "Tengo hambre y me gustaría pedir algo.",
    chatModeIntroSupport: "Tengo una solicitud de soporte — ¿puede ayudarme?",
    chatModeIntroCare: "Quiero compartir mis preferencias de estancia.",
    chatSummaryPrefixFood: "Pedido de comida: ",
    chatSummaryPrefixSupport: "Solicitud de soporte: ",
    chatSummaryPrefixCare: "Preferencias del huésped: ",
    chatSummaryFallback: "Chat guiado completado.",
    chatCreateRequestCta: "Crear solicitud y avisar al equipo",
    chatCreateRequestError: "No se pudo crear la solicitud. Inténtelo de nuevo.",
    chatActionTitle: "Confirmar solicitud",
    chatActionConfirm: "Enviar al equipo",
    chatActionDismiss: "Ahora no",
    chatRequestCreated: "Solicitud enviada — nuestro equipo atenderá pronto.",
    receptionChatPrompt: "Quisiera hablar con recepción",
    voiceStarting: "Iniciando",
    voiceListening: "Escuchando",
    voiceThinking: "Pensando",
    voiceSpeaking: "Hablando",
    voiceTapInterrupt: "Toca para interrumpir",
    voiceTapRetry: "Reintentar",
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
