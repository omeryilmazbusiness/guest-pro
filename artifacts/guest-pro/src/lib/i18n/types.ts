export interface GuestTranslations {
  // ── Global ─────────────────────────────────────────────────────────────
  cancel: string;
  navMenuTitle: string;
  navMenuOpen: string;
  languageMenuLabel: string;
  languageSheetTitle: string;
  logout: string;
  logoutSuccess: string;
  exitLabel: string;
  logoutConfirmTitle: string;
  logoutConfirmMessage: string;
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
  receptionLiveChatTitle: string;
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
  chatStarterSectionLabel: string;
  chatQuickMore: string;
  chatQuickLess: string;
  chatStarterFoodTitle: string;
  chatStarterFoodHint: string;
  chatStarterFoodPrompt: string;
  chatStarterTripTitle: string;
  chatStarterTripHint: string;
  chatStarterTripPrompt: string;
  chatStarterExploreTitle: string;
  chatStarterExploreHint: string;
  chatStarterExplorePrompt: string;
  chatStarterSpaTitle: string;
  chatStarterSpaHint: string;
  chatStarterSpaPrompt: string;
  chatStarterSupportTitle: string;
  chatStarterSupportHint: string;
  chatStarterSupportPrompt: string;
  chatStarterTaxiTitle: string;
  chatStarterTaxiHint: string;
  chatStarterTaxiPrompt: string;
  chatStarterHotelTitle: string;
  chatStarterHotelHint: string;
  chatStarterHotelPrompt: string;
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
  liveChatTitle: string;
  liveChatIntroTitle: string;
  liveChatIntroBody: string;
  liveChatIntroStart: string;
  liveChatEmergencyBtn: string;
  liveChatInputPlaceholder: string;
  liveChatSend: string;
  liveChatStatusSent: string;
  liveChatStatusRead: string;
  liveChatStaffTyping: string;
  liveChatVoiceSpeaking: string;
  liveChatVoiceChat: string;
  liveChatBack: string;
  liveChatStartError: string;
  liveChatSendError: string;
  liveChatClearError: string;
  liveChatEmergencySent: string;
  liveChatEmergencyError: string;
  receptionUrgentTitle: string;
  receptionUrgentBadge: string;
  receptionLiveChatNewMessage: string;
  receptionLiveChatUnreadHint: string;
  rememberMeTitle: string;
  rememberMeModalTitle: string;
  rememberMeModalBody: string;
  rememberMeModalTimeLabel: string;
  rememberMeModalSubmit: string;
  rememberMeScheduled: string;
  rememberMeError: string;
  rememberMeTimeTooSoon: string;
  rememberMePromptTitle: string;
  rememberMePromptBody: string;
  rememberMePromptAck: string;
  rememberMePromptCountdown: string;
  liveChatSendLocation: string;
  liveChatLocationSent: string;
  liveChatLocationError: string;
  liveChatLocationUnavailable: string;
  liveChatLocationShared: string;
  liveChatOpenMap: string;
  liveChatUrgentAutoMessage: string;
  voiceStarting: string;
  voiceListening: string;
  voiceThinking: string;
  voiceSpeaking: string;
  voiceTapInterrupt: string;
  voiceTapRetry: string;
  voiceModeLabel: string;
  voiceSpeakingFooter: string;
  voiceProcessingFooter: string;
  voiceEndLabel: string;
  roadmapSectionSights: string;
  roadmapSectionFlavors: string;
  roadmapSectionExperiences: string;
  roadmapDownloadLabel: string;
  roadmapDownloading: string;
  roadmapDownloadReady: string;
  roadmapDownloadError: string;
  roadmapPostcardTagline: string;
  roadmapPostcardGreeting: string;
  roadmapPostcardGreetingGuest: string;
  roadmapPostcardNote1: string;
  roadmapPostcardNote2: string;
  roadmapPostcardNote3: string;
  roadmapPostcardNote4: string;
}
