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
  tabSummary: string;
  tabTeam: string;
  tabTasks: string;

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
  tabSummary: "Summary",
  tabTeam: "Employees",
  tabTasks: "Tasks",

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
  tabSummary: "Özet",
  tabTeam: "Çalışanlar",
  tabTasks: "Görevler",

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
  tabSummary: "الملخص",
  tabTeam: "الموظفون",
  tabTasks: "المهام",

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
