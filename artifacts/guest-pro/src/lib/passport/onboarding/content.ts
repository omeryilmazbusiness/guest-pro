import type { PassportOnboardingLocale, PassportOnboardingStrings } from "./types";

export const PASSPORT_ONBOARDING_STRINGS: Record<
  PassportOnboardingLocale,
  PassportOnboardingStrings
> = {
  tr: {
    welcomeTapHint: "Devam etmek için bu dilde ekrana dokunun",
    introTitle: "Hızlı kayıt",
    introSubtitle: "Guest Pro ile resepsiyonda dakikalar içinde check-in",
    introItems: [
      {
        icon: "sparkles",
        title: "Guest Pro nedir?",
        body: "Otelinizin premium dijital concierge ve hızlı misafir kayıt platformudur.",
      },
      {
        icon: "scan",
        title: "Nasıl kayıt olacaksınız?",
        body: "Pasaportunuzun altındaki MRZ satırlarını kamerayla okutursunuz — form doldurmanız gerekmez.",
      },
      {
        icon: "camera",
        title: "Neden kamera?",
        body: "MRZ satırlarını yalnızca cihazınızda okumak için kamera gerekir; görüntü sunucuya gönderilmez.",
      },
      {
        icon: "qr",
        title: "Sonraki adım",
        body: "Okunan bilgiler anında bir QR koda dönüşür; bu kodu resepsiyona gösterirsiniz.",
      },
      {
        icon: "reception",
        title: "Resepsiyonda",
        body: "Personel QR kodunuzu tarayarak kaydınızı saniyeler içinde tamamlar.",
      },
    ],
    introContinue: "Anladım, devam et",
    consentTitle: "Gizlilik ve izinler",
    consentIntro:
      "Devam etmeden önce verilerinizin nasıl işlendiğini lütfen okuyun.",
    consentBullets: [
      "Pasaport verileriniz sunucularımızda saklanmaz — yalnızca cihazınızda okunur ve QR kodu oluşturulur.",
      "Hassas verilerinizi üçüncü taraflarla paylaşmayız, satmayız ve reklam amacıyla kullanmayız.",
      "Kamera erişimi yalnızca pasaport MRZ okuma anında kullanılır; arka planda kayıt yapılmaz.",
      "Konum verisi toplanmaz; yalnızca kayıt akışı için gerekli minimum işlemler yapılır.",
      "QR kodu resepsiyona gösterildiğinde otel personeli kaydı tamamlar — veri sizin kontrolünüzdedir.",
    ],
    consentAccept: "Kabul et ve devam et",
    scanTitle: "Pasaport tarama",
    scanInstruction: "Pasaportunuzu çerçeveye yerleştirin",
    showReception: "Bu QR kodu resepsiyona gösterin",
    waitMessage: "Check-in işleminiz tamamlanırken lütfen bekleyin",
    scanAgain: "Tekrar tara",
  },
  en: {
    welcomeTapHint: "Tap the screen while your language is shown",
    introTitle: "Quick registration",
    introSubtitle: "Check in at reception in minutes with Guest Pro",
    introItems: [
      {
        icon: "sparkles",
        title: "What is Guest Pro?",
        body: "Your hotel's premium digital concierge and fast guest registration platform.",
      },
      {
        icon: "scan",
        title: "How you register",
        body: "Scan the MRZ lines at the bottom of your passport — no forms to fill in.",
      },
      {
        icon: "camera",
        title: "Why camera access?",
        body: "The camera reads MRZ lines only on your device; images are not uploaded to our servers.",
      },
      {
        icon: "qr",
        title: "Next step",
        body: "Your details become a QR code instantly — show it at reception.",
      },
      {
        icon: "reception",
        title: "At reception",
        body: "Staff scan your QR to complete registration in seconds.",
      },
    ],
    introContinue: "I understand, continue",
    consentTitle: "Privacy & permissions",
    consentIntro: "Please read how we handle your data before you continue.",
    consentBullets: [
      "Your passport data is never stored on our servers — it is read on your device and encoded into a QR code only.",
      "We do not sell, share, or use your sensitive data with third parties for advertising.",
      "Camera access is used only while scanning the passport MRZ; no background recording.",
      "Location data is not collected; only the minimum processing required for registration.",
      "When you show the QR at reception, hotel staff complete your check-in — you stay in control.",
    ],
    consentAccept: "Accept and continue",
    scanTitle: "Passport scan",
    scanInstruction: "Place your passport inside the frame",
    showReception: "Show this QR to reception",
    waitMessage: "Please wait while we check you in",
    scanAgain: "Scan again",
  },
  ar: {
    welcomeTapHint: "اضغط على الشاشة عند ظهور لغتك",
    introTitle: "تسجيل سريع",
    introSubtitle: "سجّل في الاستقبال خلال دقائق مع Guest Pro",
    introItems: [
      {
        icon: "sparkles",
        title: "ما هو Guest Pro؟",
        body: "منصة الكونسيرج الرقمي الفاخرة وتسجيل الضيوف السريع في فندقك.",
      },
      {
        icon: "scan",
        title: "كيف تسجّل؟",
        body: "امسح أسطر MRZ في أسفل جواز السفر — دون تعبئة نماذج.",
      },
      {
        icon: "camera",
        title: "لماذا الكاميرا؟",
        body: "لقراءة MRZ على جهازك فقط؛ لا يتم رفع الصور إلى خوادمنا.",
      },
      {
        icon: "qr",
        title: "الخطوة التالية",
        body: "تتحول بياناتك فورًا إلى رمز QR — اعرضه في الاستقبال.",
      },
      {
        icon: "reception",
        title: "في الاستقبال",
        body: "يمسح الموظفون رمز QR لإكمال التسجيل في ثوانٍ.",
      },
    ],
    introContinue: "فهمت، متابعة",
    consentTitle: "الخصوصية والأذونات",
    consentIntro: "يرجى قراءة كيفية معالجة بياناتك قبل المتابعة.",
    consentBullets: [
      "لا نخزّن بيانات جوازك على خوادمنا — تُقرأ على جهازك وتُرمَّز في QR فقط.",
      "لا نبيع أو نشارك بياناتك الحساسة مع أطراف ثالثة للإعلانات.",
      "الكاميرا تُستخدم فقط أثناء مسح MRZ؛ لا تسجيل في الخلفية.",
      "لا نجمع الموقع؛ الحد الأدنى من المعالجة للتسجيل فقط.",
      "عند عرض QR في الاستقبال، يكمل الموظفون تسجيلك — أنت تتحكم ببياناتك.",
    ],
    consentAccept: "أوافق وأتابع",
    scanTitle: "مسح جواز السفر",
    scanInstruction: "ضع جوازك داخل الإطار",
    showReception: "اعرض هذا الرمز في الاستقبال",
    waitMessage: "يرجى الانتظار أثناء إتمام تسجيل الوصول",
    scanAgain: "إعادة المسح",
  },
  ur: {
    welcomeTapHint: "اپنی زبان نظر آئے تو اسکرین پر ٹیپ کریں",
    introTitle: "فوری رجسٹریشن",
    introSubtitle: "Guest Pro کے ساتھ منٹوں میں ریسپشن پر چیک اِن",
    introItems: [
      {
        icon: "sparkles",
        title: "Guest Pro کیا ہے؟",
        body: "آپ کے ہوٹل کا پریمیم ڈیجیٹل کونسیرج اور تیز مہمان رجسٹریشن پلیٹ فارم۔",
      },
      {
        icon: "scan",
        title: "رجسٹریشن کیسے؟",
        body: "پاسپورٹ کے نیچے MRZ لائنیں سکین کریں — کوئی فارم نہیں۔",
      },
      {
        icon: "camera",
        title: "کیمرہ کیوں؟",
        body: "MRZ صرف آپ کے ڈیوائس پر پڑھا جاتا ہے؛ تصویر سرور پر نہیں جاتی۔",
      },
      {
        icon: "qr",
        title: "اگلا قدم",
        body: "ڈیٹا فوری QR کوڈ بن جاتا ہے — ریسپشن پر دکھائیں۔",
      },
      {
        icon: "reception",
        title: "ریسپشن پر",
        body: "عملہ QR سکین کر کے سیکنڈوں میں رجسٹریشن مکمل کرتا ہے۔",
      },
    ],
    introContinue: "سمجھ گیا، جاری رکھیں",
    consentTitle: "رازداری اور اجازتیں",
    consentIntro: "جاری رکھنے سے پہلے ڈیٹا کے استعمال کو پڑھیں۔",
    consentBullets: [
      "پاسپورٹ ڈیٹا سرور پر محفوظ نہیں — صرف ڈیوائس پر پڑھ کر QR بنایا جاتا ہے۔",
      "حساس ڈیٹا تیسرے فریق کو فروخت یا اشتراک نہیں ہوتا۔",
      "کیمرہ صرف MRZ سکین کے لیے؛ پس منظر میں ریکارڈنگ نہیں۔",
      "لوکیشن جمع نہیں؛ صرف رجسٹریشن کے لیے کم از کم پروسیسنگ۔",
      "QR ریسپشن پر دکھانے پر عملہ چیک اِن مکمل کرتا ہے — آپ کنٹرول میں ہیں۔",
    ],
    consentAccept: "قبول کریں اور جاری رکھیں",
    scanTitle: "پاسپورٹ سکین",
    scanInstruction: "پاسپورٹ کو فریم میں رکھیں",
    showReception: "یہ QR ریسپشن کو دکھائیں",
    waitMessage: "چیک اِن مکمل ہونے تک انتظار کریں",
    scanAgain: "دوبارہ سکین",
  },
};

export function getPassportOnboardingStrings(
  locale: PassportOnboardingLocale,
): PassportOnboardingStrings {
  return PASSPORT_ONBOARDING_STRINGS[locale];
}
