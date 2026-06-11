/**
 * Staff-facing i18n — Manager · Personnel · Restaurant dashboards.
 *
 * Supported locales: en | tr | ar
 * Separate from guest i18n (GuestTranslations) which lives in i18n.ts.
 *
 * Usage:
 *   const { t } = useStaffLocale();
 *   <p>{t.tabGuests}</p>
 */

import type { StaffScopeKind } from "@/lib/staff-scope";
import { DEPARTMENT_LABELS, type StaffDepartment } from "@/lib/staff";

export type StaffLocale = "en" | "tr" | "ar";

export interface StaffTranslations {
  // ── Global ────────────────────────────────────────────────────────────────
  logout: string;
  loggedOut: string;
  settings: string;
  save: string;
  cancel: string;
  language: string;

  // ── Manager header & nav ──────────────────────────────────────────────────
  navMenuOpen: string;
  navMenuTitle: string;
  overviewGuests: string;
  overviewEmployees: string;
  overviewGuestSingular: string;
  overviewGuestPlural: string;
  overviewRefresh: string;
  overviewAddEmployee: string;
  overviewNoEmployees: string;
  overviewActiveShort: string;
  overviewInactive: string;
  overviewTrackingPending: string;
  overviewGuestKey: string;
  presenceIn: string;
  presenceOut: string;
  presenceUnknown: string;
  filterGuests: string;
  filterByRoom: string;
  filterByStatus: string;
  guestDetails: string;
  employeeDetails: string;
  editGuest: string;
  editEmployee: string;
  renewKeyAction: string;
  copyKeyAction: string;
  removeGuestAction: string;
  copyKeyDone: string;
  copyKeyFailed: string;
  deactivateEmployee: string;
  reactivateEmployee: string;
  deleteEmployeePerm: string;
  resetPassword: string;
  resetPasswordFor: string;
  confirmPassword: string;
  confirmPasswordRequired: string;
  passwordsMismatch: string;
  passwordUpdated: string;
  deleteDeptManagerTitle: string;
  deleteDeptManagerDesc: string;
  deptManagerUpdated: string;

  addStaffMember: string;
  addStaffSubtitle: string;
  addStaffMemberBtn: string;
  staffFirstName: string;
  staffLastName: string;
  staffEmail: string;
  staffTempPassword: string;
  staffDepartment: string;
  staffMemberAdded: string;
  failedCreateStaff: string;
  staffFirstNameRequired: string;
  staffLastNameRequired: string;
  staffEmailInvalid: string;
  staffPasswordMin: string;
  staffDeptRequired: string;

  addGuestSubtitle: string;
  guestRoomNumber: string;
  guestCountry: string;
  guestCountrySearch: string;
  guestCountryEmpty: string;
  stayDatesSection: string;
  stayOptional: string;
  guestCheckIn: string;
  guestCheckOut: string;
  generateKeyQrBtn: string;
  guestCreatedSuccess: string;
  failedCreateGuest: string;
  guestFirstNameRequired: string;
  guestLastNameRequired: string;
  guestRoomRequired: string;
  guestCountryRequired: string;
  checkoutAfterCheckin: string;
  passportScanned: string;
  passportNationalityManual: string;
  passportScannedHint: string;
  passportQrError: string;
  scannerReadyShort: string;

  newGuest: string;
  restaurantDashboard: string;
  quickReport: string;
  renewingKey: string;
  keyRenewed: string;
  failedRenewKey: string;
  guestUpdated: string;
  failedUpdateGuest: string;
  guestRemoved: string;
  failedRemoveGuest: string;

  // ── Dashboard tabs ────────────────────────────────────────────────────────
  tabGuests: string;
  tabRooms: string;
  tabRequests: string;
  tabFeedback: string;
  tabSummary: string;
  tabTeam: string;
  tabTasks: string;

  // ── Feedback board (reception) ──────────────────────────────────────────────
  feedbackBoardTitle: string;
  feedbackEmpty: string;
  feedbackRefresh: string;
  feedbackTypeComplaint: string;
  feedbackStatusOpen: string;
  feedbackStatusInProgress: string;
  feedbackStatusResolved: string;
  feedbackStatusUpdateFailed: string;
  feedbackDelete: string;
  feedbackDeleteConfirm: string;
  feedbackDeleteCancel: string;
  feedbackDeleted: string;
  feedbackDeleteFailed: string;

  // ── Staff scope labels (role line) ────────────────────────────────────────
  scopeGeneralManager: string;
  scopeDepartmentManager: string;
  scopeReception: string;
  scopeRestaurant: string;

  // ── Tasks tab ─────────────────────────────────────────────────────────────
  tasksDayView: string;
  tasksWeekView: string;
  tasksPrevDay: string;
  tasksNextDay: string;
  tasksPrevWeek: string;
  tasksNextWeek: string;
  tasksSearchPlaceholder: string;
  tasksNewTask: string;
  tasksNoTasks: string;
  tasksNoEmployees: string;
  tasksOverdueTitle: string;
  tasksTitle: string;
  tasksDescription: string;
  tasksAssignee: string;
  tasksStart: string;
  tasksEnd: string;
  tasksDate: string;
  tasksDuration: string;
  tasksScheduleWhen: string;
  tasksDuration30m: string;
  tasksDuration1h: string;
  tasksDuration90m: string;
  tasksDuration2h: string;
  tasksDuration3h: string;
  tasksCreate: string;
  tasksSave: string;
  tasksComplete: string;
  tasksDelete: string;
  tasksEdit: string;
  tasksDetail: string;
  tasksStatusPending: string;
  tasksStatusInProgress: string;
  tasksStatusCompleted: string;
  tasksStatusCancelled: string;
  tasksCreated: string;
  tasksUpdated: string;
  tasksDeleted: string;
  tasksFailed: string;
  tasksTitleRequired: string;
  tasksAssigneeRequired: string;
  tasksEndAfterStart: string;
  tasksSelectAssignee: string;
  tasksSearchAssignee: string;
  tasksDeleteConfirm: string;
  tasksEmptyDescription: string;
  tasksCreateHint: string;
  tasksTableTask: string;
  tasksTableEmployee: string;
  tasksTableDaySchedule: string;
  tasksScheduleByEmployee: string;
  tasksScheduleByTask: string;
  tasksSectionEmployeeHint: string;
  tasksSectionTaskHint: string;
  tasksLegendTitle: string;
  tasksScrollHint: string;
  tasksHourAssignments: string;
  tasksNoTasksToday: string;
  tasksTableTime: string;
  tasksTableStatus: string;
  tasksTableDay: string;
  tasksFilterAll: string;
  tasksFilterAllShort: string;
  tasksDayShort: string;
  tasksWeekShort: string;
  tasksExportShort: string;
  tasksNewShort: string;
  tasksSearchShort: string;
  tasksScheduleEmployeeShort: string;
  tasksScheduleTaskShort: string;
  tasksHourAssignShort: string;
  tasksRoutineShort: string;
  tasksPerformanceShort: string;
  tasksAiShort: string;
  tasksStatusPendingShort: string;
  tasksStatusInProgressShort: string;
  tasksStatusCompletedShort: string;
  tasksOverdueShort: string;
  tasksExpandTable: string;
  tasksExpandHint: string;
  tasksAiOnTimeShort: string;
  tasksAiLateShort: string;
  tasksAiNotFinishedShort: string;
  tasksPerformanceTitle: string;
  tasksPerformanceSubtitle: string;
  tasksPerformanceOnTime: string;
  tasksPerformanceDone: string;
  tasksPerformanceAssigned: string;
  tasksNoPerformanceData: string;
  tasksAiDailyReport: string;
  tasksAiDailyReportHint: string;
  tasksAiInsight: string;
  tasksAiAnalyzing: string;
  tasksAiAnalysisTitle: string;
  tasksAiAnalysisFailed: string;
  tasksAiRetry: string;
  tasksAiByEmployee: string;
  tasksAiOnTime: string;
  tasksAiLate: string;
  tasksAiNotFinished: string;
  tasksAiNobodyOnTime: string;
  tasksAiNobodyLate: string;
  tasksAiNobodyOverdue: string;
  tasksAiBudgetLimited: string;
  tasksAiTokenUsage: string;
  tasksAiDailyBannerTitle: string;
  tasksAiDailyBannerAction: string;
  tasksAiOverviewLabel: string;
  tasksAiOverviewPending: string;
  tasksExportExcel: string;
  tasksExportSuccess: string;
  tasksExportEmpty: string;
  tasksExportReportTitle: string;
  tasksExportPeriod: string;
  tasksExportView: string;
  tasksExportHotel: string;
  tasksExportGeneratedAt: string;
  tasksExportTaskCount: string;
  tasksExportRoutineCount: string;
  tasksExportSheetSummary: string;
  tasksExportSheetTasks: string;
  tasksExportSheetRoutines: string;
  tasksExportColId: string;
  tasksExportColStart: string;
  tasksExportColEnd: string;
  tasksExportColDurationMin: string;
  tasksExportColDepartment: string;
  tasksExportColCompletedAt: string;
  tasksExportColCreatedAt: string;
  tasksExportColActive: string;
  tasksExportYes: string;
  tasksExportNo: string;

  // ── Guest filter bar ──────────────────────────────────────────────────────
  searchPlaceholder: string;
  searchRoomPlaceholder: string;
  allRooms: string;
  room: string;
  clearSearch: string;
  clearFilters: string;

  // ── Status chips ──────────────────────────────────────────────────────────
  statusAll: string;
  statusActive: string;
  statusUpcoming: string;
  statusExpired: string;

  // ── Guest list ────────────────────────────────────────────────────────────
  guestsNewestFirst: string; // {n}
  guestsFiltered: string;    // {n} {total}
  noMatches: string;
  tryDifferentSearch: string;
  noGuestsYet: string;
  checkInFirstGuest: string;
  checkInGuest: string;

  // ── Room list ─────────────────────────────────────────────────────────────
  roomsOccupied: string;   // {n}
  roomsFiltered: string;   // {n} {total}
  noRoomsMatch: string;
  tryDifferentRoom: string;
  noRoomsYet: string;
  roomsAutomatic: string;

  // ── Restaurant header ─────────────────────────────────────────────────────
  restaurantTitle: string;
  backToDashboard: string;

  // ── Restaurant tabs ───────────────────────────────────────────────────────
  tabOrders: string;
  tabMenu: string;
  tabStock: string;
  tabCare: string;

  // ── Orders tab ────────────────────────────────────────────────────────────
  ordersTitle: string;
  orderStatusOpen: string;
  orderStatusInProgress: string;
  orderStatusResolved: string;
  advanceToInProgress: string;
  advanceToResolved: string;
  noOrders: string;
  orderMarked: string;      // {label}
  orderUpdateFailed: string;

  // ── Shared form actions ──────────────────────────────────────────────────
  add: string;
  nameRequired: string;
  addFailed: string;
  deleted: string;
  deleteFailed: string;
  updateFailed: string;
  confirmDelete: string;

  // ── Menu tab ─────────────────────────────────────────────────────────────
  menuItemAdded: string;
  addToDailyMenu: string;
  addToRoomServiceMenu: string;
  placeholderFoodName: string;
  placeholderDescription: string;
  placeholderPrice: string;
  placeholderAllergen: string;
  placeholderPortion: string;
  makeInactive: string;
  makeActive: string;
  noMenuForDate: string;
  roomServiceMenuEmpty: string;
  dailyMenuTab: string;
  roomServiceTab: string;
  editMenuItem: string;
  menuUpdated: string;
  menuUploadPhoto: string;
  menuRemovePhoto: string;
  menuPhotoSaved: string;
  menuPhotoRemoved: string;
  deleteItem: string;
  menuImportExcel: string;
  menuDownloadTemplate: string;
  menuImportPreview: string;
  menuImportConfirm: string;
  menuImportDone: string;
  menuImportEmpty: string;
  menuEditorSubtitle: string;
  menuSectionBasics: string;
  menuSectionPricing: string;
  menuSectionGuestInfo: string;
  menuFieldName: string;
  menuFieldDescription: string;
  menuFieldCategory: string;
  menuFieldPrice: string;
  menuFieldPortion: string;
  menuFieldAllergens: string;
  menuFieldSortOrder: string;
  menuFieldCurrency: string;
  menuFieldDate: string;
  menuFieldVisible: string;
  menuFieldVisibleHint: string;
  menuFieldPhotoHint: string;
  menuChangePhoto: string;
  menuPhotoTooLarge: string;

  // ── Menu category labels ─────────────────────────────────────────────────
  catBreakfast: string;
  catSoup: string;
  catSalad: string;
  catAppetizer: string;
  catMainCourse: string;
  catDessert: string;
  catBeverage: string;
  catSnack: string;
  catOther: string;

  // ── Stock tab ────────────────────────────────────────────────────────────
  stockTitle: string;
  newStockItem: string;
  stockItemAdded: string;
  quantityUpdateFailed: string;
  confirmDeleteStock: string;
  tagOutOfStock: string;
  tagLowStock: string;
  thresholdLabel: string;
  lowStockSummary: string;
  noStockItems: string;
  noStockItemsHint: string;
  placeholderProductName: string;
  placeholderUnit: string;
  placeholderCurrentQty: string;
  placeholderLowStockThreshold: string;
  placeholderNotes: string;

  // ── Settings — floor Wi-Fi ───────────────────────────────────────────────
  settingsCategoryGuest: string;
  settingsCategoryGuestDesc: string;
  settingsCategoryTracking: string;
  settingsCategoryTrackingDesc: string;
  settingsHubIntro: string;
  assistantConfigTitle: string;
  assistantConfigSubtitle: string;
  assistantConfigLoadFailed: string;
  assistantConfigSaveFailed: string;
  assistantConfigSaved: string;
  assistantConfigSavedComplete: string;
  assistantConfigSave: string;
  assistantConfigProgress: string;
  assistantConfigCompleteBanner: string;
  assistantAboutTitle: string;
  assistantAboutSubtitle: string;
  assistantAboutLabel: string;
  assistantAboutPlaceholder: string;
  assistantAboutMinChars: string;
  assistantAboutTooShort: string;
  assistantCityLabel: string;
  assistantCityPlaceholder: string;
  assistantFacilitiesTitle: string;
  assistantFacilitiesSubtitle: string;
  assistantAddDetail: string;
  assistantHideDetail: string;
  assistantSectionSave: string;
  assistantSectionSaved: string;
  assistantFacilitiesRequired: string;
  assistantServiceRequired: string;
  assistantSectionHome: string;
  assistantCountryLabel: string;
  assistantCityFieldLabel: string;
  assistantCountrySearch: string;
  assistantCitySearch: string;
  assistantPickerEmpty: string;
  assistantUseCustomCity: string;
  assistantTaxiTitle: string;
  assistantTaxiSubtitle: string;
  assistantTaxiPhone: string;
  assistantTaxiPhonePlaceholder: string;
  assistantSpaTitle: string;
  assistantSpaSubtitle: string;
  assistantSalonTitle: string;
  assistantSalonSubtitle: string;
  assistantLaundryTitle: string;
  assistantLaundrySubtitle: string;
  assistantOpenTime: string;
  assistantCloseTime: string;
  assistantReservationPhone: string;
  assistantNotes: string;
  assistantOnboardingTitle: string;
  assistantOnboardingBody: string;
  assistantOnboardingCta: string;
  assistantOnboardingCompleteTitle: string;
  assistantOnboardingCompleteBody: string;
  setupWizardEyebrow: string;
  setupWizardTitle: string;
  setupWizardSubtitle: string;
  setupWizardProgress: string;
  setupWizardContinue: string;
  setupStepAbout: string;
  setupStepAboutDesc: string;
  setupStepServices: string;
  setupStepServicesDesc: string;
  setupStepWifi: string;
  setupStepWifiDesc: string;
  setupStepNearby: string;
  setupStepNearbyDesc: string;
  setupCompleteTitle: string;
  setupCompleteBody: string;
  setupCompleteCta: string;
  settingsHotelLocationTitle: string;
  settingsHotelLocationSubtitle: string;
  settingsHotelLocationHint: string;
  settingsHotelLocationLabel: string;
  settingsHotelLocationLabelPlaceholder: string;
  settingsHotelLocationSave: string;
  settingsHotelLocationSaved: string;
  settingsHotelLocationLoadFailed: string;
  settingsHotelLocationSaveFailed: string;
  settingsWifiNetworksTitle: string;
  settingsWifiNetworksSubtitle: string;
  settingsWifiNetworksHint: string;
  settingsWifiNetworksLoadFailed: string;
  settingsWifiNetworksSaved: string;
  settingsWifiNetworksSaveFailed: string;
  settingsWifiNetworkRow: string;
  settingsWifiName: string;
  settingsWifiPassword: string;
  settingsAddWifiNetwork: string;
  settingsSaveWifiNetworks: string;
  settingsRemoveWifiNetwork: string;
  guestWifiNetwork: string;
  guestWifiNetworkRequired: string;
  guestWifiNetworkPlaceholder: string;
  guestWifiNetworkEmpty: string;
  optionalLabel: string;

  // ── Settings — nearby places ─────────────────────────────────────────────
  settingsNearbyTitle: string;
  settingsNearbySubtitle: string;
  settingsNearbyHint: string;
  settingsNearbyLoadFailed: string;
  settingsNearbySaved: string;
  settingsNearbySaveFailed: string;
  settingsNearbyInvalidCoords: string;
  settingsNearbyName: string;
  settingsNearbyNamePlaceholder: string;
  settingsNearbyType: string;
  settingsNearbyAddress: string;
  settingsNearbyAddressPlaceholder: string;
  settingsNearbyDescription: string;
  settingsNearbyDescriptionPlaceholder: string;
  settingsNearbyLat: string;
  settingsNearbyLng: string;
  settingsNearbyCoordsHint: string;
  settingsNearbyCoordsSwapped: string;
  settingsNearbyTooFarFromHotel: string;
  settingsNearbyRow: string;
  settingsNearbyAdd: string;
  settingsNearbySave: string;
  settingsNearbyRemove: string;
  settingsNearbyPlaceRequired: string;
  settingsNearbyNameRequired: string;
  settingsNearbyCoordsRequired: string;
  settingsNearbyRowIncomplete: string;
  settingsWifiNetworkRequired: string;
  settingsWifiNameRequired: string;
  settingsWifiPasswordRequired: string;
  settingsWifiRowIncomplete: string;

  // ── Care tab ─────────────────────────────────────────────────────────────
  careTitle: string;
  careRefreshBtn: string;
  careRefreshing: string;
  careRefreshed: string;
  careRefreshFailed: string;
  careBannerDescription: string;
  careLastAnalysis: string;
  careNoInsights: string;
  careNoInsightsHint: string;
  careRoomLabel: string;
}

// ── Dictionaries ──────────────────────────────────────────────────────────────

const en: StaffTranslations = {
  logout: "Log out",
  loggedOut: "Logged out",
  settings: "Settings",
  save: "Save",
  cancel: "Cancel",
  language: "Language",

  navMenuOpen: "Open menu",
  navMenuTitle: "Dashboard",
  overviewGuests: "Guests",
  overviewEmployees: "Staff",
  overviewGuestSingular: "registered guest",
  overviewGuestPlural: "registered guests",
  overviewRefresh: "Refresh presence",
  overviewAddEmployee: "Add employee",
  overviewNoEmployees: "No employees yet",
  overviewActiveShort: "active",
  overviewInactive: "Inactive",
  overviewTrackingPending: "Presence tracking pending",
  overviewGuestKey: "Access key",
  presenceIn: "In hotel",
  presenceOut: "Out of hotel",
  presenceUnknown: "Unknown",
  filterGuests: "Filter guests",
  filterByRoom: "Room",
  filterByStatus: "Stay status",
  guestDetails: "Guest details",
  employeeDetails: "Employee details",
  editGuest: "Edit guest",
  editEmployee: "Edit employee",
  renewKeyAction: "Renew key & QR",
  copyKeyAction: "Copy access key",
  removeGuestAction: "Remove guest",
  copyKeyDone: "Key copied",
  copyKeyFailed: "Copy failed",
  deactivateEmployee: "Deactivate",
  reactivateEmployee: "Reactivate",
  deleteEmployeePerm: "Delete permanently",
  resetPassword: "Reset password",
  resetPasswordFor: "Reset password for {name}",
  confirmPassword: "Confirm password",
  confirmPasswordRequired: "Confirm the new password",
  passwordsMismatch: "Passwords do not match",
  passwordUpdated: "Password updated",
  deleteDeptManagerTitle: "Delete department manager?",
  deleteDeptManagerDesc:
    "{name} will be permanently removed. This cannot be undone and they will no longer be able to log in.",
  deptManagerUpdated: "Department manager updated",

  addStaffMember: "Add team member",
  addStaffSubtitle: "Create login credentials and assign a department.",
  addStaffMemberBtn: "Add member",
  staffFirstName: "First name",
  staffLastName: "Last name",
  staffEmail: "Work email",
  staffTempPassword: "Temporary password",
  staffDepartment: "Department",
  staffMemberAdded: "Team member added",
  failedCreateStaff: "Could not add team member",
  staffFirstNameRequired: "First name is required",
  staffLastNameRequired: "Last name is required",
  staffEmailInvalid: "Enter a valid email",
  staffPasswordMin: "Password must be at least 8 characters",
  staffDeptRequired: "Select a department",

  addGuestSubtitle: "Issue a digital key and QR login for the guest.",
  guestRoomNumber: "Room number",
  guestCountry: "Country",
  guestCountrySearch: "Search country…",
  guestCountryEmpty: "No country found",
  stayDatesSection: "Stay dates",
  stayOptional: "optional",
  guestCheckIn: "Check-in",
  guestCheckOut: "Check-out",
  generateKeyQrBtn: "Generate key & QR",
  guestCreatedSuccess: "Guest checked in",
  failedCreateGuest: "Failed to create guest",
  guestFirstNameRequired: "First name is required",
  guestLastNameRequired: "Last name is required",
  guestRoomRequired: "Room number is required",
  guestCountryRequired: "Country is required",
  checkoutAfterCheckin: "Check-out must be after check-in",
  passportScanned: "Passport scanned",
  passportNationalityManual: "Select nationality manually",
  passportScannedHint: "Passport data filled — verify and complete remaining fields.",
  passportQrError: "QR code not recognised",
  scannerReadyShort: "Scanner ready",

  newGuest: "New Guest",
  restaurantDashboard: "Restaurant Dashboard",
  quickReport: "Quick Report",
  renewingKey: "Renewing key…",
  keyRenewed: "Key renewed",
  failedRenewKey: "Failed to renew key",
  guestUpdated: "Guest updated",
  failedUpdateGuest: "Failed to update guest",
  guestRemoved: "Guest removed",
  failedRemoveGuest: "Failed to remove guest",

  tabGuests: "Guests",
  tabRooms: "Rooms",
  tabRequests: "Requests",
  tabFeedback: "Feedback",
  tabSummary: "Summary",
  tabTeam: "Employees",
  tabTasks: "Tasks",

  feedbackBoardTitle: "Feedbacks & complaints",
  feedbackEmpty: "No guest feedback yet",
  feedbackRefresh: "Refresh",
  feedbackTypeComplaint: "Complaint / suggestion",
  feedbackStatusOpen: "Open",
  feedbackStatusInProgress: "In progress",
  feedbackStatusResolved: "Resolved",
  feedbackStatusUpdateFailed: "Could not update status",
  feedbackDelete: "Delete",
  feedbackDeleteConfirm: "Yes",
  feedbackDeleteCancel: "No",
  feedbackDeleted: "Feedback removed",
  feedbackDeleteFailed: "Could not delete",

  scopeGeneralManager: "General Manager",
  scopeDepartmentManager: "{dept} Manager",
  scopeReception: "Reception",
  scopeRestaurant: "Restaurant",

  tasksDayView: "Day",
  tasksWeekView: "Week",
  tasksPrevDay: "Previous day",
  tasksNextDay: "Next day",
  tasksPrevWeek: "Previous week",
  tasksNextWeek: "Next week",
  tasksSearchPlaceholder: "Search tasks or assignee…",
  tasksNewTask: "New task",
  tasksNoTasks: "No tasks in this period",
  tasksNoEmployees: "Add employees before scheduling tasks",
  tasksOverdueTitle: "Overdue",
  tasksTitle: "Title",
  tasksDescription: "Description",
  tasksAssignee: "Assignee",
  tasksStart: "Start",
  tasksEnd: "End",
  tasksDate: "Date",
  tasksDuration: "Duration",
  tasksScheduleWhen: "Schedule",
  tasksDuration30m: "30 min",
  tasksDuration1h: "1 hour",
  tasksDuration90m: "1.5 hours",
  tasksDuration2h: "2 hours",
  tasksDuration3h: "3 hours",
  tasksCreate: "Create task",
  tasksSave: "Save",
  tasksComplete: "Mark complete",
  tasksDelete: "Delete",
  tasksEdit: "Edit",
  tasksDetail: "Task details",
  tasksStatusPending: "Pending",
  tasksStatusInProgress: "In progress",
  tasksStatusCompleted: "Completed",
  tasksStatusCancelled: "Cancelled",
  tasksCreated: "Task created",
  tasksUpdated: "Task updated",
  tasksDeleted: "Task removed",
  tasksFailed: "Task action failed",
  tasksTitleRequired: "Title is required",
  tasksAssigneeRequired: "Select an assignee",
  tasksEndAfterStart: "End must be after start",
  tasksSelectAssignee: "Select employee",
  tasksSearchAssignee: "Search employees…",
  tasksDeleteConfirm: "Remove this task from the schedule?",
  tasksEmptyDescription: "No description",
  tasksCreateHint: "Assign to an employee with a time window",
  tasksTableTask: "Task",
  tasksTableEmployee: "Employee",
  tasksTableDaySchedule: "Today's schedule",
  tasksScheduleByEmployee: "By employee",
  tasksScheduleByTask: "By task",
  tasksSectionEmployeeHint: "Rows are staff, columns are hours — tap a block for details",
  tasksSectionTaskHint: "Rows are tasks with hour-by-hour assignee summary",
  tasksLegendTitle: "Legend",
  tasksScrollHint: "Swipe",
  tasksHourAssignments: "Hour assignments",
  tasksNoTasksToday: "No tasks scheduled",
  tasksTableTime: "Time",
  tasksTableStatus: "Status",
  tasksTableDay: "Day",
  tasksFilterAll: "All",
  tasksFilterAllShort: "All",
  tasksDayShort: "Day",
  tasksWeekShort: "Week",
  tasksExportShort: "Excel",
  tasksNewShort: "New",
  tasksSearchShort: "Search",
  tasksScheduleEmployeeShort: "Staff",
  tasksScheduleTaskShort: "Tasks",
  tasksHourAssignShort: "Assign",
  tasksRoutineShort: "Routine",
  tasksPerformanceShort: "Stats",
  tasksAiShort: "AI",
  tasksStatusPendingShort: "Wait",
  tasksStatusInProgressShort: "Active",
  tasksStatusCompletedShort: "Done",
  tasksOverdueShort: "Late",
  tasksExpandTable: "Expand",
  tasksExpandHint: "Tap a task to view or edit",
  tasksAiOnTimeShort: "On time",
  tasksAiLateShort: "Late",
  tasksAiNotFinishedShort: "Open",
  tasksPerformanceTitle: "Team performance",
  tasksPerformanceSubtitle: "On-time completion rate by employee",
  tasksPerformanceOnTime: "On-time %",
  tasksPerformanceDone: "done",
  tasksPerformanceAssigned: "Assigned",
  tasksNoPerformanceData: "No completed tasks to chart yet.",
  tasksAiDailyReport: "AI daily report",
  tasksAiDailyReportHint: "Who finished on time, who was late, who did not finish — by name",
  tasksAiInsight: "AI insight",
  tasksAiAnalyzing: "Analyzing task data…",
  tasksAiAnalysisTitle: "AI analysis",
  tasksAiAnalysisFailed: "Could not load AI analysis. Check your connection or try again.",
  tasksAiRetry: "Try again",
  tasksAiByEmployee: "By employee",
  tasksAiOnTime: "Finished on time or early",
  tasksAiLate: "Finished late",
  tasksAiNotFinished: "Not finished / overdue",
  tasksAiNobodyOnTime: "No one in this group.",
  tasksAiNobodyLate: "No one finished late.",
  tasksAiNobodyOverdue: "No overdue or open tasks.",
  tasksAiBudgetLimited: "Monthly AI token budget reached. Contact platform admin.",
  tasksAiTokenUsage: "AI tokens this month",
  tasksAiDailyBannerTitle: "Daily task report is ready",
  tasksAiDailyBannerAction: "View",
  tasksAiOverviewLabel: "AI",
  tasksAiOverviewPending: "Daily report at 6:00 PM",
  tasksExportExcel: "Export Excel",
  tasksExportSuccess: "Excel file downloaded",
  tasksExportEmpty: "No tasks to export for this period",
  tasksExportReportTitle: "Guest Pro — Task Schedule Export",
  tasksExportPeriod: "Period",
  tasksExportView: "View",
  tasksExportHotel: "Hotel",
  tasksExportGeneratedAt: "Generated",
  tasksExportTaskCount: "Scheduled tasks",
  tasksExportRoutineCount: "Routine templates",
  tasksExportSheetSummary: "Summary",
  tasksExportSheetTasks: "Tasks",
  tasksExportSheetRoutines: "Routines",
  tasksExportColId: "ID",
  tasksExportColStart: "Start",
  tasksExportColEnd: "End",
  tasksExportColDurationMin: "Duration (min)",
  tasksExportColDepartment: "Department",
  tasksExportColCompletedAt: "Completed at",
  tasksExportColCreatedAt: "Created at",
  tasksExportColActive: "Active",
  tasksExportYes: "Yes",
  tasksExportNo: "No",

  searchPlaceholder: "Name, room, or key…",
  searchRoomPlaceholder: "Search room number…",
  allRooms: "All Rooms",
  room: "Room",
  clearSearch: "Clear search",
  clearFilters: "Clear",

  statusAll: "All",
  statusActive: "Active",
  statusUpcoming: "Upcoming",
  statusExpired: "Expired",

  guestsNewestFirst: "{n} guests · newest first",
  guestsFiltered: "{n} of {total} guests",
  noMatches: "No matches",
  tryDifferentSearch: "Try different search or room filter.",
  noGuestsYet: "No guests yet",
  checkInFirstGuest: "Check in your first guest to get started.",
  checkInGuest: "Check In Guest",

  roomsOccupied: "{n} rooms occupied",
  roomsFiltered: "{n} of {total} rooms",
  noRoomsMatch: "No rooms match",
  tryDifferentRoom: "Try a different room number or filter.",
  noRoomsYet: "No rooms yet",
  roomsAutomatic: "Rooms appear automatically when guests are checked in.",

  restaurantTitle: "Restaurant",
  backToDashboard: "← Dashboard",

  tabOrders: "Orders",
  tabMenu: "Menu",
  tabStock: "Stock",
  tabCare: "Care",

  ordersTitle: "Food Orders",
  orderStatusOpen: "Open",
  orderStatusInProgress: "Preparing",
  orderStatusResolved: "Completed",
  advanceToInProgress: "Start Preparing",
  advanceToResolved: "Mark Delivered",
  noOrders: "No orders",
  orderMarked: "Marked as {label}",
  orderUpdateFailed: "Failed to update status",
  add: "Add",
  nameRequired: "Name is required",
  addFailed: "Could not add",
  deleted: "Deleted",
  deleteFailed: "Could not delete",
  updateFailed: "Could not update",
  confirmDelete: "Delete \"{name}\"?",

  menuItemAdded: "Menu item added",
  addToDailyMenu: "Add to Daily Menu",
  addToRoomServiceMenu: "Add to Room Service Menu",
  placeholderFoodName: "Food name *",
  placeholderDescription: "Description (optional)",
  placeholderPrice: "Price (e.g. 85.00)",
  placeholderAllergen: "Allergen info (optional)",
  placeholderPortion: "Portion / calorie info (optional)",
  makeInactive: "Make inactive",
  makeActive: "Make active",
  noMenuForDate: "No menu added for this date",
  roomServiceMenuEmpty: "Room service menu is empty",
  dailyMenuTab: "📅 Daily Menu",
  roomServiceTab: "🛎 Room Service",
  editMenuItem: "Edit item",
  menuUpdated: "Menu item updated",
  menuUploadPhoto: "Add photo",
  menuRemovePhoto: "Remove photo",
  menuPhotoSaved: "Photo saved",
  menuPhotoRemoved: "Photo removed",
  deleteItem: "Delete item",
  menuImportExcel: "Import Excel",
  menuDownloadTemplate: "Template",
  menuImportPreview: "{count} items ready · {skipped} rows skipped",
  menuImportConfirm: "Import all",
  menuImportDone: "{count} menu items imported",
  menuImportEmpty: "No valid rows found in the file",
  menuEditorSubtitle: "Shown to guests in the food ordering flow",
  menuSectionBasics: "Basics",
  menuSectionPricing: "Pricing",
  menuSectionGuestInfo: "Guest details",
  menuFieldName: "Item name",
  menuFieldDescription: "Description",
  menuFieldCategory: "Category",
  menuFieldPrice: "Price",
  menuFieldPortion: "Portion / calories",
  menuFieldAllergens: "Allergens & notes",
  menuFieldSortOrder: "Sort order",
  menuFieldCurrency: "Currency",
  menuFieldDate: "Available date",
  menuFieldVisible: "Visible to guests",
  menuFieldVisibleHint: "Hidden items won't appear on guest menus",
  menuFieldPhotoHint: "JPEG, PNG or WebP · max 3 MB",
  menuChangePhoto: "Change photo",
  menuPhotoTooLarge: "Image must be under 3 MB",

  catBreakfast: "Breakfast",
  catSoup: "Soup",
  catSalad: "Salad",
  catAppetizer: "Appetizer",
  catMainCourse: "Main Course",
  catDessert: "Dessert",
  catBeverage: "Beverage",
  catSnack: "Snack",
  catOther: "Other",

  stockTitle: "Stock Tracking",
  newStockItem: "New Stock Item",
  stockItemAdded: "Stock item added",
  quantityUpdateFailed: "Could not update quantity",
  confirmDeleteStock: "Remove \"{name}\" from stock?",
  tagOutOfStock: "Out of stock",
  tagLowStock: "Low",
  thresholdLabel: "threshold:",
  lowStockSummary: "{n} items with low / out-of-stock alert",
  noStockItems: "No stock items",
  noStockItemsHint: "Click Add to start tracking stock.",
  placeholderProductName: "Product name *",
  placeholderUnit: "Unit (pcs, kg, litre…)",
  placeholderCurrentQty: "Current quantity",
  placeholderLowStockThreshold: "Low-stock alert threshold",
  placeholderNotes: "Notes (optional)",

  settingsCategoryGuest: "Guest experience",
  settingsCategoryGuestDesc: "Information shown on the guest home screen.",
  settingsCategoryTracking: "Presence & tracking",
  settingsCategoryTrackingDesc: "Geofence, network rules, and guest location.",
  settingsHubIntro: "Choose a category to configure guest-facing features or hotel presence tracking.",
  assistantConfigTitle: "Guest AI assistant",
  assistantConfigSubtitle: "Hotel knowledge, facilities, and concierge services for AI chat.",
  assistantConfigLoadFailed: "Failed to load AI assistant settings.",
  assistantConfigSaveFailed: "Failed to save AI assistant settings.",
  assistantConfigSaved: "AI assistant settings saved.",
  assistantConfigSavedComplete: "AI assistant is fully configured.",
  assistantConfigSave: "Save AI assistant settings",
  assistantConfigProgress: "Complete setup to activate your hotel AI assistant",
  assistantConfigCompleteBanner: "AI assistant setup complete",
  assistantAboutTitle: "About the hotel",
  assistantAboutSubtitle: "Tell guests what makes your hotel special — location, amenities, and advantages.",
  assistantAboutLabel: "Hotel description",
  assistantAboutPlaceholder:
    "e.g. Our beachfront resort offers a spa, outdoor pool, aquapark, and all-day dining. Located 10 min from the old town with sea views from every room. Ideal for families and couples seeking a quiet escape…",
  assistantAboutMinChars: "Minimum {min} characters for setup progress",
  assistantAboutTooShort: "Write at least {min} characters, then save to update the dashboard.",
  assistantCityLabel: "City for local tips",
  assistantCityPlaceholder: "Istanbul",
  assistantFacilitiesTitle: "Hotel facilities",
  assistantFacilitiesSubtitle: "Select the features and services your hotel offers. Optional details can be added per item.",
  assistantAddDetail: "Add details",
  assistantHideDetail: "Hide details",
  assistantSectionSave: "Save",
  assistantSectionSaved: "Saved",
  assistantFacilitiesRequired: "Select at least one facility before saving.",
  assistantServiceRequired: "Add at least one detail (phone, hours, or notes) before saving.",
  assistantSectionHome: "Home",
  assistantCountryLabel: "Country",
  assistantCityFieldLabel: "City",
  assistantCountrySearch: "Search country…",
  assistantCitySearch: "Search city…",
  assistantPickerEmpty: "No results",
  assistantUseCustomCity: 'Use "{city}"',
  assistantTaxiTitle: "Taxi service",
  assistantTaxiSubtitle: "Lobby desk number for taxi arrangements.",
  assistantTaxiPhone: "Taxi lobby desk phone",
  assistantTaxiPhonePlaceholder: "Ext. 120 or +90 …",
  assistantSpaTitle: "Spa & wellness",
  assistantSpaSubtitle: "Contact and hours for spa bookings via AI.",
  assistantSalonTitle: "Salon",
  assistantSalonSubtitle: "Hair & beauty salon information.",
  assistantLaundryTitle: "Laundry",
  assistantLaundrySubtitle: "Laundry and dry-cleaning service details.",
  assistantOpenTime: "Opens",
  assistantCloseTime: "Closes",
  assistantReservationPhone: "Reservation phone",
  assistantNotes: "Notes",
  assistantOnboardingTitle: "Complete your Guest AI assistant setup",
  assistantOnboardingBody: "Add hotel knowledge so guests get accurate answers and reception bookings.",
  assistantOnboardingCta: "Continue: {step}",
  assistantOnboardingCompleteTitle: "AI assistant 100% — {hotel} guest assistant is active",
  assistantOnboardingCompleteBody: "Guests can explore, book services, and get hotel-specific recommendations in chat.",
  setupWizardEyebrow: "Getting started",
  setupWizardTitle: "Complete setup",
  setupWizardSubtitle: "Four quick steps to launch Guest Pro for your team and guests.",
  setupWizardProgress: "Complete",
  setupWizardContinue: "Continue: {step}",
  setupStepAbout: "About hotel",
  setupStepAboutDesc: "Describe your property, location, and what makes it special.",
  setupStepServices: "Guest services",
  setupStepServicesDesc: "Select the amenities and services your AI assistant can mention.",
  setupStepWifi: "Wi-Fi",
  setupStepWifiDesc: "Add Wi-Fi networks for guest room assignment.",
  setupStepNearby: "Nearby places",
  setupStepNearbyDesc: "Add markets, restaurants, and attractions near your hotel.",
  setupCompleteTitle: "You're all set",
  setupCompleteBody: "Guest Pro is 100% ready to assist you and your dear guests at {hotel}.",
  setupCompleteCta: "Continue to dashboard",
  settingsHotelLocationTitle: "Hotel map pin",
  settingsHotelLocationSubtitle: "Fixed location shown on the guest nearby map as your hotel.",
  settingsHotelLocationHint: "Enter GPS coordinates from Google Maps (right-click → coordinates). This pin is the starting point for directions and distance sorting.",
  settingsHotelLocationLabel: "Pin label",
  settingsHotelLocationLabelPlaceholder: "Grand Hotel Istanbul",
  settingsHotelLocationSave: "Save hotel location",
  settingsHotelLocationSaved: "Hotel map pin saved.",
  settingsHotelLocationLoadFailed: "Failed to load hotel location.",
  settingsHotelLocationSaveFailed: "Failed to save hotel location.",
  settingsWifiNetworksTitle: "Guest Wi-Fi networks",
  settingsWifiNetworksSubtitle: "Define Wi-Fi networks guests can be assigned during check-in.",
  settingsWifiNetworksHint: "Each network needs a name and password. Staff assign one network per guest at check-in.",
  settingsWifiNetworksLoadFailed: "Failed to load Wi-Fi networks.",
  settingsWifiNetworksSaved: "Wi-Fi networks saved.",
  settingsWifiNetworksSaveFailed: "Failed to save Wi-Fi networks.",
  settingsWifiNetworkRow: "Network {n}",
  settingsWifiName: "Network name",
  settingsWifiPassword: "Wi-Fi password",
  settingsAddWifiNetwork: "Add another network",
  settingsSaveWifiNetworks: "Save Wi-Fi networks",
  settingsRemoveWifiNetwork: "Remove network",
  guestWifiNetwork: "Wi-Fi network",
  guestWifiNetworkRequired: "Please select a Wi-Fi network",
  guestWifiNetworkPlaceholder: "Select network…",
  guestWifiNetworkEmpty: "No Wi-Fi networks configured",
  optionalLabel: "Optional",

  settingsNearbyTitle: "Nearby places",
  settingsNearbySubtitle: "Define pharmacies, markets, bazaars and malls shown on the guest map.",
  settingsNearbyHint: "Enter GPS coordinates from Google Maps (right-click → coordinates). Distances are calculated from the hotel map pin above.",
  settingsNearbyLoadFailed: "Failed to load nearby places.",
  settingsNearbySaved: "Nearby places saved.",
  settingsNearbySaveFailed: "Failed to save nearby places.",
  settingsNearbyInvalidCoords: "Latitude and longitude must be valid numbers for each place.",
  settingsNearbyName: "Place name",
  settingsNearbyNamePlaceholder: "City Pharmacy",
  settingsNearbyType: "Category",
  settingsNearbyAddress: "Address",
  settingsNearbyAddressPlaceholder: "123 Main Street",
  settingsNearbyDescription: "Short description",
  settingsNearbyDescriptionPlaceholder: "Open 24 hours",
  settingsNearbyLat: "Latitude",
  settingsNearbyLng: "Longitude",
  settingsNearbyCoordsHint: "From Google Maps — paste lat,lng or a Maps link",
  settingsNearbyCoordsSwapped: "Latitude and longitude were auto-corrected (they looked swapped).",
  settingsNearbyTooFarFromHotel: "Place is too far from the hotel pin (>50 km). Check coordinates.",
  settingsNearbyRow: "Place {n}",
  settingsNearbyAdd: "Add place",
  settingsNearbySave: "Save nearby places",
  settingsNearbyRemove: "Remove place",
  settingsNearbyPlaceRequired: "Add at least one nearby place with a name and coordinates.",
  settingsNearbyNameRequired: "Place {n}: name is required.",
  settingsNearbyCoordsRequired: "Place {n}: enter valid latitude and longitude.",
  settingsNearbyRowIncomplete: "Place {n}: complete the name and coordinates, or clear the row.",
  settingsWifiNetworkRequired: "Add at least one Wi-Fi network with a name and password.",
  settingsWifiNameRequired: "Network {n}: name is required.",
  settingsWifiPasswordRequired: "Network {n}: password is required.",
  settingsWifiRowIncomplete: "Network {n}: complete the name and password, or clear the row.",

  careTitle: "Care Recommendations",
  careRefreshBtn: "Refresh with AI",
  careRefreshing: "Analyzing…",
  careRefreshed: "Recommendations updated",
  careRefreshFailed: "Analysis failed",
  careBannerDescription: "This list is analyzed by AI from Care About Me profiles submitted by guests. Only food and nutrition related recommendations are shown.",
  careLastAnalysis: "Last analysis: {n} care profiles reviewed · {date}",
  careNoInsights: "No recommendations yet",
  careNoInsightsHint: "When guests start filling in Care About Me, the AI will analyze them. Click Refresh to analyze existing profiles.",
  careRoomLabel: "Room",
};

const tr: StaffTranslations = {
  logout: "Çıkış yap",
  loggedOut: "Çıkış yapıldı",
  settings: "Ayarlar",
  save: "Kaydet",
  cancel: "İptal",
  language: "Dil",

  navMenuOpen: "Menüyü aç",
  navMenuTitle: "Panel",
  overviewGuests: "Misafirler",
  overviewEmployees: "Çalışanlar",
  overviewGuestSingular: "kayıtlı misafir",
  overviewGuestPlural: "kayıtlı misafir",
  overviewRefresh: "Konumu yenile",
  overviewAddEmployee: "Çalışan ekle",
  overviewNoEmployees: "Henüz çalışan yok",
  overviewActiveShort: "aktif",
  overviewInactive: "Pasif",
  overviewTrackingPending: "Konum takibi bekleniyor",
  overviewGuestKey: "Erişim anahtarı",
  presenceIn: "Otelde",
  presenceOut: "Otel dışında",
  presenceUnknown: "Bilinmiyor",
  filterGuests: "Misafirleri filtrele",
  filterByRoom: "Oda",
  filterByStatus: "Konaklama durumu",
  guestDetails: "Misafir detayı",
  employeeDetails: "Çalışan detayı",
  editGuest: "Misafiri düzenle",
  editEmployee: "Çalışanı düzenle",
  renewKeyAction: "Anahtar ve QR yenile",
  copyKeyAction: "Anahtarı kopyala",
  removeGuestAction: "Misafiri kaldır",
  copyKeyDone: "Anahtar kopyalandı",
  copyKeyFailed: "Kopyalama başarısız",
  deactivateEmployee: "Pasifleştir",
  reactivateEmployee: "Yeniden aktifleştir",
  deleteEmployeePerm: "Kalıcı olarak sil",
  resetPassword: "Şifreyi sıfırla",
  resetPasswordFor: "{name} için şifre sıfırla",
  confirmPassword: "Şifreyi onayla",
  confirmPasswordRequired: "Yeni şifreyi onaylayın",
  passwordsMismatch: "Şifreler eşleşmiyor",
  passwordUpdated: "Şifre güncellendi",
  deleteDeptManagerTitle: "Departman müdürü silinsin mi?",
  deleteDeptManagerDesc:
    "{name} kalıcı olarak kaldırılacak. Bu işlem geri alınamaz ve artık giriş yapamaz.",
  deptManagerUpdated: "Departman müdürü güncellendi",

  addStaffMember: "Çalışan ekle",
  addStaffSubtitle: "Giriş bilgilerini oluşturun ve departman atayın.",
  addStaffMemberBtn: "Üye ekle",
  staffFirstName: "Ad",
  staffLastName: "Soyad",
  staffEmail: "İş e-postası",
  staffTempPassword: "Geçici şifre",
  staffDepartment: "Departman",
  staffMemberAdded: "Çalışan eklendi",
  failedCreateStaff: "Çalışan eklenemedi",
  staffFirstNameRequired: "Ad zorunludur",
  staffLastNameRequired: "Soyad zorunludur",
  staffEmailInvalid: "Geçerli bir e-posta girin",
  staffPasswordMin: "Şifre en az 8 karakter olmalı",
  staffDeptRequired: "Departman seçin",

  addGuestSubtitle: "Misafir için dijital anahtar ve QR girişi oluşturun.",
  guestRoomNumber: "Oda numarası",
  guestCountry: "Ülke",
  guestCountrySearch: "Ülke ara…",
  guestCountryEmpty: "Ülke bulunamadı",
  stayDatesSection: "Konaklama tarihleri",
  stayOptional: "opsiyonel",
  guestCheckIn: "Giriş",
  guestCheckOut: "Çıkış",
  generateKeyQrBtn: "Anahtar ve QR oluştur",
  guestCreatedSuccess: "Misafir girişi yapıldı",
  failedCreateGuest: "Misafir oluşturulamadı",
  guestFirstNameRequired: "Ad zorunludur",
  guestLastNameRequired: "Soyad zorunludur",
  guestRoomRequired: "Oda numarası zorunludur",
  guestCountryRequired: "Ülke seçin",
  checkoutAfterCheckin: "Çıkış tarihi girişten sonra olmalı",
  passportScanned: "Pasaport tarandı",
  passportNationalityManual: "Uyruğu manuel seçin",
  passportScannedHint: "Pasaport verileri dolduruldu — kontrol edip kalan alanları tamamlayın.",
  passportQrError: "QR kodu tanınmadı",
  scannerReadyShort: "Tarayıcı hazır",

  newGuest: "Yeni Misafir",
  restaurantDashboard: "Restoran Paneli",
  quickReport: "Hızlı Rapor",
  renewingKey: "Anahtar yenileniyor…",
  keyRenewed: "Anahtar yenilendi",
  failedRenewKey: "Anahtar yenilenemedi",
  guestUpdated: "Misafir güncellendi",
  failedUpdateGuest: "Misafir güncellenemedi",
  guestRemoved: "Misafir silindi",
  failedRemoveGuest: "Misafir silinemedi",

  tabGuests: "Misafirler",
  tabRooms: "Odalar",
  tabRequests: "Talepler",
  tabFeedback: "Geri Bildirim",
  tabSummary: "Özet",
  tabTeam: "Çalışanlar",
  tabTasks: "Görevler",

  feedbackBoardTitle: "Geri bildirimler ve şikayetler",
  feedbackEmpty: "Henüz misafir geri bildirimi yok",
  feedbackRefresh: "Yenile",
  feedbackTypeComplaint: "Şikayet / öneri",
  feedbackStatusOpen: "Açık",
  feedbackStatusInProgress: "İşlemde",
  feedbackStatusResolved: "Tamamlandı",
  feedbackStatusUpdateFailed: "Durum güncellenemedi",
  feedbackDelete: "Sil",
  feedbackDeleteConfirm: "Evet",
  feedbackDeleteCancel: "Hayır",
  feedbackDeleted: "Geri bildirim silindi",
  feedbackDeleteFailed: "Silinemedi",

  scopeGeneralManager: "Genel Müdür",
  scopeDepartmentManager: "{dept} Müdürü",
  scopeReception: "Resepsiyon",
  scopeRestaurant: "Restoran",

  tasksDayView: "Gün",
  tasksWeekView: "Hafta",
  tasksPrevDay: "Önceki gün",
  tasksNextDay: "Sonraki gün",
  tasksPrevWeek: "Önceki hafta",
  tasksNextWeek: "Sonraki hafta",
  tasksSearchPlaceholder: "Görev veya çalışan ara…",
  tasksNewTask: "Yeni görev",
  tasksNoTasks: "Bu dönemde görev yok",
  tasksNoEmployees: "Görev planlamak için önce çalışan ekleyin",
  tasksOverdueTitle: "Gecikmiş",
  tasksTitle: "Başlık",
  tasksDescription: "Açıklama",
  tasksAssignee: "Atanan",
  tasksStart: "Başlangıç",
  tasksEnd: "Bitiş",
  tasksDate: "Tarih",
  tasksDuration: "Süre",
  tasksScheduleWhen: "Zamanlama",
  tasksDuration30m: "30 dk",
  tasksDuration1h: "1 saat",
  tasksDuration90m: "1,5 saat",
  tasksDuration2h: "2 saat",
  tasksDuration3h: "3 saat",
  tasksCreate: "Görev oluştur",
  tasksSave: "Kaydet",
  tasksComplete: "Tamamlandı işaretle",
  tasksDelete: "Sil",
  tasksEdit: "Düzenle",
  tasksDetail: "Görev detayı",
  tasksStatusPending: "Bekliyor",
  tasksStatusInProgress: "Devam ediyor",
  tasksStatusCompleted: "Tamamlandı",
  tasksStatusCancelled: "İptal",
  tasksCreated: "Görev oluşturuldu",
  tasksUpdated: "Görev güncellendi",
  tasksDeleted: "Görev silindi",
  tasksFailed: "Görev işlemi başarısız",
  tasksTitleRequired: "Başlık zorunludur",
  tasksAssigneeRequired: "Çalışan seçin",
  tasksEndAfterStart: "Bitiş başlangıçtan sonra olmalı",
  tasksSelectAssignee: "Çalışan seçin",
  tasksSearchAssignee: "Çalışan ara…",
  tasksDeleteConfirm: "Bu görevi programdan kaldırmak istiyor musunuz?",
  tasksEmptyDescription: "Açıklama yok",
  tasksCreateHint: "Çalışana zaman aralığı ile atayın",
  tasksTableTask: "Görev",
  tasksTableEmployee: "Çalışan",
  tasksTableDaySchedule: "Günün programı",
  tasksScheduleByEmployee: "Çalışana göre",
  tasksScheduleByTask: "Göreve göre",
  tasksSectionEmployeeHint: "Satırlar personel, sütunlar saatler — detay için bloğa dokunun",
  tasksSectionTaskHint: "Satırlar görevler, saatlik atama özeti",
  tasksLegendTitle: "Renkler",
  tasksScrollHint: "Kaydır",
  tasksHourAssignments: "Saat atamaları",
  tasksNoTasksToday: "Planlanmış görev yok",
  tasksTableTime: "Saat",
  tasksTableStatus: "Durum",
  tasksTableDay: "Gün",
  tasksFilterAll: "Tümü",
  tasksFilterAllShort: "Tümü",
  tasksDayShort: "Gün",
  tasksWeekShort: "Hafta",
  tasksExportShort: "Excel",
  tasksNewShort: "Yeni",
  tasksSearchShort: "Ara",
  tasksScheduleEmployeeShort: "Personel",
  tasksScheduleTaskShort: "Görev",
  tasksHourAssignShort: "Atama",
  tasksRoutineShort: "Rutin",
  tasksPerformanceShort: "Performans",
  tasksAiShort: "AI",
  tasksStatusPendingShort: "Bekliyor",
  tasksStatusInProgressShort: "Devam",
  tasksStatusCompletedShort: "Tamam",
  tasksOverdueShort: "Gecikmiş",
  tasksExpandTable: "Genişlet",
  tasksExpandHint: "Göreve dokunarak görüntüle veya düzenle",
  tasksAiOnTimeShort: "Zamanında",
  tasksAiLateShort: "Geç",
  tasksAiNotFinishedShort: "Açık",
  tasksPerformanceTitle: "Ekip performansı",
  tasksPerformanceSubtitle: "Çalışan bazında zamanında tamamlama oranı",
  tasksPerformanceOnTime: "Zamanında %",
  tasksPerformanceDone: "tamam",
  tasksPerformanceAssigned: "Atanan",
  tasksNoPerformanceData: "Grafik için henüz tamamlanmış görev yok.",
  tasksAiDailyReport: "AI günlük rapor",
  tasksAiDailyReportHint: "Kim zamanında bitirdi, kim geç kaldı, kim bitiremedi — isim isim",
  tasksAiInsight: "AI yorumu",
  tasksAiAnalyzing: "Görev verileri analiz ediliyor…",
  tasksAiAnalysisTitle: "AI analizi",
  tasksAiAnalysisFailed: "AI analizi yüklenemedi. Bağlantınızı kontrol edip tekrar deneyin.",
  tasksAiRetry: "Tekrar dene",
  tasksAiByEmployee: "Çalışan bazında",
  tasksAiOnTime: "Zamanında veya erken bitirenler",
  tasksAiLate: "Geç bitirenler",
  tasksAiNotFinished: "Bitiremeyenler / gecikenler",
  tasksAiNobodyOnTime: "Bu grupta kimse yok.",
  tasksAiNobodyLate: "Geç bitiren yok.",
  tasksAiNobodyOverdue: "Geciken veya açık görev yok.",
  tasksAiBudgetLimited: "Aylık AI kotası doldu. Platform yöneticisiyle iletişime geçin.",
  tasksAiTokenUsage: "Bu ay AI token",
  tasksAiDailyBannerTitle: "Günlük görev raporu hazır",
  tasksAiDailyBannerAction: "Gör",
  tasksAiOverviewLabel: "AI",
  tasksAiOverviewPending: "Günlük rapor 18:00'de",
  tasksExportExcel: "Excel indir",
  tasksExportSuccess: "Excel dosyası indirildi",
  tasksExportEmpty: "Bu dönemde dışa aktarılacak görev yok",
  tasksExportReportTitle: "Guest Pro — Görev Planı Dışa Aktarım",
  tasksExportPeriod: "Dönem",
  tasksExportView: "Görünüm",
  tasksExportHotel: "Otel",
  tasksExportGeneratedAt: "Oluşturulma",
  tasksExportTaskCount: "Planlanmış görev",
  tasksExportRoutineCount: "Rutin şablon",
  tasksExportSheetSummary: "Özet",
  tasksExportSheetTasks: "Görevler",
  tasksExportSheetRoutines: "Rutinler",
  tasksExportColId: "ID",
  tasksExportColStart: "Başlangıç",
  tasksExportColEnd: "Bitiş",
  tasksExportColDurationMin: "Süre (dk)",
  tasksExportColDepartment: "Departman",
  tasksExportColCompletedAt: "Tamamlanma",
  tasksExportColCreatedAt: "Oluşturulma",
  tasksExportColActive: "Aktif",
  tasksExportYes: "Evet",
  tasksExportNo: "Hayır",

  searchPlaceholder: "Ad, oda veya anahtar…",
  searchRoomPlaceholder: "Oda numarası ara…",
  allRooms: "Tüm Odalar",
  room: "Oda",
  clearSearch: "Aramayı temizle",
  clearFilters: "Temizle",

  statusAll: "Tümü",
  statusActive: "Aktif",
  statusUpcoming: "Yaklaşan",
  statusExpired: "Süresi Dolmuş",

  guestsNewestFirst: "{n} misafir · en yeni önce",
  guestsFiltered: "{total} misafirden {n} tanesi",
  noMatches: "Eşleşme yok",
  tryDifferentSearch: "Farklı bir arama veya oda filtresi deneyin.",
  noGuestsYet: "Henüz misafir yok",
  checkInFirstGuest: "Başlamak için ilk misafirinizi giriş yaptırın.",
  checkInGuest: "Misafir Girişi",

  roomsOccupied: "{n} oda dolu",
  roomsFiltered: "{total} odadan {n} tanesi",
  noRoomsMatch: "Oda bulunamadı",
  tryDifferentRoom: "Farklı bir oda numarası veya filtre deneyin.",
  noRoomsYet: "Henüz oda yok",
  roomsAutomatic: "Misafir girişi yapıldığında odalar otomatik görünür.",

  restaurantTitle: "Restoran",
  backToDashboard: "← Panel",

  tabOrders: "Siparişler",
  tabMenu: "Menü",
  tabStock: "Stok",
  tabCare: "Bakım",

  ordersTitle: "Yemek Siparişleri",
  orderStatusOpen: "Açık",
  orderStatusInProgress: "Hazırlanıyor",
  orderStatusResolved: "Tamamlandı",
  advanceToInProgress: "İşleme Al",
  advanceToResolved: "Teslim Edildi",
  noOrders: "Sipariş yok",
  orderMarked: "{label} olarak işaretlendi",
  orderUpdateFailed: "Durum güncellenemedi",
  add: "Ekle",
  nameRequired: "İsim zorunludur",
  addFailed: "Eklenemedi",
  deleted: "Silindi",
  deleteFailed: "Silinemedi",
  updateFailed: "Güncellenemedi",
  confirmDelete: "\"{name}\" silinsin mi?",

  menuItemAdded: "Menü öğesi eklendi",
  addToDailyMenu: "Günlük Menüye Ekle",
  addToRoomServiceMenu: "Oda Servisi Menüsüne Ekle",
  placeholderFoodName: "Yemek adı *",
  placeholderDescription: "Açıklama (opsiyonel)",
  placeholderPrice: "Fiyat (örn: 85.00)",
  placeholderAllergen: "Alerjen bilgisi (opsiyonel)",
  placeholderPortion: "Porsiyon / kalori bilgisi (opsiyonel)",
  makeInactive: "Pasif yap",
  makeActive: "Aktif yap",
  noMenuForDate: "Bu tarih için menü eklenmemiş",
  roomServiceMenuEmpty: "Oda servisi menüsü boş",
  dailyMenuTab: "📅 Günlük Menü",
  roomServiceTab: "🛎 Oda Servisi",
  editMenuItem: "Öğeyi düzenle",
  menuUpdated: "Menü öğesi güncellendi",
  menuUploadPhoto: "Fotoğraf ekle",
  menuRemovePhoto: "Fotoğrafı kaldır",
  menuPhotoSaved: "Fotoğraf kaydedildi",
  menuPhotoRemoved: "Fotoğraf kaldırıldı",
  deleteItem: "Öğeyi sil",
  menuImportExcel: "Excel içe aktar",
  menuDownloadTemplate: "Şablon",
  menuImportPreview: "{count} öğe hazır · {skipped} satır atlandı",
  menuImportConfirm: "Tümünü aktar",
  menuImportDone: "{count} menü öğesi aktarıldı",
  menuImportEmpty: "Dosyada geçerli satır bulunamadı",
  menuEditorSubtitle: "Misafir yemek sipariş ekranında görünür",
  menuSectionBasics: "Temel bilgiler",
  menuSectionPricing: "Fiyatlandırma",
  menuSectionGuestInfo: "Misafir bilgileri",
  menuFieldName: "Ürün adı",
  menuFieldDescription: "Açıklama",
  menuFieldCategory: "Kategori",
  menuFieldPrice: "Fiyat",
  menuFieldPortion: "Porsiyon / kalori",
  menuFieldAllergens: "Alerjen & notlar",
  menuFieldSortOrder: "Sıralama",
  menuFieldCurrency: "Para birimi",
  menuFieldDate: "Geçerli tarih",
  menuFieldVisible: "Misafire görünür",
  menuFieldVisibleHint: "Kapalı öğeler misafir menüsünde gösterilmez",
  menuFieldPhotoHint: "JPEG, PNG veya WebP · en fazla 3 MB",
  menuChangePhoto: "Fotoğrafı değiştir",
  menuPhotoTooLarge: "Görsel 3 MB'dan küçük olmalı",

  catBreakfast: "Kahvaltı",
  catSoup: "Çorba",
  catSalad: "Salata",
  catAppetizer: "Başlangıç",
  catMainCourse: "Ana Yemek",
  catDessert: "Tatlı",
  catBeverage: "İçecek",
  catSnack: "Atışturmalık",
  catOther: "Diğer",

  stockTitle: "Stok Takibi",
  newStockItem: "Yeni Stok Kalemi",
  stockItemAdded: "Stok kalemi eklendi",
  quantityUpdateFailed: "Miktar güncellenemedi",
  confirmDeleteStock: "\"{name}\" stoktan çıkarılsın mı?",
  tagOutOfStock: "Tükendi",
  tagLowStock: "Düşük",
  thresholdLabel: "eşik:",
  lowStockSummary: "{n} üründe düşük/tükenmiş stok uyardısı var",
  noStockItems: "Stok kalemi yok",
  noStockItemsHint: "Ekle butonuna basarak stok takibine başlayın.",
  placeholderProductName: "Ürün adı *",
  placeholderUnit: "Birim (adet, kg, litre…)",
  placeholderCurrentQty: "Mevcut miktar",
  placeholderLowStockThreshold: "Düşük stok uyardı eşiği",
  placeholderNotes: "Notlar (opsiyonel)",

  settingsCategoryGuest: "Misafir deneyimi",
  settingsCategoryGuestDesc: "Misafir ana ekranında gösterilen bilgiler.",
  settingsCategoryTracking: "Konum ve takip",
  settingsCategoryTrackingDesc: "Geofence, ağ kuralları ve misafir konumu.",
  settingsHubIntro: "Misafir deneyimi veya otel takibi için bir kategori seçin.",
  assistantConfigTitle: "Misafir AI asistanı",
  assistantConfigSubtitle: "AI sohbet için otel bilgisi, tesisler ve concierge hizmetleri.",
  assistantConfigLoadFailed: "AI asistan ayarları yüklenemedi.",
  assistantConfigSaveFailed: "AI asistan ayarları kaydedilemedi.",
  assistantConfigSaved: "AI asistan ayarları kaydedildi.",
  assistantConfigSavedComplete: "AI asistan tamamen yapılandırıldı.",
  assistantConfigSave: "AI asistan ayarlarını kaydet",
  assistantConfigProgress: "Otel AI asistanını etkinleştirmek için kurulumu tamamlayın",
  assistantConfigCompleteBanner: "AI asistan kurulumu tamamlandı",
  assistantAboutTitle: "Otel hakkında",
  assistantAboutSubtitle: "Otelinizi öne çıkaranları yazın — konum, tesisler ve avantajlar.",
  assistantAboutLabel: "Otel açıklaması",
  assistantAboutPlaceholder:
    "Örn: Sahil kenarındaki otelimizde spa, açık havuz, aquapark ve gün boyu restoran bulunur. Tarihi merkeze 10 dk mesafede, odalarımızdan deniz manzarası. Aileler ve çiftler için sakin bir kaçamak…",
  assistantAboutMinChars: "Kurulum ilerlemesi için en az {min} karakter",
  assistantAboutTooShort: "Ana ekranın güncellenmesi için en az {min} karakter yazıp kaydedin.",
  assistantCityLabel: "Şehir (yerel öneriler)",
  assistantCityPlaceholder: "İstanbul",
  assistantFacilitiesTitle: "Otel tesisleri",
  assistantFacilitiesSubtitle: "Otelinizde bulunan özellik ve hizmetleri seçin. İsterseniz her biri için detay ekleyebilirsiniz.",
  assistantAddDetail: "Detay ekle",
  assistantHideDetail: "Detayı gizle",
  assistantSectionSave: "Kaydet",
  assistantSectionSaved: "Kaydedildi",
  assistantFacilitiesRequired: "Kaydetmeden önce en az bir tesis seçin.",
  assistantServiceRequired: "Kaydetmeden önce en az bir detay ekleyin (telefon, saat veya not).",
  assistantSectionHome: "Ana sayfa",
  assistantCountryLabel: "Ülke",
  assistantCityFieldLabel: "Şehir",
  assistantCountrySearch: "Ülke ara…",
  assistantCitySearch: "Şehir ara…",
  assistantPickerEmpty: "Sonuç yok",
  assistantUseCustomCity: '"{city}" kullan',
  assistantTaxiTitle: "Taksi servisi",
  assistantTaxiSubtitle: "Taksi düzenlemesi için lobi desk numarası.",
  assistantTaxiPhone: "Taksi lobi telefonu",
  assistantTaxiPhonePlaceholder: "Dahili 120 veya +90 …",
  assistantSpaTitle: "Spa & wellness",
  assistantSpaSubtitle: "AI üzerinden spa rezervasyonu için iletişim ve saatler.",
  assistantSalonTitle: "Salon",
  assistantSalonSubtitle: "Kuaför ve güzellik salonu bilgileri.",
  assistantLaundryTitle: "Çamaşırhane",
  assistantLaundrySubtitle: "Çamaşırhane ve kuru temizleme detayları.",
  assistantOpenTime: "Açılış",
  assistantCloseTime: "Kapanış",
  assistantReservationPhone: "Rezervasyon telefonu",
  assistantNotes: "Notlar",
  assistantOnboardingTitle: "Guest AI asistan kurulumunu tamamlayın",
  assistantOnboardingBody: "Misafirlerin doğru yanıt ve resepsiyon talepleri alması için otel bilgilerini ekleyin.",
  assistantOnboardingCta: "Devam: {step}",
  assistantOnboardingCompleteTitle: "AI asistan %100 — {hotel} misafir asistanı aktif",
  assistantOnboardingCompleteBody: "Misafirler sohbette keşfedebilir, hizmet rezerve edebilir ve otel önerileri alabilir.",
  setupWizardEyebrow: "Başlangıç",
  setupWizardTitle: "Kurulumu tamamla",
  setupWizardSubtitle: "Guest Pro'yu ekibiniz ve misafirleriniz için hazırlamak üzere 4 kısa adım.",
  setupWizardProgress: "Tamamlandı",
  setupWizardContinue: "Devam: {step}",
  setupStepAbout: "Otel hakkında",
  setupStepAboutDesc: "Tesisinizi, konumunuzu ve öne çıkan avantajlarınızı yazın.",
  setupStepServices: "Misafir hizmetleri",
  setupStepServicesDesc: "AI asistanın bahsedebileceği tesis ve hizmetleri seçin.",
  setupStepWifi: "Wi-Fi",
  setupStepWifiDesc: "Misafir oda ataması için Wi-Fi ağlarını ekleyin.",
  setupStepNearby: "Yakın yerler",
  setupStepNearbyDesc: "Otel çevresindeki market, restoran ve gezilecek yerleri ekleyin.",
  setupCompleteTitle: "Kurulum tamamlandı",
  setupCompleteBody: "Guest Pro, {hotel} için %100 hazır — sizin ve misafirlerinizin hizmetinde.",
  setupCompleteCta: "Panele dön",
  settingsHotelLocationTitle: "Otel harita pini",
  settingsHotelLocationSubtitle: "Misafir yakın yerler haritasında otelinizin sabit konumu.",
  settingsHotelLocationHint: "Google Maps'ten koordinatları girin (sağ tık → koordinatlar). Yol tarifi ve mesafe sıralaması bu noktadan başlar.",
  settingsHotelLocationLabel: "Pin etiketi",
  settingsHotelLocationLabelPlaceholder: "Grand Hotel İstanbul",
  settingsHotelLocationSave: "Otel konumunu kaydet",
  settingsHotelLocationSaved: "Otel harita pini kaydedildi.",
  settingsHotelLocationLoadFailed: "Otel konumu yüklenemedi.",
  settingsHotelLocationSaveFailed: "Otel konumu kaydedilemedi.",
  settingsWifiNetworksTitle: "Misafir Wi-Fi ağları",
  settingsWifiNetworksSubtitle: "Check-in sırasında misafirlere atanacak Wi-Fi ağlarını tanımlayın.",
  settingsWifiNetworksHint: "Her ağ için ad ve şifre girin. Personel check-in sırasında misafire bir ağ atar.",
  settingsWifiNetworksLoadFailed: "Wi-Fi ağları yüklenemedi.",
  settingsWifiNetworksSaved: "Wi-Fi ağları kaydedildi.",
  settingsWifiNetworksSaveFailed: "Wi-Fi ağları kaydedilemedi.",
  settingsWifiNetworkRow: "{n}. Ağ",
  settingsWifiName: "Ağ adı",
  settingsWifiPassword: "Wi-Fi şifresi",
  settingsAddWifiNetwork: "Başka ağ ekle",
  settingsSaveWifiNetworks: "Wi-Fi ağlarını kaydet",
  settingsRemoveWifiNetwork: "Ağı kaldır",
  guestWifiNetwork: "Wi-Fi ağı",
  guestWifiNetworkRequired: "Lütfen bir Wi-Fi ağı seçin",
  guestWifiNetworkPlaceholder: "Ağ seçin…",
  guestWifiNetworkEmpty: "Tanımlı Wi-Fi ağı yok",
  optionalLabel: "Opsiyonel",

  settingsNearbyTitle: "Yakın yerler",
  settingsNearbySubtitle: "Misafir haritasında gösterilecek eczane, market, çarşı ve AVM'leri tanımlayın.",
  settingsNearbyHint: "Google Maps'ten koordinatları girin (sağ tık → koordinatlar). Mesafeler yukarıdaki otel harita pininden hesaplanır.",
  settingsNearbyLoadFailed: "Yakın yerler yüklenemedi.",
  settingsNearbySaved: "Yakın yerler kaydedildi.",
  settingsNearbySaveFailed: "Yakın yerler kaydedilemedi.",
  settingsNearbyInvalidCoords: "Her yer için enlem ve boylam geçerli sayı olmalıdır.",
  settingsNearbyName: "Yer adı",
  settingsNearbyNamePlaceholder: "Şehir Eczanesi",
  settingsNearbyType: "Kategori",
  settingsNearbyAddress: "Adres",
  settingsNearbyAddressPlaceholder: "Atatürk Cad. No: 12",
  settingsNearbyDescription: "Kısa açıklama",
  settingsNearbyDescriptionPlaceholder: "7/24 açık",
  settingsNearbyLat: "Enlem",
  settingsNearbyLng: "Boylam",
  settingsNearbyCoordsHint: "Google Maps'ten — lat,lng veya Maps linki yapıştırın",
  settingsNearbyCoordsSwapped: "Enlem ve boylam otomatik düzeltildi (yer değiştirmiş görünüyordu).",
  settingsNearbyTooFarFromHotel: "Yer otel pininden çok uzak (>50 km). Koordinatları kontrol edin.",
  settingsNearbyRow: "Yer {n}",
  settingsNearbyAdd: "Yer ekle",
  settingsNearbySave: "Yakın yerleri kaydet",
  settingsNearbyRemove: "Yeri kaldır",
  settingsNearbyPlaceRequired: "En az bir yakın yer ekleyin; isim ve koordinat zorunludur.",
  settingsNearbyNameRequired: "Yer {n}: isim zorunludur.",
  settingsNearbyCoordsRequired: "Yer {n}: geçerli enlem ve boylam girin.",
  settingsNearbyRowIncomplete: "Yer {n}: isim ve koordinatları tamamlayın veya satırı temizleyin.",
  settingsWifiNetworkRequired: "En az bir Wi-Fi ağı ekleyin; ağ adı ve şifre zorunludur.",
  settingsWifiNameRequired: "Ağ {n}: ağ adı zorunludur.",
  settingsWifiPasswordRequired: "Ağ {n}: şifre zorunludur.",
  settingsWifiRowIncomplete: "Ağ {n}: ağ adı ve şifreyi tamamlayın veya satırı temizleyin.",

  careTitle: "Care Önerileri",
  careRefreshBtn: "AI ile Yenile",
  careRefreshing: "Analiz ediliyor…",
  careRefreshed: "Öneriler güncellendi",
  careRefreshFailed: "Analiz yapılamadı",
  careBannerDescription: "Bu liste misafirlerin gönderdiği Care About Me profillerinden yapay zeka tarafından analiz edilmektedir. Yalnızca yiyecek ve beslenmeyle ilgili öneriler listelenir.",
  careLastAnalysis: "Son analiz: {n} care profili incelendi · {date}",
  careNoInsights: "Henüz öneri yok",
  careNoInsightsHint: "Misafirler Care About Me doldurmaya başladığında AI analiz edecek. Yenile butonuna basarak mevcut profilleri analiz edebilirsiniz.",
  careRoomLabel: "Oda",
};

const ar: StaffTranslations = {
  logout: "تسجيل الخروج",
  loggedOut: "تم تسجيل الخروج",
  settings: "الإعدادات",
  save: "حفظ",
  cancel: "إلغاء",
  language: "اللغة",

  navMenuOpen: "فتح القائمة",
  navMenuTitle: "لوحة التحكم",
  overviewGuests: "الضيوف",
  overviewEmployees: "الموظفون",
  overviewGuestSingular: "ضيف مسجل",
  overviewGuestPlural: "ضيوف مسجلون",
  overviewRefresh: "تحديث الحضور",
  overviewAddEmployee: "إضافة موظف",
  overviewNoEmployees: "لا يوجد موظفون بعد",
  overviewActiveShort: "نشط",
  overviewInactive: "غير نشط",
  overviewTrackingPending: "تتبع الحضور قيد الانتظار",
  overviewGuestKey: "مفتاح الوصول",
  presenceIn: "في الفندق",
  presenceOut: "خارج الفندق",
  presenceUnknown: "غير معروف",
  filterGuests: "تصفية الضيوف",
  filterByRoom: "الغرفة",
  filterByStatus: "حالة الإقامة",
  guestDetails: "تفاصيل الضيف",
  employeeDetails: "تفاصيل الموظف",
  editGuest: "تعديل الضيف",
  editEmployee: "تعديل الموظف",
  renewKeyAction: "تجديد المفتاح ورمز QR",
  copyKeyAction: "نسخ مفتاح الوصول",
  removeGuestAction: "إزالة الضيف",
  copyKeyDone: "تم نسخ المفتاح",
  copyKeyFailed: "فشل النسخ",
  deactivateEmployee: "إلغاء التفعيل",
  reactivateEmployee: "إعادة التفعيل",
  deleteEmployeePerm: "حذف نهائي",
  resetPassword: "إعادة تعيين كلمة المرور",
  resetPasswordFor: "إعادة تعيين كلمة المرور لـ {name}",
  confirmPassword: "تأكيد كلمة المرور",
  confirmPasswordRequired: "أكد كلمة المرور الجديدة",
  passwordsMismatch: "كلمتا المرور غير متطابقتين",
  passwordUpdated: "تم تحديث كلمة المرور",
  deleteDeptManagerTitle: "حذف مدير القسم؟",
  deleteDeptManagerDesc:
    "سيتم إزالة {name} نهائياً. لا يمكن التراجع عن ذلك ولن يتمكن من تسجيل الدخول.",
  deptManagerUpdated: "تم تحديث مدير القسم",

  addStaffMember: "إضافة موظف",
  addStaffSubtitle: "أنشئ بيانات الدخول وعيّن القسم.",
  addStaffMemberBtn: "إضافة",
  staffFirstName: "الاسم الأول",
  staffLastName: "اسم العائلة",
  staffEmail: "البريد الإلكتروني",
  staffTempPassword: "كلمة مرور مؤقتة",
  staffDepartment: "القسم",
  staffMemberAdded: "تمت إضافة الموظف",
  failedCreateStaff: "تعذرت إضافة الموظف",
  staffFirstNameRequired: "الاسم الأول مطلوب",
  staffLastNameRequired: "اسم العائلة مطلوب",
  staffEmailInvalid: "أدخل بريداً إلكترونياً صالحاً",
  staffPasswordMin: "يجب أن تكون كلمة المرور 8 أحرف على الأقل",
  staffDeptRequired: "اختر القسم",

  addGuestSubtitle: "إصدار مفتاح رقمي ورمز QR لتسجيل دخول الضيف.",
  guestRoomNumber: "رقم الغرفة",
  guestCountry: "البلد",
  guestCountrySearch: "ابحث عن بلد…",
  guestCountryEmpty: "لم يُعثر على بلد",
  stayDatesSection: "تواريخ الإقامة",
  stayOptional: "اختياري",
  guestCheckIn: "تسجيل الوصول",
  guestCheckOut: "تسجيل المغادرة",
  generateKeyQrBtn: "إنشاء المفتاح ورمز QR",
  guestCreatedSuccess: "تم تسجيل الضيف",
  failedCreateGuest: "تعذر إنشاء الضيف",
  guestFirstNameRequired: "الاسم الأول مطلوب",
  guestLastNameRequired: "اسم العائلة مطلوب",
  guestRoomRequired: "رقم الغرفة مطلوب",
  guestCountryRequired: "البلد مطلوب",
  checkoutAfterCheckin: "يجب أن يكون المغادرة بعد الوصول",
  passportScanned: "تم مسح جواز السفر",
  passportNationalityManual: "اختر الجنسية يدوياً",
  passportScannedHint: "تم ملء بيانات جواز السفر — راجع وأكمل الحقول المتبقية.",
  passportQrError: "رمز QR غير معروف",
  scannerReadyShort: "الماسح جاهز",

  newGuest: "ضيف جديد",
  restaurantDashboard: "لوحة المطعم",
  quickReport: "تقرير سريع",
  renewingKey: "جارٍ تجديد المفتاح…",
  keyRenewed: "تم تجديد المفتاح",
  failedRenewKey: "فشل تجديد المفتاح",
  guestUpdated: "تم تحديث بيانات الضيف",
  failedUpdateGuest: "فشل تحديث بيانات الضيف",
  guestRemoved: "تمت إزالة الضيف",
  failedRemoveGuest: "فشل إزالة الضيف",

  tabGuests: "الضيوف",
  tabRooms: "الغرف",
  tabRequests: "الطلبات",
  tabFeedback: "التعليقات",
  tabSummary: "الملخص",
  tabTeam: "الموظفون",
  tabTasks: "المهام",

  feedbackBoardTitle: "التعليقات والشكاوى",
  feedbackEmpty: "لا توجد تعليقات من الضيوف بعد",
  feedbackRefresh: "تحديث",
  feedbackTypeComplaint: "شكوى / اقتراح",
  feedbackStatusOpen: "مفتوح",
  feedbackStatusInProgress: "قيد المعالجة",
  feedbackStatusResolved: "مكتمل",
  feedbackStatusUpdateFailed: "تعذر تحديث الحالة",
  feedbackDelete: "حذف",
  feedbackDeleteConfirm: "نعم",
  feedbackDeleteCancel: "لا",
  feedbackDeleted: "تم حذف التعليق",
  feedbackDeleteFailed: "تعذر الحذف",

  scopeGeneralManager: "المدير العام",
  scopeDepartmentManager: "مدير {dept}",
  scopeReception: "الاستقبال",
  scopeRestaurant: "المطعم",

  tasksDayView: "يوم",
  tasksWeekView: "أسبوع",
  tasksPrevDay: "اليوم السابق",
  tasksNextDay: "اليوم التالي",
  tasksPrevWeek: "الأسبوع السابق",
  tasksNextWeek: "الأسبوع التالي",
  tasksSearchPlaceholder: "ابحث عن مهمة أو موظف…",
  tasksNewTask: "مهمة جديدة",
  tasksNoTasks: "لا توجد مهام في هذه الفترة",
  tasksNoEmployees: "أضف موظفين قبل جدولة المهام",
  tasksOverdueTitle: "متأخرة",
  tasksTitle: "العنوان",
  tasksDescription: "الوصف",
  tasksAssignee: "المكلف",
  tasksStart: "البداية",
  tasksEnd: "النهاية",
  tasksDate: "التاريخ",
  tasksDuration: "المدة",
  tasksScheduleWhen: "الجدولة",
  tasksDuration30m: "30 د",
  tasksDuration1h: "ساعة",
  tasksDuration90m: "1.5 س",
  tasksDuration2h: "ساعتان",
  tasksDuration3h: "3 س",
  tasksCreate: "إنشاء مهمة",
  tasksSave: "حفظ",
  tasksComplete: "تعيين كمكتملة",
  tasksDelete: "حذف",
  tasksEdit: "تعديل",
  tasksDetail: "تفاصيل المهمة",
  tasksStatusPending: "قيد الانتظار",
  tasksStatusInProgress: "قيد التنفيذ",
  tasksStatusCompleted: "مكتملة",
  tasksStatusCancelled: "ملغاة",
  tasksCreated: "تم إنشاء المهمة",
  tasksUpdated: "تم تحديث المهمة",
  tasksDeleted: "تمت إزالة المهمة",
  tasksFailed: "فشل إجراء المهمة",
  tasksTitleRequired: "العنوان مطلوب",
  tasksAssigneeRequired: "اختر موظفاً",
  tasksEndAfterStart: "يجب أن تكون النهاية بعد البداية",
  tasksSelectAssignee: "اختر موظفاً",
  tasksSearchAssignee: "ابحث عن موظف…",
  tasksDeleteConfirm: "إزالة هذه المهمة من الجدول؟",
  tasksEmptyDescription: "لا يوجد وصف",
  tasksCreateHint: "عيّن لموظف مع نافذة زمنية",
  tasksTableTask: "المهمة",
  tasksTableEmployee: "الموظف",
  tasksTableDaySchedule: "جدول اليوم",
  tasksScheduleByEmployee: "حسب الموظف",
  tasksScheduleByTask: "حسب المهمة",
  tasksSectionEmployeeHint: "الصفوف موظفون والأعمدة ساعات — اضغط على الخانة للتفاصيل",
  tasksSectionTaskHint: "الصفوف مهام مع ملخص التعيين لكل ساعة",
  tasksLegendTitle: "دليل الألوان",
  tasksScrollHint: "اسحب",
  tasksHourAssignments: "تعيينات الساعة",
  tasksNoTasksToday: "لا مهام مجدولة",
  tasksTableTime: "الوقت",
  tasksTableStatus: "الحالة",
  tasksTableDay: "اليوم",
  tasksFilterAll: "الكل",
  tasksFilterAllShort: "الكل",
  tasksDayShort: "يوم",
  tasksWeekShort: "أسبوع",
  tasksExportShort: "Excel",
  tasksNewShort: "جديد",
  tasksSearchShort: "بحث",
  tasksScheduleEmployeeShort: "موظف",
  tasksScheduleTaskShort: "مهمة",
  tasksHourAssignShort: "تعيين",
  tasksRoutineShort: "روتين",
  tasksPerformanceShort: "أداء",
  tasksAiShort: "AI",
  tasksStatusPendingShort: "انتظار",
  tasksStatusInProgressShort: "نشط",
  tasksStatusCompletedShort: "تم",
  tasksOverdueShort: "متأخر",
  tasksExpandTable: "توسيع",
  tasksExpandHint: "اضغط على المهمة للعرض أو التعديل",
  tasksAiOnTimeShort: "في الوقت",
  tasksAiLateShort: "متأخر",
  tasksAiNotFinishedShort: "مفتوح",
  tasksPerformanceTitle: "أداء الفريق",
  tasksPerformanceSubtitle: "نسبة الإنجاز في الوقت لكل موظف",
  tasksPerformanceOnTime: "في الوقت %",
  tasksPerformanceDone: "منجزة",
  tasksPerformanceAssigned: "المكلفة",
  tasksNoPerformanceData: "لا مهام مكتملة للرسم البياني بعد.",
  tasksAiDailyReport: "تقرير AI اليومي",
  tasksAiDailyReportHint: "من أنجز في الوقت، من تأخر، من لم ينجز — بالاسم",
  tasksAiInsight: "رؤية AI",
  tasksAiAnalyzing: "جاري تحليل بيانات المهام…",
  tasksAiAnalysisTitle: "تحليل AI",
  tasksAiAnalysisFailed: "تعذر تحميل تحليل AI. تحقق من الاتصال وحاول مرة أخرى.",
  tasksAiRetry: "حاول مرة أخرى",
  tasksAiByEmployee: "حسب الموظف",
  tasksAiOnTime: "أنجز في الوقت أو قبله",
  tasksAiLate: "أنجز متأخراً",
  tasksAiNotFinished: "لم ينجز / متأخر",
  tasksAiNobodyOnTime: "لا أحد في هذه المجموعة.",
  tasksAiNobodyLate: "لا أحد أنجز متأخراً.",
  tasksAiNobodyOverdue: "لا مهام متأخرة أو مفتوحة.",
  tasksAiBudgetLimited: "تم استنفاد حصة AI الشهرية. تواصل مع مسؤول المنصة.",
  tasksAiTokenUsage: "رموز AI هذا الشهر",
  tasksAiDailyBannerTitle: "تقرير المهام اليومي جاهز",
  tasksAiDailyBannerAction: "عرض التقرير",
  tasksAiOverviewLabel: "AI",
  tasksAiOverviewPending: "تقرير يومي الساعة 6:00 مساءً",
  tasksExportExcel: "تصدير Excel",
  tasksExportSuccess: "تم تنزيل ملف Excel",
  tasksExportEmpty: "لا مهام للتصدير في هذه الفترة",
  tasksExportReportTitle: "Guest Pro — تصدير جدول المهام",
  tasksExportPeriod: "الفترة",
  tasksExportView: "العرض",
  tasksExportHotel: "الفندق",
  tasksExportGeneratedAt: "تاريخ الإنشاء",
  tasksExportTaskCount: "المهام المجدولة",
  tasksExportRoutineCount: "قوالب الروتين",
  tasksExportSheetSummary: "ملخص",
  tasksExportSheetTasks: "المهام",
  tasksExportSheetRoutines: "الروتين",
  tasksExportColId: "المعرف",
  tasksExportColStart: "البداية",
  tasksExportColEnd: "النهاية",
  tasksExportColDurationMin: "المدة (د)",
  tasksExportColDepartment: "القسم",
  tasksExportColCompletedAt: "اكتمل في",
  tasksExportColCreatedAt: "أُنشئ في",
  tasksExportColActive: "نشط",
  tasksExportYes: "نعم",
  tasksExportNo: "لا",

  searchPlaceholder: "الاسم أو الغرفة أو المفتاح…",
  searchRoomPlaceholder: "ابحث عن رقم الغرفة…",
  allRooms: "جميع الغرف",
  room: "غرفة",
  clearSearch: "مسح البحث",
  clearFilters: "مسح",

  statusAll: "الكل",
  statusActive: "نشط",
  statusUpcoming: "قادم",
  statusExpired: "منتهٍ",

  guestsNewestFirst: "{n} ضيف · الأحدث أولاً",
  guestsFiltered: "{n} من أصل {total} ضيف",
  noMatches: "لا توجد نتائج",
  tryDifferentSearch: "جرّب بحثاً أو فلتر غرفة مختلفاً.",
  noGuestsYet: "لا يوجد ضيوف بعد",
  checkInFirstGuest: "سجّل دخول ضيفك الأول للبدء.",
  checkInGuest: "تسجيل دخول ضيف",

  roomsOccupied: "{n} غرفة مشغولة",
  roomsFiltered: "{n} من أصل {total} غرفة",
  noRoomsMatch: "لا توجد غرف مطابقة",
  tryDifferentRoom: "جرّب رقم غرفة أو فلتراً مختلفاً.",
  noRoomsYet: "لا توجد غرف بعد",
  roomsAutomatic: "تظهر الغرف تلقائياً عند تسجيل دخول الضيوف.",

  restaurantTitle: "المطعم",
  backToDashboard: "→ لوحة التحكم",

  tabOrders: "الطلبات",
  tabMenu: "القائمة",
  tabStock: "المخزون",
  tabCare: "الرعاية",

  ordersTitle: "طلبات الطعام",
  orderStatusOpen: "مفتوح",
  orderStatusInProgress: "قيد التحضير",
  orderStatusResolved: "مكتمل",
  advanceToInProgress: "ابدأ التحضير",
  advanceToResolved: "تم التسليم",
  noOrders: "لا توجد طلبات",
  orderMarked: "تم التحديد كـ {label}",
  orderUpdateFailed: "فشل تحديث الحالة",
  add: "إضافة",
  nameRequired: "الاسم مطلوب",
  addFailed: "فشلت الإضافة",
  deleted: "تم الحذف",
  deleteFailed: "فشل الحذف",
  updateFailed: "فشل التحديث",
  confirmDelete: "حذف \"{name}\"?",

  menuItemAdded: "تمت إضافة عنصر القائمة",
  addToDailyMenu: "أضف إلى القائمة اليومية",
  addToRoomServiceMenu: "أضف إلى قائمة خدمة الغرف",
  placeholderFoodName: "اسم الطعام *",
  placeholderDescription: "وصف (اختياري)",
  placeholderPrice: "السعر (مثلاً: 85.00)",
  placeholderAllergen: "معلومات الحساسية (اختياري)",
  placeholderPortion: "معلومات الحصة / السعرات (اختياري)",
  makeInactive: "جعله غير نشط",
  makeActive: "جعله نشطاً",
  noMenuForDate: "لا توجد قائمة لهذا التاريخ",
  roomServiceMenuEmpty: "قائمة خدمة الغرف فارغة",
  dailyMenuTab: "📅 القائمة اليومية",
  roomServiceTab: "🛎 خدمة الغرف",
  editMenuItem: "تعديل العنصر",
  menuUpdated: "تم تحديث عنصر القائمة",
  menuUploadPhoto: "إضافة صورة",
  menuRemovePhoto: "إزالة الصورة",
  menuPhotoSaved: "تم حفظ الصورة",
  menuPhotoRemoved: "تمت إزالة الصورة",
  deleteItem: "حذف العنصر",
  menuImportExcel: "استيراد Excel",
  menuDownloadTemplate: "قالب",
  menuImportPreview: "{count} عناصر جاهزة · تم تخطي {skipped} صف",
  menuImportConfirm: "استيراد الكل",
  menuImportDone: "تم استيراد {count} عنصر",
  menuImportEmpty: "لم يتم العثور على صفوف صالحة",
  menuEditorSubtitle: "يظهر للضيوف في شاشة طلب الطعام",
  menuSectionBasics: "أساسيات",
  menuSectionPricing: "التسعير",
  menuSectionGuestInfo: "تفاصيل الضيف",
  menuFieldName: "اسم الصنف",
  menuFieldDescription: "الوصف",
  menuFieldCategory: "الفئة",
  menuFieldPrice: "السعر",
  menuFieldPortion: "الحصة / السعرات",
  menuFieldAllergens: "مسببات الحساسية",
  menuFieldSortOrder: "ترتيب العرض",
  menuFieldCurrency: "العملة",
  menuFieldDate: "تاريخ التوفر",
  menuFieldVisible: "مرئي للضيوف",
  menuFieldVisibleHint: "العناصر المخفية لا تظهر في قائمة الضيوف",
  menuFieldPhotoHint: "JPEG أو PNG أو WebP · حد أقصى 3 م.ب.",
  menuChangePhoto: "تغيير الصورة",
  menuPhotoTooLarge: "يجب أن تكون الصورة أقل من 3 م.ب.",

  catBreakfast: "الإفطار",
  catSoup: "الشوربة",
  catSalad: "السلطة",
  catAppetizer: "المقبلات",
  catMainCourse: "الطبق الرئيسي",
  catDessert: "الحلوى",
  catBeverage: "المشروبات",
  catSnack: "الوجبات الخفيفة",
  catOther: "أخرى",

  stockTitle: "تتبع المخزون",
  newStockItem: "عنصر مخزون جديد",
  stockItemAdded: "تمت إضافة عنصر المخزون",
  quantityUpdateFailed: "فشل تحديث الكمية",
  confirmDeleteStock: "إزالة \"{name}\" من المخزون?",
  tagOutOfStock: "نفد المخزون",
  tagLowStock: "منخفض",
  thresholdLabel: "الحد:",
  lowStockSummary: "{n} عنصر بتحذير مخزون منخفض/نافد",
  noStockItems: "لا توجد عناصر مخزون",
  noStockItemsHint: "اضغط إضافة لبدء تتبع المخزون.",
  placeholderProductName: "اسم المنتج *",
  placeholderUnit: "الوحدة (قطعة، كغم، لتر…)",
  placeholderCurrentQty: "الكمية الحالية",
  placeholderLowStockThreshold: "حد تنبيه انخفاض المخزون",
  placeholderNotes: "ملاحظات (اختياري)",

  settingsCategoryGuest: "تجربة الضيف",
  settingsCategoryGuestDesc: "المعلومات المعروضة على الشاشة الرئيسية للضيف.",
  settingsCategoryTracking: "التواجد والتتبع",
  settingsCategoryTrackingDesc: "السياج الجغرافي وقواعد الشبكة وموقع الضيف.",
  settingsHubIntro: "اختر فئة لإعداد تجربة الضيف أو تتبع تواجد الفندق.",
  assistantConfigTitle: "مساعد الذكاء الاصطناعي للضيف",
  assistantConfigSubtitle: "معلومات الفندق والمرافق وخدمات الكونسيرج للدردشة الذكية.",
  assistantConfigLoadFailed: "تعذر تحميل إعدادات المساعد.",
  assistantConfigSaveFailed: "تعذر حفظ إعدادات المساعد.",
  assistantConfigSaved: "تم حفظ إعدادات المساعد.",
  assistantConfigSavedComplete: "اكتمل إعداد المساعد بالكامل.",
  assistantConfigSave: "حفظ إعدادات المساعد",
  assistantConfigProgress: "أكمل الإعداد لتفعيل مساعد الفندق الذكي",
  assistantConfigCompleteBanner: "اكتمل إعداد المساعد",
  assistantAboutTitle: "عن الفندق",
  assistantAboutSubtitle: "اذكر ما يميز فندقك — الموقع والمرافق والمزايا.",
  assistantAboutLabel: "وصف الفندق",
  assistantAboutPlaceholder:
    "مثال: منتجعنا على الشاطئ يضم سبا ومسبحاً مفتوحاً وحديقة مائية ومطعماً طوال اليوم. على بعد 10 دقائق من المدينة القديمة مع إطلالة بحرية من كل غرفة…",
  assistantAboutMinChars: "الحد الأدنى {min} حرفاً لإكمال الإعداد",
  assistantAboutTooShort: "اكتب {min} حرفاً على الأقل ثم احفظ لتحديث لوحة التحكم.",
  assistantCityLabel: "المدينة (توصيات محلية)",
  assistantCityPlaceholder: "دبي",
  assistantFacilitiesTitle: "مرافق الفندق",
  assistantFacilitiesSubtitle: "اختر الميزات والخدمات المتوفرة. يمكنك إضافة تفاصيل اختيارية لكل عنصر.",
  assistantAddDetail: "إضافة تفاصيل",
  assistantHideDetail: "إخفاء التفاصيل",
  assistantSectionSave: "حفظ",
  assistantSectionSaved: "تم الحفظ",
  assistantFacilitiesRequired: "اختر مرفقاً واحداً على الأقل قبل الحفظ.",
  assistantServiceRequired: "أضف تفصيلاً واحداً على الأقل (هاتف أو ساعات أو ملاحظات) قبل الحفظ.",
  assistantSectionHome: "الرئيسية",
  assistantCountryLabel: "الدولة",
  assistantCityFieldLabel: "المدينة",
  assistantCountrySearch: "ابحث عن دولة…",
  assistantCitySearch: "ابحث عن مدينة…",
  assistantPickerEmpty: "لا نتائج",
  assistantUseCustomCity: 'استخدم "{city}"',
  assistantTaxiTitle: "خدمة التاكسي",
  assistantTaxiSubtitle: "رقم مكتب اللوبي لترتيب التاكسي.",
  assistantTaxiPhone: "هاتف لوبي التاكسي",
  assistantTaxiPhonePlaceholder: "تحويلة 120 أو +971 …",
  assistantSpaTitle: "السبا والعافية",
  assistantSpaSubtitle: "معلومات الاتصال والأوقات لحجز السبا عبر الذكاء الاصطناعي.",
  assistantSalonTitle: "صالون",
  assistantSalonSubtitle: "معلومات صالون الحلاقة والتجميل.",
  assistantLaundryTitle: "المغسلة",
  assistantLaundrySubtitle: "تفاصيل الغسيل والتنظيف الجاف.",
  assistantOpenTime: "الافتتاح",
  assistantCloseTime: "الإغلاق",
  assistantReservationPhone: "هاتف الحجز",
  assistantNotes: "ملاحظات",
  assistantOnboardingTitle: "أكمل إعداد مساعد الذكاء الاصطناعي للضيف",
  assistantOnboardingBody: "أضف معلومات الفندق ليحصل الضيوف على إجابات دقيقة وطلبات استقبال.",
  assistantOnboardingCta: "متابعة: {step}",
  assistantOnboardingCompleteTitle: "المساعد 100% — مساعد ضيوف {hotel} نشط",
  assistantOnboardingCompleteBody: "يمكن للضيوف الاستكشاف وحجز الخدمات والحصول على توصيات الفندق في الدردشة.",
  setupWizardEyebrow: "البداية",
  setupWizardTitle: "أكمل الإعداد",
  setupWizardSubtitle: "أربع خطوات سريعة لتشغيل Guest Pro لفريقك وضيوفك.",
  setupWizardProgress: "مكتمل",
  setupWizardContinue: "متابعة: {step}",
  setupStepAbout: "عن الفندق",
  setupStepAboutDesc: "صف منشأتك وموقعك وما يميزها.",
  setupStepServices: "خدمات الضيوف",
  setupStepServicesDesc: "اختر المرافق والخدمات التي يمكن للمساعد الذكي ذكرها.",
  setupStepWifi: "واي فاي",
  setupStepWifiDesc: "أضف شبكات الواي فاي لتعيينها لغرف الضيوف.",
  setupStepNearby: "أماكن قريبة",
  setupStepNearbyDesc: "أضف الأسواق والمطاعم والمعالم قرب الفندق.",
  setupCompleteTitle: "كل شيء جاهز",
  setupCompleteBody: "Guest Pro جاهز بنسبة 100% لخدمتك وخدمة ضيوفك في {hotel}.",
  setupCompleteCta: "العودة إلى لوحة التحكم",
  settingsHotelLocationTitle: "موقع الفندق على الخريطة",
  settingsHotelLocationSubtitle: "الموقع الثابت الذي يظهر للضيف على خريطة الأماكن القريبة.",
  settingsHotelLocationHint: "أدخل إحداثيات GPS من Google Maps. هذه النقطة هي بداية الاتجاهات وترتيب المسافات.",
  settingsHotelLocationLabel: "تسمية الدبوس",
  settingsHotelLocationLabelPlaceholder: "فندق جراند إسطنبول",
  settingsHotelLocationSave: "حفظ موقع الفندق",
  settingsHotelLocationSaved: "تم حفظ موقع الفندق على الخريطة.",
  settingsHotelLocationLoadFailed: "تعذّر تحميل موقع الفندق.",
  settingsHotelLocationSaveFailed: "تعذّر حفظ موقع الفندق.",
  settingsWifiNetworksTitle: "شبكات Wi-Fi للضيوف",
  settingsWifiNetworksSubtitle: "عرّف شبكات Wi-Fi التي يمكن تعيينها للضيوف عند تسجيل الوصول.",
  settingsWifiNetworksHint: "كل شبكة تحتاج اسمًا وكلمة مرور. يعيّن الموظف شبكة واحدة لكل ضيف عند تسجيل الوصول.",
  settingsWifiNetworksLoadFailed: "تعذّر تحميل شبكات Wi-Fi.",
  settingsWifiNetworksSaved: "تم حفظ شبكات Wi-Fi.",
  settingsWifiNetworksSaveFailed: "تعذّر حفظ شبكات Wi-Fi.",
  settingsWifiNetworkRow: "الشبكة {n}",
  settingsWifiName: "اسم الشبكة",
  settingsWifiPassword: "كلمة مرور Wi-Fi",
  settingsAddWifiNetwork: "إضافة شبكة أخرى",
  settingsSaveWifiNetworks: "حفظ شبكات Wi-Fi",
  settingsRemoveWifiNetwork: "إزالة الشبكة",
  guestWifiNetwork: "شبكة Wi-Fi",
  guestWifiNetworkRequired: "يرجى اختيار شبكة Wi-Fi",
  guestWifiNetworkPlaceholder: "اختر الشبكة…",
  guestWifiNetworkEmpty: "لا توجد شبكات Wi-Fi مُعرَّفة",
  optionalLabel: "اختياري",

  settingsNearbyTitle: "الأماكن القريبة",
  settingsNearbySubtitle: "حدّد الصيدليات والأسواق والمراكز التجارية المعروضة على خريطة الضيف.",
  settingsNearbyHint: "أدخل إحداثيات GPS من Google Maps. يرى الضيوف الأماكن مرتبة حسب المسافة.",
  settingsNearbyLoadFailed: "تعذّر تحميل الأماكن القريبة.",
  settingsNearbySaved: "تم حفظ الأماكن القريبة.",
  settingsNearbySaveFailed: "تعذّر حفظ الأماكن القريبة.",
  settingsNearbyInvalidCoords: "يجب أن تكون خطوط الطول والعرض أرقاماً صالحة.",
  settingsNearbyName: "اسم المكان",
  settingsNearbyNamePlaceholder: "صيدلية المدينة",
  settingsNearbyType: "الفئة",
  settingsNearbyAddress: "العنوان",
  settingsNearbyAddressPlaceholder: "123 الشارع الرئيسي",
  settingsNearbyDescription: "وصف قصير",
  settingsNearbyDescriptionPlaceholder: "مفتوح 24 ساعة",
  settingsNearbyLat: "خط العرض",
  settingsNearbyLng: "خط الطول",
  settingsNearbyCoordsHint: "من Google Maps — الصق lat,lng أو رابط الخريطة",
  settingsNearbyCoordsSwapped: "تم تصحيح خط العرض والطول تلقائياً (يبدو أنهما مقلوبان).",
  settingsNearbyTooFarFromHotel: "المكان بعيد جداً عن موقع الفندق (>50 كم). تحقق من الإحداثيات.",
  settingsNearbyRow: "مكان {n}",
  settingsNearbyAdd: "إضافة مكان",
  settingsNearbySave: "حفظ الأماكن القريبة",
  settingsNearbyRemove: "إزالة المكان",
  settingsNearbyPlaceRequired: "أضف مكاناً قريباً واحداً على الأقل مع الاسم والإحداثيات.",
  settingsNearbyNameRequired: "المكان {n}: الاسم مطلوب.",
  settingsNearbyCoordsRequired: "المكان {n}: أدخل خط عرض وطول صالحين.",
  settingsNearbyRowIncomplete: "المكان {n}: أكمل الاسم والإحداثيات أو امسح الصف.",
  settingsWifiNetworkRequired: "أضف شبكة Wi-Fi واحدة على الأقل مع الاسم وكلمة المرور.",
  settingsWifiNameRequired: "الشبكة {n}: الاسم مطلوب.",
  settingsWifiPasswordRequired: "الشبكة {n}: كلمة المرور مطلوبة.",
  settingsWifiRowIncomplete: "الشبكة {n}: أكمل الاسم وكلمة المرور أو امسح الصف.",

  careTitle: "توصيات الرعاية",
  careRefreshBtn: "تحديث بالذكاء الاصطناعي",
  careRefreshing: "جارٍ التحليل…",
  careRefreshed: "تم تحديث التوصيات",
  careRefreshFailed: "فشل التحليل",
  careBannerDescription: "تُحلَّل هذه القائمة بواسطة الذكاء الاصطناعي من ملفات Care About Me.",
  careLastAnalysis: "آخر تحليل: تمت مراجعة {n} ملف · {date}",
  careNoInsights: "لا توجد توصيات بعد",
  careNoInsightsHint: "عندما يبدأ الضيوف في ملء Care About Me، سيقوم الذكاء الاصطناعي بتحليلها.",
  careRoomLabel: "غرفة",
};

const DICT: Record<StaffLocale, StaffTranslations> = { en, tr, ar };

/** Get the staff translation dictionary for the given locale. Falls back to English. */
export function getStaffTranslations(locale: string): StaffTranslations {
  return DICT[locale as StaffLocale] ?? DICT.en;
}

/** Inline template substitution: replace {key} placeholders. */
export function tStaff(template: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replaceAll(`{${k}}`, String(v)),
    template
  );
}

/** Locale-aware label for dashboard role line (scope hierarchy). */
export function staffScopeLabel(
  scope: StaffScopeKind,
  department: string | null | undefined,
  t: StaffTranslations,
): string {
  const deptLabel =
    department && department in DEPARTMENT_LABELS
      ? DEPARTMENT_LABELS[department as StaffDepartment]
      : (department ?? "");

  switch (scope) {
    case "general_manager":
      return t.scopeGeneralManager;
    case "department_manager":
      return tStaff(t.scopeDepartmentManager, { dept: deptLabel || "Department" });
    case "reception":
      return t.scopeReception;
    case "restaurant_personnel":
      return t.scopeRestaurant;
    case "staff_personnel":
      return deptLabel || "Staff";
  }
}

/** Locale-aware menu category label map derived from t. */
export function getMenuCategoryLabels(t: StaffTranslations): Record<string, string> {
  return {
    BREAKFAST:   t.catBreakfast,
    SOUP:        t.catSoup,
    SALAD:       t.catSalad,
    APPETIZER:   t.catAppetizer,
    MAIN_COURSE: t.catMainCourse,
    DESSERT:     t.catDessert,
    BEVERAGE:    t.catBeverage,
    SNACK:       t.catSnack,
    OTHER:       t.catOther,
  };
}
